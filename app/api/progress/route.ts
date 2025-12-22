import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { progressDb } from '@/lib/database'
import { executeQuery } from '@/lib/database'
import { checkAttemptLimit } from '@/lib/integrations'
import { createCourseCompletedNotification } from '@/lib/notifications'
import { checkCourseCompletionAchievements, addXP } from '@/lib/achievements'

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

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Неверный токен' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const {
      courseId,
      lessonId,
      blockId,
      completionPercentage,
      score,
      timeSpent,
      completed,
      answers,
    } = body

    // Улучшенная валидация
    if (!courseId || isNaN(parseInt(String(courseId)))) {
      return NextResponse.json(
        { success: false, error: 'ID курса обязателен и должен быть числом' },
        { status: 400 }
      )
    }

    // Валидация процента выполнения
    if (completionPercentage !== undefined) {
      const percentage = parseInt(String(completionPercentage))
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        return NextResponse.json(
          { success: false, error: 'Процент выполнения должен быть от 0 до 100' },
          { status: 400 }
        )
      }
    }

    // Валидация оценки
    if (score !== undefined) {
      const scoreNum = parseInt(String(score))
      if (isNaN(scoreNum) || scoreNum < 0) {
        return NextResponse.json(
          { success: false, error: 'Оценка должна быть неотрицательным числом' },
          { status: 400 }
        )
      }
    }

    // Валидация времени
    if (timeSpent !== undefined) {
      const time = parseInt(String(timeSpent))
      if (isNaN(time) || time < 0) {
        return NextResponse.json(
          { success: false, error: 'Время должно быть неотрицательным числом' },
          { status: 400 }
        )
      }
    }

    // Проверяем существование курса
    const courseCheck = await executeQuery('SELECT id FROM courses WHERE id = $1', [parseInt(String(courseId))])
    if (!Array.isArray(courseCheck) || courseCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Курс не найден' },
        { status: 404 }
      )
    }

    // Проверяем лимит попыток, если курс назначен
    // Временно отключено, так как таблица course_assignments может не иметь колонку attempts
    // TODO: Добавить колонку attempts в таблицу course_assignments или переработать логику
    try {
      const assignment = await executeQuery(
        `SELECT max_attempts FROM course_assignments 
         WHERE course_id = $1 AND assigned_to = $2`,
        [courseId, user.id]
      )
      
      if (Array.isArray(assignment) && assignment.length > 0) {
        const assign = assignment[0]
        // Проверяем только max_attempts, attempts может отсутствовать в схеме
        if (assign.max_attempts && assign.max_attempts > 0) {
          // Получаем количество завершенных попыток из course_progress
          const completedAttempts: any = await executeQuery(
            `SELECT COUNT(*) as count FROM course_progress 
             WHERE course_id = $1 AND user_id = $2 AND completed = TRUE`,
            [courseId, user.id]
          )
          
          const attemptsCount = Array.isArray(completedAttempts) 
            ? (completedAttempts[0]?.count || 0)
            : ((completedAttempts as any)?.count || 0)
          
          if (attemptsCount >= assign.max_attempts) {
            return NextResponse.json(
              { success: false, error: 'Достигнут лимит попыток для этого курса' },
              { status: 403 }
            )
          }
        }
      }
    } catch (assignmentError: any) {
      // Игнорируем ошибки проверки назначений, чтобы не блокировать сохранение прогресса
      console.error('Error checking assignment limits:', assignmentError)
    }

    await progressDb.updateProgress({
      userId: user.id,
      courseId: parseInt(String(courseId)),
      lessonId: lessonId ? parseInt(String(lessonId)) : undefined,
      blockId: blockId ? parseInt(String(blockId)) : undefined,
      completionPercentage: completionPercentage !== undefined ? parseInt(String(completionPercentage)) : 0,
      score: score !== undefined ? parseInt(String(score)) : 0,
      timeSpent: timeSpent !== undefined ? parseInt(String(timeSpent)) : 0,
      completed: Boolean(completed),
      answers: answers && typeof answers === 'object' ? answers : {},
    })

    // Если курс завершен, отправляем уведомления
    if (completed) {
      try {
        // Получаем данные курса и менеджера
        const [courseData, managerData] = await Promise.all([
          executeQuery('SELECT title, created_by FROM courses WHERE id = $1', [courseId]),
          executeQuery('SELECT id, email, first_name, last_name FROM users WHERE id = (SELECT created_by FROM courses WHERE id = $1)', [courseId]),
        ])

        const course = Array.isArray(courseData) ? courseData[0] : courseData
        const manager = Array.isArray(managerData) ? managerData[0] : managerData

        if (course) {
          // Начисляем XP за завершение курса
          try {
            await addXP(
              user.id,
              100,
              'course_completed',
              parseInt(String(courseId)),
              `Завершение курса: ${course.title}`
            )
          } catch (xpError) {
            console.error('Error adding XP:', xpError)
          }

          // Проверяем достижения
          try {
            await checkCourseCompletionAchievements(user.id, parseInt(String(courseId)))
          } catch (achError) {
            console.error('Error checking achievements:', achError)
          }

          // Создаем in-app уведомление о завершении курса
          try {
            await createCourseCompletedNotification(
              user.id,
              course.title,
              parseInt(String(courseId))
            )
          } catch (notifError) {
            console.error('Error creating completion notification:', notifError)
          }

          // Email студенту о завершении курса
          try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || '',
              },
              body: JSON.stringify({
                type: 'course_completed',
                userId: user.id,
                courseId,
                score: score || 0,
              }),
            }).catch(err => console.error('Email notification error:', err))
          } catch (emailError) {
            console.error('Error sending completion email:', emailError)
          }

          // Email менеджеру о сданном задании
          if (manager.id !== user.id) {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Cookie': request.headers.get('cookie') || '',
                },
                body: JSON.stringify({
                  type: 'assignment_submitted',
                  userId: manager.id,
                  courseId,
                }),
              }).catch(err => console.error('Email notification error:', err))

              // Telegram уведомление менеджеру
              await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/telegram/send`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Cookie': request.headers.get('cookie') || '',
                },
                body: JSON.stringify({
                  type: 'assignment_submitted',
                  userId: manager.id,
                  courseId,
                }),
              }).catch(err => console.error('Telegram notification error:', err))
            } catch (error) {
              console.error('Error sending manager notifications:', error)
            }
          }

          // Telegram уведомление студенту о завершении
          try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/telegram/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || '',
              },
              body: JSON.stringify({
                type: 'course_completed',
                userId: user.id,
                courseId,
                score: score || 0,
              }),
            }).catch(err => console.error('Telegram notification error:', err))
          } catch (telegramError) {
            console.error('Error sending Telegram notification:', telegramError)
          }

          // Синхронизация с Bitrix24 (если включено)
          try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/bitrix24/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || '',
              },
              body: JSON.stringify({
                userId: user.id,
                courseId,
              }),
            }).catch(err => console.error('Bitrix24 sync error:', err))
          } catch (bitrixError) {
            console.error('Error syncing to Bitrix24:', bitrixError)
          }
        }
      } catch (notifError) {
        console.error('Error sending completion notifications:', notifError)
        // Не прерываем процесс сохранения прогресса
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Прогресс сохранен',
    })
  } catch (error) {
    console.error('Error saving progress:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = (await cookies()).get('auth-token')?.value
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

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

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'ID курса обязателен' },
        { status: 400 }
      )
    }

    const progress = await progressDb.getUserProgress(user.id, parseInt(courseId))

    return NextResponse.json({
      success: true,
      progress: progress[0] || null,
    })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

