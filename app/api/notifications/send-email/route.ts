import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { sendEmail, getCourseAssignedEmailTemplate, getDeadlineReminderEmailTemplate, getAssignmentSubmittedEmailTemplate, getCourseCompletedEmailTemplate } from '@/lib/email'
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

    const { type, userId, courseId, ...params } = await request.json()

    if (!type || !userId) {
      return NextResponse.json(
        { success: false, error: 'Тип уведомления и ID пользователя обязательны' },
        { status: 400 }
      )
    }

    // Получаем email пользователя
    const userData = await executeQuery('SELECT email, first_name, last_name FROM users WHERE id = $1', [userId])
    const targetUser = Array.isArray(userData) ? userData[0] : userData

    if (!targetUser || !targetUser.email) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден или не имеет email' },
        { status: 404 }
      )
    }

    // Получаем настройки email из платформы
    const settings = await executeQuery(
      'SELECT email_enabled, email_smtp_host, email_smtp_port, email_smtp_user, email_smtp_password, email_from FROM platform_settings LIMIT 1'
    )
    const emailSettings = Array.isArray(settings) ? settings[0] : settings

    if (!emailSettings || !emailSettings.email_enabled) {
      return NextResponse.json(
        { success: false, error: 'Email уведомления отключены в настройках платформы' },
        { status: 400 }
      )
    }

    const emailConfig = {
      host: emailSettings.email_smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(emailSettings.email_smtp_port || process.env.SMTP_PORT || '587'),
      secure: false,
      user: emailSettings.email_smtp_user || process.env.SMTP_USER || '',
      password: emailSettings.email_smtp_password || process.env.SMTP_PASSWORD || '',
      from: emailSettings.email_from || process.env.EMAIL_FROM || 'noreply@learning-platform.com',
    }

    let emailHtml = ''
    let subject = ''

    switch (type) {
      case 'course_assigned':
        if (!courseId) {
          return NextResponse.json(
            { success: false, error: 'ID курса обязателен для этого типа уведомления' },
            { status: 400 }
          )
        }
        const courseData = await executeQuery('SELECT title FROM courses WHERE id = $1', [courseId])
        const course = Array.isArray(courseData) ? courseData[0] : courseData
        if (!course) {
          return NextResponse.json(
            { success: false, error: 'Курс не найден' },
            { status: 404 }
          )
        }
        emailHtml = getCourseAssignedEmailTemplate(
          `${targetUser.first_name} ${targetUser.last_name}`,
          course.title,
          params.deadline
        )
        subject = `Вам назначен новый курс: ${course.title}`
        break

      case 'deadline_reminder':
        if (!courseId) {
          return NextResponse.json(
            { success: false, error: 'ID курса обязателен для этого типа уведомления' },
            { status: 400 }
          )
        }
        const courseData2 = await executeQuery('SELECT title FROM courses WHERE id = $1', [courseId])
        const course2 = Array.isArray(courseData2) ? courseData2[0] : courseData2
        if (!course2) {
          return NextResponse.json(
            { success: false, error: 'Курс не найден' },
            { status: 404 }
          )
        }
        emailHtml = getDeadlineReminderEmailTemplate(
          `${targetUser.first_name} ${targetUser.last_name}`,
          course2.title,
          params.daysLeft || 3
        )
        subject = `Напоминание: срок сдачи курса "${course2.title}"`
        break

      case 'assignment_submitted':
        if (!courseId) {
          return NextResponse.json(
            { success: false, error: 'ID курса обязателен для этого типа уведомления' },
            { status: 400 }
          )
        }
        const courseData3 = await executeQuery('SELECT title FROM courses WHERE id = $1', [courseId])
        const course3 = Array.isArray(courseData3) ? courseData3[0] : courseData3
        if (!course3) {
          return NextResponse.json(
            { success: false, error: 'Курс не найден' },
            { status: 404 }
          )
        }
        emailHtml = getAssignmentSubmittedEmailTemplate(
          `${user.firstName} ${user.lastName}`,
          `${targetUser.first_name} ${targetUser.last_name}`,
          course3.title
        )
        subject = `Студент завершил курс: ${course3.title}`
        break

      case 'course_completed':
        if (!courseId) {
          return NextResponse.json(
            { success: false, error: 'ID курса обязателен для этого типа уведомления' },
            { status: 400 }
          )
        }
        const courseData4 = await executeQuery('SELECT title FROM courses WHERE id = $1', [courseId])
        const course4 = Array.isArray(courseData4) ? courseData4[0] : courseData4
        if (!course4) {
          return NextResponse.json(
            { success: false, error: 'Курс не найден' },
            { status: 404 }
          )
        }
        emailHtml = getCourseCompletedEmailTemplate(
          `${targetUser.first_name} ${targetUser.last_name}`,
          course4.title,
          params.score,
          params.certificateUrl
        )
        subject = `Поздравляем! Вы завершили курс: ${course4.title}`
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Неизвестный тип уведомления' },
          { status: 400 }
        )
    }

    const success = await sendEmail(emailConfig, {
      to: targetUser.email,
      subject,
      html: emailHtml,
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Email уведомление отправлено',
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Не удалось отправить email' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error sending email notification:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

