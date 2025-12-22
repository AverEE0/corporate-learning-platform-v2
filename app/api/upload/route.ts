import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Настройка для больших файлов
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 минут для больших файлов

// Отключаем body parsing для больших файлов (Next.js обработает FormData автоматически)
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const token = (await cookies()).get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Неверный токен' },
        { status: 401 }
      )
    }

    // Для больших файлов используем formData с обработкой ошибок
    // Next.js автоматически парсит FormData
    const contentType = request.headers.get('content-type') || ''
    
    // Логируем для отладки (только если не multipart/form-data)
    if (!contentType.includes('multipart/form-data')) {
      console.warn('Upload request Content-Type:', contentType, '- может быть проблема, но попытаемся обработать')
    }
    
    let formData: FormData | null = null
    try {
      formData = await request.formData()
    } catch (formDataError: any) {
      console.error('Error parsing formData:', {
        message: formDataError?.message,
        name: formDataError?.name,
        contentType,
        stack: formDataError?.stack?.split('\n').slice(0, 3),
      })
      return NextResponse.json(
        { success: false, error: `Ошибка обработки данных: ${formDataError?.message || 'Неверный формат данных'}` },
        { status: 400 }
      )
    }

    if (!formData) {
      return NextResponse.json(
        { success: false, error: 'Неверный формат данных' },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не предоставлен' },
        { status: 400 }
      )
    }

    // Валидация типа файла
    if (!file.name || file.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Имя файла не может быть пустым' },
        { status: 400 }
      )
    }

    // Проверка размера (100MB)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `Файл слишком большой (максимум ${maxSize / 1024 / 1024}MB)` },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Файл пустой' },
        { status: 400 }
      )
    }

    // Проверка допустимых типов файлов
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.mp4', '.mp3', '.webm']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: 'Недопустимый тип файла. Разрешенные типы: ' + allowedExtensions.join(', ') },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Создаем уникальное имя файла
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100)
    const fileId = `${Date.now()}_${user.id}_${sanitizedName}`
    const uploadDir = process.env.UPLOAD_DIR || './uploads'

    // Создаем папку если не существует
    try {
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true, mode: 0o755 })
      }
    } catch (mkdirError: any) {
      console.error('Error creating upload directory:', mkdirError)
      return NextResponse.json(
        { success: false, error: 'Ошибка создания директории для загрузки' },
        { status: 500 }
      )
    }

    const filePath = join(uploadDir, fileId)
    
    try {
      await writeFile(filePath, buffer)
    } catch (writeError: any) {
      console.error('Error writing file:', writeError)
      return NextResponse.json(
        { success: false, error: 'Ошибка сохранения файла на сервере' },
        { status: 500 }
      )
    }

    const publicUrl = `/api/files/${fileId}`

    return NextResponse.json({
      success: true,
      file: {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
      },
      url: publicUrl,
    })
  } catch (error: any) {
    console.error('Upload error:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      stack: error?.stack?.split('\n').slice(0, 10),
    })
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Ошибка загрузки файла',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    )
  }
}

