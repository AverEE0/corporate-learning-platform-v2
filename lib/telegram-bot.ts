// Telegram Bot интеграция

interface TelegramConfig {
  botToken: string
  chatId?: string
}

interface TelegramMessage {
  text: string
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disable_notification?: boolean
}

/**
 * Отправка сообщения в Telegram через Bot API
 */
export async function sendTelegramMessage(
  config: TelegramConfig,
  message: TelegramMessage
): Promise<boolean> {
  try {
    if (!config.botToken) {
      console.error('Telegram bot token не настроен')
      return false
    }

    const apiUrl = `https://api.telegram.org/bot${config.botToken}/sendMessage`
    
    const payload: any = {
      chat_id: config.chatId || message.text, // Если chatId не указан, отправляем в текст (для тестов)
      text: message.text,
      parse_mode: message.parse_mode || 'HTML',
      disable_notification: message.disable_notification || false,
    }

    // Если chatId не указан в конфиге, пробуем извлечь из сообщения или использовать дефолтный
    if (!config.chatId) {
      // В продакшене chatId должен быть настроен
      console.warn('Telegram chatId не указан')
      return false
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (result.ok) {
      return true
    } else {
      console.error('Telegram API error:', result)
      return false
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error)
    return false
  }
}

/**
 * Получение информации о боте
 */
export async function getBotInfo(botToken: string): Promise<any> {
  try {
    const apiUrl = `https://api.telegram.org/bot${botToken}/getMe`
    const response = await fetch(apiUrl)
    const result = await response.json()
    
    if (result.ok) {
      return result.result
    } else {
      throw new Error(result.description || 'Failed to get bot info')
    }
  } catch (error) {
    console.error('Error getting bot info:', error)
    throw error
  }
}

/**
 * Настройка webhook для получения обновлений
 */
export async function setWebhook(
  botToken: string,
  webhookUrl: string,
  secretToken?: string
): Promise<boolean> {
  try {
    const apiUrl = `https://api.telegram.org/bot${botToken}/setWebhook`
    
    const payload: any = {
      url: webhookUrl,
    }

    if (secretToken) {
      payload.secret_token = secretToken
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()
    return result.ok === true
  } catch (error) {
    console.error('Error setting webhook:', error)
    return false
  }
}

/**
 * Шаблоны сообщений для уведомлений
 */

export function getCourseAssignedTelegramTemplate(
  studentName: string,
  courseName: string,
  deadline?: string
): string {
  return `
🎓 <b>Новый курс назначен</b>

Привет, ${escapeHtml(studentName)}!

Вам назначен новый курс для прохождения: <b>${escapeHtml(courseName)}</b>

${deadline ? `⏰ <b>Срок сдачи:</b> ${escapeHtml(deadline)}` : ''}

Пожалуйста, начните прохождение курса в ближайшее время.
  `.trim()
}

export function getDeadlineReminderTelegramTemplate(
  studentName: string,
  courseName: string,
  daysLeft: number
): string {
  return `
⏰ <b>Напоминание о дедлайне</b>

Привет, ${escapeHtml(studentName)}!

Напоминаем, что у вас осталось <b>${daysLeft} ${getDaysText(daysLeft)}</b> до сдачи курса <b>${escapeHtml(courseName)}</b>.

Пожалуйста, завершите прохождение курса до указанного срока.
  `.trim()
}

export function getCourseCompletedTelegramTemplate(
  studentName: string,
  courseName: string,
  score?: number
): string {
  return `
🎉 <b>Курс завершен!</b>

Поздравляем, ${escapeHtml(studentName)}!

Вы успешно завершили курс <b>${escapeHtml(courseName)}</b>.

${score !== undefined ? `Ваш результат: <b>${score} баллов</b>` : ''}

Отличная работа! 👏
  `.trim()
}

export function getAssignmentSubmittedTelegramTemplate(
  managerName: string,
  studentName: string,
  courseName: string
): string {
  return `
📝 <b>Новое задание сдано</b>

Привет, ${escapeHtml(managerName)}!

Студент <b>${escapeHtml(studentName)}</b> завершил курс <b>${escapeHtml(courseName)}</b>.

Пожалуйста, проверьте результаты и ответы студента.
  `.trim()
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

function getDaysText(days: number): string {
  if (days === 1) return 'день'
  if (days < 5) return 'дня'
  return 'дней'
}

