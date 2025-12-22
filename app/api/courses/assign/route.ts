import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { executeQuery } from '@/lib/database'
import { createCourseAssignedNotification } from '@/lib/notifications'

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
    const { courseId, userIds, dueDate, maxAttempts } = body

    // Улучшенная валидация
    if (!courseId || isNaN(parseInt(String(courseId)))) {
      return NextResponse.json(
        { success: false, error: 'ID курса обязателен и должен быть числом' },
        { status: 400 }
      )
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Список пользователей обязателен и должен быть непустым массивом' },
        { status: 400 }
      )
    }

    // Валидация ID пользователей
    const invalidUserIds = userIds.filter((id: any) => isNaN(parseInt(String(id))))
    if (invalidUserIds.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Все ID пользователей должны быть числами' },
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

    // Валидация даты дедлайна
    if (dueDate) {
      const deadlineDate = new Date(dueDate)
      if (isNaN(deadlineDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Некорректный формат даты дедлайна' },
          { status: 400 }
        )
      }
    }

    // Валидация максимального количества попыток
    if (maxAttempts !== undefined && maxAttempts !== null) {
      const attempts = parseInt(String(maxAttempts))
      if (isNaN(attempts) || attempts < 1) {
        return NextResponse.json(
          { success: false, error: 'Максимальное количество попыток должно быть положительным числом' },
          { status: 400 }
        )
      }
    }

    const assignments = []

    for (const userId of userIds) {
      // Проверяем, не назначен ли уже курс
      const existing = await executeQuery(
        'SELECT id FROM course_assignments WHERE course_id = $1 AND assigned_to = $2',
        [courseId, userId]
      )

      if (Array.isArray(existing) && existing.length > 0) {
        // Обновляем существующее назначение
        await executeQuery(
          `UPDATE course_assignments 
           SET due_date = $1, max_attempts = $2, assigned_by = $3
           WHERE course_id = $4 AND assigned_to = $5`,
          [dueDate || null, maxAttempts || null, user.id, courseId, userId]
        )
      } else {
        // Создаем новое назначение
        const result = await executeQuery(
          `INSERT INTO course_assignments (course_id, assigned_to, assigned_by, due_date, max_attempts)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [courseId, userId, user.id, dueDate || null, maxAttempts || null]
        )
        assignments.push(Array.isArray(result) ? result[0] : result)
      }

      // Отправляем уведомление пользователю
      try {
        const courseData = await executeQuery('SELECT title FROM courses WHERE id = $1', [courseId])
        const course = Array.isArray(courseData) ? courseData[0] : courseData
        const managerName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined
        
        if (course) {
          await createCourseAssignedNotification(
            userId,
            course.title,
            parseInt(String(courseId)),
            managerName
          )
        }

        // Отправляем email уведомление (если включено)
        try {
          const courseData = await executeQuery('SELECT title FROM courses WHERE id = $1', [courseId])
          const course = Array.isArray(courseData) ? courseData[0] : courseData
          
          if (course) {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || '',
              },
              body: JSON.stringify({
                type: 'course_assigned',
                userId,
                courseId,
                deadline: dueDate ? new Date(dueDate).toLocaleDateString('ru-RU') : undefined,
              }),
            }).catch(err => console.error('Email notification error:', err))
          }

          // Отправляем Telegram уведомление (если включено)
          try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/telegram/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || '',
              },
              body: JSON.stringify({
                type: 'course_assigned',
                userId,
                courseId,
                deadline: dueDate ? new Date(dueDate).toLocaleDateString('ru-RU') : undefined,
              }),
            }).catch(err => console.error('Telegram notification error:', err))
          } catch (telegramError) {
            console.error('Error sending Telegram notification:', telegramError)
          }
        } catch (emailError) {
          console.error('Error sending email notification:', emailError)
          // Не прерываем процесс, если email не отправился
        }
      } catch (error) {
        console.error('Error creating notification:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Курс назначен ${userIds.length} пользователям`,
      assignments,
    })
  } catch (error: any) {
    console.error('Error assigning course:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

