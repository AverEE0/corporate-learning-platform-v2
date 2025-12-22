import { executeQuery } from '@/lib/database'

export interface CreateNotificationParams {
  userId: number
  type: string
  title: string
  message: string
  link?: string
}

/**
 * Создает уведомление для пользователя
 */
export async function createNotification(params: CreateNotificationParams): Promise<number | null> {
  try {
    const { userId, type, title, message, link } = params

    const query = `
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `

    const result: any = await executeQuery(query, [userId, type, title, message, link || null])
    const notification = Array.isArray(result) ? result[0] : result

    return notification?.id || null
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

/**
 * Создает уведомление о назначении курса
 */
export async function createCourseAssignedNotification(
  userId: number,
  courseTitle: string,
  courseId: number,
  managerName?: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'course_assigned',
    title: 'Вам назначен новый курс',
    message: managerName
      ? `${managerName} назначил вам курс "${courseTitle}"`
      : `Вам назначен курс "${courseTitle}"`,
    link: `/course/${courseId}`,
  })
}

/**
 * Создает уведомление о завершении курса
 */
export async function createCourseCompletedNotification(
  userId: number,
  courseTitle: string,
  courseId: number
): Promise<void> {
  await createNotification({
    userId,
    type: 'course_completed',
    title: 'Курс завершен',
    message: `Вы успешно завершили курс "${courseTitle}"`,
    link: `/course/${courseId}`,
  })
}

/**
 * Создает уведомление о напоминании дедлайна
 */
export async function createDeadlineReminderNotification(
  userId: number,
  courseTitle: string,
  courseId: number,
  daysLeft: number
): Promise<void> {
  await createNotification({
    userId,
    type: 'deadline_reminder',
    title: 'Приближается дедлайн',
    message: `До завершения курса "${courseTitle}" осталось ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}`,
    link: `/course/${courseId}`,
  })
}

