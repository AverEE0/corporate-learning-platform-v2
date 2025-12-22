import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { sendTelegramMessage } from '@/lib/telegram-bot'
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

    const { type, userId, courseId, chatId, ...params } = await request.json()

    if (!type || !userId) {
      return NextResponse.json(
        { success: false, error: 'Тип уведомления и ID пользователя обязательны' },
        { status: 400 }
      )
    }

    // Получаем настройки Telegram из платформы
    const settings = await executeQuery(
      `SELECT telegram_bot_enabled, telegram_bot_token, telegram_chat_id FROM platform_settings 
       WHERE key IN ('telegramBotEnabled', 'telegramBotToken', 'telegramChatId')
       ORDER BY key`
    )

    const telegramSettings: any = {}
    if (Array.isArray(settings)) {
      settings.forEach((row: any) => {
        const key = row.key.replace('telegram', '').toLowerCase()
        telegramSettings[key] = row.value === 'true' || row.value === true ? true : row.value
      })
    }

    // Также проверяем из переменных окружения
    const botToken = telegramSettings.botToken || process.env.TELEGRAM_BOT_TOKEN || ''
    const botEnabled = telegramSettings.botEnabled || process.env.TELEGRAM_BOT_ENABLED === 'true'

    if (!botEnabled || !botToken) {
      return NextResponse.json(
        { success: false, error: 'Telegram бот не настроен или отключен' },
        { status: 400 }
      )
    }

    // Получаем chatId пользователя из БД (если пользователь связал Telegram)
    const userData = await executeQuery(
      `SELECT telegram_chat_id FROM users WHERE id = $1`,
      [userId]
    )
    const targetUser = Array.isArray(userData) ? userData[0] : userData

    const userChatId = chatId || targetUser?.telegram_chat_id

    if (!userChatId) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не связал Telegram аккаунт' },
        { status: 400 }
      )
    }

    // Получаем данные пользователя и курса для шаблонов
    const [userInfoData, courseData] = await Promise.all([
      executeQuery('SELECT first_name, last_name FROM users WHERE id = $1', [userId]),
      courseId ? executeQuery('SELECT title FROM courses WHERE id = $1', [courseId]) : Promise.resolve([]),
    ])

    const userInfo = Array.isArray(userInfoData) ? userInfoData[0] : userInfoData
    const course = courseId && Array.isArray(courseData) ? courseData[0] : null

    if (!userInfo) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    const studentName = `${userInfo.first_name} ${userInfo.last_name}`

    let messageText = ''

    switch (type) {
      case 'course_assigned':
        if (!course) {
          return NextResponse.json(
            { success: false, error: 'Курс не найден' },
            { status: 404 }
          )
        }
        const { getCourseAssignedTelegramTemplate } = await import('@/lib/telegram-bot')
        messageText = getCourseAssignedTelegramTemplate(
          studentName,
          course.title,
          params.deadline
        )
        break

      case 'deadline_reminder':
        if (!course) {
          return NextResponse.json(
            { success: false, error: 'Курс не найден' },
            { status: 404 }
          )
        }
        const { getDeadlineReminderTelegramTemplate } = await import('@/lib/telegram-bot')
        messageText = getDeadlineReminderTelegramTemplate(
          studentName,
          course.title,
          params.daysLeft || 3
        )
        break

      case 'course_completed':
        if (!course) {
          return NextResponse.json(
            { success: false, error: 'Курс не найден' },
            { status: 404 }
          )
        }
        const { getCourseCompletedTelegramTemplate } = await import('@/lib/telegram-bot')
        messageText = getCourseCompletedTelegramTemplate(
          studentName,
          course.title,
          params.score
        )
        break

      case 'assignment_submitted':
        if (!course) {
          return NextResponse.json(
            { success: false, error: 'Курс не найден' },
            { status: 404 }
          )
        }
        const { getAssignmentSubmittedTelegramTemplate } = await import('@/lib/telegram-bot')
        messageText = getAssignmentSubmittedTelegramTemplate(
          `${user.firstName} ${user.lastName}`,
          studentName,
          course.title
        )
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Неизвестный тип уведомления' },
          { status: 400 }
        )
    }

    const success = await sendTelegramMessage(
      {
        botToken,
        chatId: userChatId,
      },
      {
        text: messageText,
        parse_mode: 'HTML',
      }
    )

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Telegram уведомление отправлено',
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Не удалось отправить Telegram сообщение' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error sending Telegram notification:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

