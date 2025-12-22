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
    const { courseId, title, description, orderIndex } = body

    // Улучшенная валидация
    if (!courseId || isNaN(parseInt(String(courseId)))) {
      return NextResponse.json(
        { success: false, error: 'ID курса обязателен и должен быть числом' },
        { status: 400 }
      )
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Название урока обязательно и должно быть строкой' },
        { status: 400 }
      )
    }

    if (title.trim().length > 255) {
      return NextResponse.json(
        { success: false, error: 'Название урока не должно превышать 255 символов' },
        { status: 400 }
      )
    }

    if (description && typeof description === 'string' && description.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Описание урока не должно превышать 5000 символов' },
        { status: 400 }
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

    // Проверяем существование курса
    const courseCheck = await executeQuery('SELECT id FROM courses WHERE id = $1', [parseInt(String(courseId))])
    if (!Array.isArray(courseCheck) || courseCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Курс не найден' },
        { status: 404 }
      )
    }

    const query = `
      INSERT INTO lessons (course_id, title, description, order_index)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `

    const result = await executeQuery(query, [
      parseInt(String(courseId)),
      title.trim(),
      description?.trim() || '',
      parsedOrderIndex,
    ])

    if (!result || (Array.isArray(result) && result.length === 0)) {
      throw new Error('Урок не был создан')
    }

    return NextResponse.json({
      success: true,
      lesson: Array.isArray(result) ? result[0] : result,
    })
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

