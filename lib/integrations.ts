// Базовая структура для интеграций с внешними системами

export interface TelegramConfig {
  botToken: string
  chatId?: string
}

export interface Bitrix24Config {
  webhookUrl: string
  userId?: string
}

// Интеграция с Telegram
export async function sendTelegramNotification(
  config: TelegramConfig,
  message: string
): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
    return false
  }
}

// Интеграция с Bitrix24
export async function sendBitrix24Task(
  config: Bitrix24Config,
  taskData: {
    title: string
    description?: string
    responsibleId?: string
    deadline?: string
  }
): Promise<boolean> {
  try {
    const url = `${config.webhookUrl}/tasks.task.add`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          TITLE: taskData.title,
          DESCRIPTION: taskData.description || '',
          RESPONSIBLE_ID: taskData.responsibleId || config.userId,
          DEADLINE: taskData.deadline,
        },
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Error creating Bitrix24 task:', error)
    return false
  }
}

// Проверка дедлайнов и отправка напоминаний
export async function checkDeadlinesAndNotify(
  telegramConfig?: TelegramConfig,
  bitrixConfig?: Bitrix24Config
): Promise<void> {
  try {
    // Здесь должна быть логика проверки дедлайнов из БД
    // Пример:
    // const upcomingDeadlines = await executeQuery(`
    //   SELECT ca.*, u.email, c.title as course_title
    //   FROM course_assignments ca
    //   INNER JOIN users u ON ca.assigned_to = u.id
    //   INNER JOIN courses c ON ca.course_id = c.id
    //   WHERE ca.due_date IS NOT NULL
    //     AND ca.due_date <= NOW() + INTERVAL '3 days'
    //     AND ca.completed_at IS NULL
    //     AND ca.reminder_sent = false
    // `)
    
    // for (const assignment of upcomingDeadlines) {
    //   // Отправка уведомлений
    // }
  } catch (error) {
    console.error('Error checking deadlines:', error)
  }
}

// Хелпер для проверки количества попыток
export function checkAttemptLimit(
  currentAttempts: number,
  maxAttempts?: number | null
): { allowed: boolean; remaining?: number } {
  if (!maxAttempts) {
    return { allowed: true }
  }

  const remaining = maxAttempts - currentAttempts
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
  }
}

