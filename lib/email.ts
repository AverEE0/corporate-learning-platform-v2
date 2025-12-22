// Email уведомления

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  from: string
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Реализация отправки email через SMTP
export async function sendEmail(
  config: EmailConfig,
  options: EmailOptions
): Promise<boolean> {
  try {
    // Используем простой SMTP через fetch (поддерживается многими провайдерами)
    // Или используем внешний email сервис
    
    // Если есть переменная окружения для email сервиса (например, SendGrid, Mailgun, Resend)
    const emailServiceUrl = process.env.EMAIL_SERVICE_URL
    const emailApiKey = process.env.EMAIL_API_KEY

    if (emailServiceUrl && emailApiKey) {
      // Использование внешнего email сервиса
      const response = await fetch(emailServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${emailApiKey}`,
        },
        body: JSON.stringify({
          to: options.to,
          from: config.from,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>/g, ''),
        }),
      })

      return response.ok
    }

    // Если настроен SMTP, используем простую отправку через SMTP API
    if (config.host && config.user && config.password) {
      // Формируем SMTP URL (для некоторых провайдеров работает напрямую)
      // В реальном приложении лучше использовать nodemailer
      
      // Попытка отправки через простой HTTP API (Resend, SendGrid и т.д.)
      // Или можно использовать встроенную функцию SMTP
      
      // Пока что логируем для разработки, но структура готова для nodemailer
      console.log('📧 Email would be sent via SMTP:', {
        host: config.host,
        port: config.port,
        from: config.from,
        to: options.to,
        subject: options.subject,
      })

      // TODO: Для продакшена добавить nodemailer:
      // const nodemailer = require('nodemailer')
      // const transporter = nodemailer.createTransport({
      //   host: config.host,
      //   port: config.port,
      //   secure: config.secure,
      //   auth: {
      //     user: config.user,
      //     pass: config.password,
      //   },
      // })
      // await transporter.sendMail({
      //   from: config.from,
      //   to: options.to,
      //   subject: options.subject,
      //   html: options.html,
      //   text: options.text,
      // })

      return true
    }

    // Fallback: логируем email (для разработки)
    console.log('📧 Email would be sent:', {
      to: options.to,
      subject: options.subject,
      html: options.html.substring(0, 100) + '...',
    })

    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

// Шаблоны email уведомлений

export function getCourseAssignedEmailTemplate(
  studentName: string,
  courseName: string,
  deadline?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Новый курс назначен</h1>
    </div>
    <div class="content">
      <p>Здравствуйте, ${escapeHtml(studentName)}!</p>
      <p>Вам назначен новый курс для прохождения: <strong>${escapeHtml(courseName)}</strong></p>
      ${deadline ? `<p><strong>Срок сдачи:</strong> ${escapeHtml(deadline)}</p>` : ''}
      <p>Пожалуйста, начните прохождение курса в ближайшее время.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">Перейти к курсу</a>
    </div>
    <div class="footer">
      <p>Это автоматическое уведомление от платформы обучения</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export function getDeadlineReminderEmailTemplate(
  studentName: string,
  courseName: string,
  daysLeft: number
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Напоминание о дедлайне</h1>
    </div>
    <div class="content">
      <p>Здравствуйте, ${escapeHtml(studentName)}!</p>
      <p>Напоминаем, что у вас осталось <strong>${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}</strong> до сдачи курса <strong>${escapeHtml(courseName)}</strong>.</p>
      <p>Пожалуйста, завершите прохождение курса до указанного срока.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">Продолжить курс</a>
    </div>
    <div class="footer">
      <p>Это автоматическое уведомление от платформы обучения</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export function getAssignmentSubmittedEmailTemplate(
  managerName: string,
  studentName: string,
  courseName: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #4facfe; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Новое задание сдано</h1>
    </div>
    <div class="content">
      <p>Здравствуйте, ${escapeHtml(managerName)}!</p>
      <p>Студент <strong>${escapeHtml(studentName)}</strong> завершил курс <strong>${escapeHtml(courseName)}</strong>.</p>
      <p>Пожалуйста, проверьте результаты и ответы студента.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/manager/dashboard" class="button">Просмотреть результаты</a>
    </div>
    <div class="footer">
      <p>Это автоматическое уведомление от платформы обучения</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export function getCourseCompletedEmailTemplate(
  studentName: string,
  courseName: string,
  score?: number,
  certificateUrl?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #11998e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Курс завершен!</h1>
    </div>
    <div class="content">
      <p>Поздравляем, ${escapeHtml(studentName)}!</p>
      <p>Вы успешно завершили курс <strong>${escapeHtml(courseName)}</strong>.</p>
      ${score !== undefined ? `<p><strong>Ваш результат:</strong> ${score} баллов</p>` : ''}
      ${certificateUrl ? `
        <p>Ваш сертификат готов к скачиванию!</p>
        <a href="${certificateUrl}" class="button">Скачать сертификат</a>
      ` : ''}
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">Вернуться к курсам</a>
    </div>
    <div class="footer">
      <p>Это автоматическое уведомление от платформы обучения</p>
    </div>
  </div>
</body>
</html>
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

