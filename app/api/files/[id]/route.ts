import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Валидация ID файла
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json(
        { error: 'Неверный ID файла' },
        { status: 400 }
      )
    }

    // Проверка на path traversal атаки
    if (id.includes('..') || id.includes('/') || id.includes('\\')) {
      return NextResponse.json(
        { error: 'Недопустимый путь к файлу' },
        { status: 400 }
      )
    }

    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    const filePath = join(uploadDir, id)

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 404 }
      )
    }

    const fileBuffer = await readFile(filePath)

    // Проверка размера файла (защита от чтения огромных файлов)
    // Увеличиваем до 500MB для поддержки больших видео файлов
    const maxFileSize = 500 * 1024 * 1024 // 500MB
    if (fileBuffer.length > maxFileSize) {
      return NextResponse.json(
        { error: 'Файл слишком большой для просмотра' },
        { status: 413 }
      )
    }

    // Определяем MIME тип
    const ext = id.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }

    const contentType = mimeTypes[ext || ''] || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000',
        'Content-Disposition': `inline; filename="${id}"`,
      },
    })
  } catch (error: any) {
    console.error('File serve error:', {
      message: error?.message,
      code: error?.code,
    })
    
    if (error?.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || 'Ошибка получения файла' },
      { status: 500 }
    )
  }
}

