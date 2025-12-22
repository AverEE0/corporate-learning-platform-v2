import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { certificateDb, progressDb, executeQuery } from '@/lib/database'
import { generateCertificateHTML } from '@/lib/pdf-generator'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

    const { userId, courseId } = await request.json()

    if (!userId || !courseId) {
      return NextResponse.json(
        { success: false, error: 'ID пользователя и курса обязательны' },
        { status: 400 }
      )
    }

    // Проверяем, завершен ли курс
    const progress = await progressDb.getUserProgress(userId, courseId)
    const userProgress = Array.isArray(progress) ? progress[0] : progress

    if (!userProgress || !userProgress.completed) {
      return NextResponse.json(
        { success: false, error: 'Курс не завершен' },
        { status: 400 }
      )
    }

    // Получаем данные пользователя и курса
    const [userData, courseData] = await Promise.all([
      executeQuery('SELECT first_name, last_name FROM users WHERE id = $1', [userId]),
      executeQuery('SELECT title FROM courses WHERE id = $1', [courseId]),
    ])

    const student = Array.isArray(userData) ? userData[0] : userData
    const course = Array.isArray(courseData) ? courseData[0] : courseData

    if (!student || !course) {
      return NextResponse.json(
        { success: false, error: 'Пользователь или курс не найден' },
        { status: 404 }
      )
    }

    // Генерируем номер сертификата
    const certificateNumber = `CERT-${courseId}-${userId}-${Date.now()}`

    // Генерируем HTML сертификата
    const certificateHTML = generateCertificateHTML({
      studentName: `${student.first_name} ${student.last_name}`,
      courseName: course.title,
      certificateNumber,
      issueDate: new Date().toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      score: userProgress.score,
      completionPercentage: userProgress.completion_percentage,
    })

    // Сохраняем HTML во временный файл
    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    const certificatesDir = join(uploadDir, 'certificates')
    
    try {
      if (!existsSync(certificatesDir)) {
        await mkdir(certificatesDir, { recursive: true })
      }
    } catch (error) {
      console.error('Error creating certificates directory:', error)
    }

    const fileName = `${certificateNumber}.html`
    const filePath = join(certificatesDir, fileName)

    try {
      await writeFile(filePath, certificateHTML, 'utf-8')
    } catch (error) {
      console.error('Error saving certificate file:', error)
    }

    // Создаем запись о сертификате
    const certificate = await certificateDb.createCertificate({
      userId,
      courseId,
      certificateNumber,
      filePath: `/api/certificates/download/${certificateNumber}`,
      metadata: {
        score: userProgress.score,
        completionPercentage: userProgress.completion_percentage,
        issuedBy: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      certificate,
      html: certificateHTML,
      downloadUrl: `/api/certificates/download/${certificateNumber}`,
      message: 'Сертификат успешно создан',
    })
  } catch (error: any) {
    console.error('Error generating certificate:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
