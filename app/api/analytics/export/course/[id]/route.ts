import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { executeQuery } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const format = new URL(request.url).searchParams.get('format') || 'csv'

    // Получаем данные о прогрессе студентов по курсу
    const query = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        ce.enrolled_at,
        up.completion_percentage,
        up.score,
        up.time_spent,
        up.completed,
        up.completed_at
      FROM course_enrollments ce
      INNER JOIN users u ON ce.user_id = u.id
      LEFT JOIN (
        SELECT DISTINCT ON (user_id, course_id)
          user_id,
          course_id,
          completion_percentage,
          score,
          time_spent,
          completed,
          completed_at
        FROM user_progress
        WHERE course_id = $1
        ORDER BY user_id, course_id, updated_at DESC
      ) up ON ce.user_id = up.user_id AND ce.course_id = up.course_id
      WHERE ce.course_id = $1
      ORDER BY u.last_name, u.first_name
    `
    
    const data = await executeQuery(query, [parseInt(id)])

    if (format === 'csv' || format === 'excel') {
      // Генерируем CSV (Excel поддерживает CSV формат)
      const headers = [
        'ID',
        'Email',
        'Имя',
        'Фамилия',
        'Дата регистрации на курс',
        'Процент выполнения (%)',
        'Баллы',
        'Время (сек)',
        'Завершен',
        'Дата завершения',
      ]
      
      // Форматируем даты для CSV
      const formatDate = (date: string | null) => {
        if (!date) return ''
        try {
          return new Date(date).toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        } catch {
          return date
        }
      }

      const formatTime = (seconds: number | null) => {
        if (!seconds) return '0'
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`
      }
      
      const rows = data.map((row: any) => [
        row.id,
        row.email || '',
        row.first_name || '',
        row.last_name || '',
        formatDate(row.enrolled_at),
        row.completion_percentage || 0,
        row.score || 0,
        formatTime(row.time_spent),
        row.completed ? 'Да' : 'Нет',
        formatDate(row.completed_at),
      ])

      // Добавляем BOM для корректного отображения кириллицы в Excel
      const BOM = '\uFEFF'
      const csvContent = BOM + [
        headers.join(','),
        ...rows.map((row: any[]) => row.map(cell => {
          const cellStr = String(cell)
          // Экранируем кавычки и оборачиваем в кавычки если содержит запятую, перенос строки или кавычку
          if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        }).join(',')),
      ].join('\n')

      const contentType = format === 'excel' 
        ? 'application/vnd.ms-excel; charset=utf-8'
        : 'text/csv; charset=utf-8'
      
      const extension = format === 'excel' ? 'xls' : 'csv'

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="course-${id}-report.${extension}"`,
        },
      })
    }

    // JSON format
    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error exporting analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

