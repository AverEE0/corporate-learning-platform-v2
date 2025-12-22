import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { executeQuery } from '@/lib/database'
import { requireCSRF } from '@/lib/csrf'

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

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Неверный токен' },
        { status: 401 }
      )
    }

    const courses = await executeQuery(
      'SELECT * FROM courses ORDER BY created_at DESC'
    )

    return NextResponse.json({
      success: true,
      courses: Array.isArray(courses) ? courses : [courses],
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Проверка CSRF токена
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.success) {
      return NextResponse.json(
        { success: false, error: csrfCheck.error },
        { status: 403 }
      )
    }

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
    const { title, description, status } = body

    // Улучшенная валидация
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Название курса обязательно и должно быть строкой' },
        { status: 400 }
      )
    }

    if (title.trim().length > 255) {
      return NextResponse.json(
        { success: false, error: 'Название курса не должно превышать 255 символов' },
        { status: 400 }
      )
    }

    if (description && typeof description === 'string' && description.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Описание курса не должно превышать 5000 символов' },
        { status: 400 }
      )
    }

    if (status && !['draft', 'published', 'archived'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Недопустимый статус курса' },
        { status: 400 }
      )
    }

    const result = await executeQuery(
      `INSERT INTO courses (title, description, status, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title.trim(), description?.trim() || null, status || 'draft', user.id]
    )

    const course = Array.isArray(result) ? result[0] : result

    return NextResponse.json({
      success: true,
      course,
    })
  } catch (error: any) {
    console.error('Error creating course:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
