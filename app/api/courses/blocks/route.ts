import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { executeQuery } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const token = (await cookies()).get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json(
        { success: false, error: 'Нет доступа' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { lessonId, type, title, content, orderIndex } = body

    // Улучшенная валидация
    if (!lessonId || isNaN(parseInt(String(lessonId)))) {
      return NextResponse.json(
        { success: false, error: 'ID урока обязателен и должен быть числом' },
        { status: 400 }
      )
    }

    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Тип блока обязателен и должен быть строкой' },
        { status: 400 }
      )
    }

    const allowedTypes = ['text', 'video', 'audio', 'image', 'quiz', 'question']
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Недопустимый тип блока. Разрешенные типы: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Название блока обязательно и должно быть строкой' },
        { status: 400 }
      )
    }

    if (title.trim().length > 255) {
      return NextResponse.json(
        { success: false, error: 'Название блока не должно превышать 255 символов' },
        { status: 400 }
      )
    }

    // Проверяем существование урока
    const lessonCheck = await executeQuery('SELECT id FROM lessons WHERE id = $1', [parseInt(String(lessonId))])
    if (!Array.isArray(lessonCheck) || lessonCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Урок не найден' },
        { status: 404 }
      )
    }

    const parsedOrderIndex = orderIndex !== undefined && orderIndex !== null 
      ? parseInt(String(orderIndex)) 
      : 0

    if (isNaN(parsedOrderIndex) || parsedOrderIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'Порядковый номер должен быть неотрицательным числом' },
        { status: 400 }
      )
    }

    // Валидация и сериализация контента
    let contentJson = {}
    if (content) {
      try {
        // Если content уже объект, используем его напрямую
        if (typeof content === 'object' && !Array.isArray(content)) {
          contentJson = content
        } else if (typeof content === 'string') {
          // Пытаемся распарсить как JSON
          try {
            contentJson = JSON.parse(content)
            // Если после парсинга это не объект, значит это была строка HTML
            if (typeof contentJson !== 'object' || Array.isArray(contentJson)) {
              // Это была строка HTML, сохраняем как объект с полем text
              contentJson = { text: content }
            }
          } catch {
            // Если не JSON, значит это HTML строка
            contentJson = { text: content }
          }
        } else {
          contentJson = {}
        }
      } catch (parseError) {
        console.error('Error parsing content:', parseError)
        // Если ошибка, пытаемся сохранить как строку в поле text
        contentJson = typeof content === 'string' ? { text: content } : {}
      }
    }
    
    console.log('Сохранение блока, тип:', type, 'контент:', JSON.stringify(contentJson).substring(0, 200))

    const query = `
      INSERT INTO blocks (lesson_id, type, title, content, order_index)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `

    const result = await executeQuery(query, [
      parseInt(String(lessonId)),
      type.trim(),
      title.trim(),
      JSON.stringify(contentJson),
      parsedOrderIndex,
    ])

    if (!result || (Array.isArray(result) && result.length === 0)) {
      throw new Error('Блок не был создан')
    }

    return NextResponse.json({
      success: true,
      block: Array.isArray(result) ? result[0] : result,
    })
  } catch (error: any) {
    console.error('Error creating block:', {
      message: error?.message,
      stack: error?.stack?.split('\n').slice(0, 5),
    })
    return NextResponse.json(
      { success: false, error: error?.message || 'Ошибка создания блока' },
      { status: 500 }
    )
  }
}

