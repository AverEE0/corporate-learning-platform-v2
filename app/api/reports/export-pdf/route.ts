import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { executeQuery } from '@/lib/database'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'courses' // courses, students, progress
    const courseId = searchParams.get('courseId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let reportData: any = {}

    if (type === 'courses') {
      // Отчет по курсам
      const query = `
        SELECT 
          c.id,
          c.title,
          c.description,
          c.status,
          c.created_at,
          COUNT(DISTINCT l.id) as lessons_count,
          COUNT(DISTINCT cp.user_id) as enrolled_count,
          COUNT(DISTINCT CASE WHEN cp.completed_at IS NOT NULL THEN cp.user_id END) as completed_count
        FROM courses c
        LEFT JOIN lessons l ON c.id = l.course_id
        LEFT JOIN course_progress cp ON c.id = cp.course_id
        ${startDate || endDate ? 'WHERE' : ''}
        ${startDate ? `c.created_at >= $1` : ''}
        ${startDate && endDate ? ' AND' : ''}
        ${endDate ? `${startDate ? '' : 'c.created_at'} <= $${startDate ? '2' : '1'}` : ''}
        GROUP BY c.id, c.title, c.description, c.status, c.created_at
        ORDER BY c.created_at DESC
      `
      const params = []
      if (startDate) params.push(startDate)
      if (endDate) params.push(endDate)
      
      const courses = await executeQuery(query, params)
      reportData = { type: 'courses', data: courses }
    } else if (type === 'students') {
      // Отчет по студентам
      const query = `
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.created_at,
          COUNT(DISTINCT cp.course_id) as enrolled_courses,
          COUNT(DISTINCT CASE WHEN cp.completed_at IS NOT NULL THEN cp.course_id END) as completed_courses
        FROM users u
        LEFT JOIN course_progress cp ON u.id = cp.user_id
        WHERE u.role = 'student'
        ${startDate || endDate ? 'AND' : ''}
        ${startDate ? `u.created_at >= $1` : ''}
        ${startDate && endDate ? ' AND' : ''}
        ${endDate ? `${startDate ? '' : 'u.created_at'} <= $${startDate ? '2' : '1'}` : ''}
        GROUP BY u.id, u.email, u.first_name, u.last_name, u.created_at
        ORDER BY u.created_at DESC
      `
      const params = []
      if (startDate) params.push(startDate)
      if (endDate) params.push(endDate)
      
      const students = await executeQuery(query, params)
      reportData = { type: 'students', data: students }
    } else if (type === 'progress' && courseId) {
      // Отчет по прогрессу по курсу
      const query = `
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          cp.progress_percentage,
          cp.started_at,
          cp.completed_at,
          cp.last_accessed_at
        FROM course_progress cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.course_id = $1
        ${startDate ? 'AND cp.started_at >= $2' : ''}
        ${endDate ? `AND cp.${startDate ? 'completed_at' : 'started_at'} <= $${startDate ? '3' : '2'}` : ''}
        ORDER BY cp.progress_percentage DESC
      `
      const params = [courseId]
      if (startDate) params.push(startDate)
      if (endDate) params.push(endDate)
      
      const progress = await executeQuery(query, params)
      reportData = { type: 'progress', courseId, data: progress }
    }

    // Генерируем HTML для PDF
    const html = generatePDFHTML(reportData)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="report-${type}-${Date.now()}.html"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating PDF report:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка генерации отчета' },
      { status: 500 }
    )
  }
}

function generatePDFHTML(reportData: any): string {
  const now = new Date().toLocaleString('ru-RU')
  let tableRows = ''

  if (reportData.type === 'courses') {
    reportData.data.forEach((item: any) => {
      tableRows += `
        <tr>
          <td>${item.title || '-'}</td>
          <td>${item.status === 'published' ? 'Опубликован' : 'Черновик'}</td>
          <td>${item.lessons_count || 0}</td>
          <td>${item.enrolled_count || 0}</td>
          <td>${item.completed_count || 0}</td>
          <td>${new Date(item.created_at).toLocaleDateString('ru-RU')}</td>
        </tr>
      `
    })
  } else if (reportData.type === 'students') {
    reportData.data.forEach((item: any) => {
      tableRows += `
        <tr>
          <td>${item.first_name} ${item.last_name}</td>
          <td>${item.email}</td>
          <td>${item.enrolled_courses || 0}</td>
          <td>${item.completed_courses || 0}</td>
          <td>${new Date(item.created_at).toLocaleDateString('ru-RU')}</td>
        </tr>
      `
    })
  } else if (reportData.type === 'progress') {
    reportData.data.forEach((item: any) => {
      tableRows += `
        <tr>
          <td>${item.first_name} ${item.last_name}</td>
          <td>${item.email}</td>
          <td>${Math.round(item.progress_percentage || 0)}%</td>
          <td>${item.completed_at ? new Date(item.completed_at).toLocaleDateString('ru-RU') : 'Не завершен'}</td>
        </tr>
      `
    })
  }

  const headers = reportData.type === 'courses'
    ? '<th>Название</th><th>Статус</th><th>Уроков</th><th>Записано</th><th>Завершено</th><th>Создан</th>'
    : reportData.type === 'students'
    ? '<th>Имя</th><th>Email</th><th>Курсов записано</th><th>Завершено</th><th>Регистрация</th>'
    : '<th>Имя</th><th>Email</th><th>Прогресс</th><th>Завершен</th>'

  const title = reportData.type === 'courses'
    ? 'Отчет по курсам'
    : reportData.type === 'students'
    ? 'Отчет по студентам'
    : 'Отчет по прогрессу'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          color: #10b981;
          margin-bottom: 10px;
        }
        .date {
          color: #666;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #10b981;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="date">Дата создания: ${now}</div>
      <table>
        <thead>
          <tr>
            ${headers}
          </tr>
        </thead>
        <tbody>
          ${tableRows || '<tr><td colspan="6">Нет данных</td></tr>'}
        </tbody>
      </table>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `
}

