import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { syncCourseCompletionToBitrix24 } from '@/lib/bitrix24'
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

    const { userId, courseId } = await request.json()

    if (!userId || !courseId) {
      return NextResponse.json(
        { success: false, error: 'ID пользователя и курса обязательны' },
        { status: 400 }
      )
    }

    // Получаем настройки Bitrix24
    const settings = await executeQuery(
      `SELECT bitrix24_enabled, bitrix24_webhook_url FROM platform_settings 
       WHERE key IN ('bitrix24Enabled', 'bitrix24WebhookUrl')
       ORDER BY key`
    )

    const bitrixSettings: any = {}
    if (Array.isArray(settings)) {
      settings.forEach((row: any) => {
        const key = row.key.replace('bitrix24', '').toLowerCase()
        bitrixSettings[key] = row.value === 'true' || row.value === true ? true : row.value
      })
    }

    const webhookUrl = bitrixSettings.webhookUrl || process.env.BITRIX24_WEBHOOK_URL || ''
    const enabled = bitrixSettings.enabled || process.env.BITRIX24_ENABLED === 'true'

    if (!enabled || !webhookUrl) {
      return NextResponse.json(
        { success: false, error: 'Bitrix24 интеграция не настроена или отключена' },
        { status: 400 }
      )
    }

    // Получаем данные пользователя и курса
    const [userData, courseData, progressData] = await Promise.all([
      executeQuery('SELECT first_name, last_name, email FROM users WHERE id = $1', [userId]),
      executeQuery('SELECT title FROM courses WHERE id = $1', [courseId]),
      executeQuery(
        `SELECT score, completed_at FROM user_progress 
         WHERE user_id = $1 AND course_id = $2 AND completed = true
         ORDER BY completed_at DESC LIMIT 1`,
        [userId, courseId]
      ),
    ])

    const student = Array.isArray(userData) ? userData[0] : userData
    const course = Array.isArray(courseData) ? courseData[0] : courseData
    const progress = Array.isArray(progressData) ? progressData[0] : progressData

    if (!student || !course) {
      return NextResponse.json(
        { success: false, error: 'Пользователь или курс не найден' },
        { status: 404 }
      )
    }

    if (!progress || !progress.completed_at) {
      return NextResponse.json(
        { success: false, error: 'Курс не завершен' },
        { status: 400 }
      )
    }

    // Синхронизируем с Bitrix24
    try {
      const result = await syncCourseCompletionToBitrix24(
        { webhookUrl },
        {
          firstName: student.first_name,
          lastName: student.last_name,
          email: student.email,
        },
        {
          title: course.title,
          score: progress.score,
          completionDate: new Date(progress.completed_at).toLocaleDateString('ru-RU'),
        }
      )

      return NextResponse.json({
        success: true,
        message: 'Данные синхронизированы с Bitrix24',
        dealId: result.id,
      })
    } catch (error: any) {
      console.error('Bitrix24 sync error:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Ошибка синхронизации с Bitrix24' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error syncing to Bitrix24:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

