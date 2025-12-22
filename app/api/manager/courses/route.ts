import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { courseDb } from '@/lib/database'

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

    // Админы и менеджеры видят все курсы (но менеджеры могут удалять только свои)
    const courses = await courseDb.getAllCourses()

    return NextResponse.json({
      success: true,
      courses,
    })
  } catch (error) {
    console.error('Error fetching manager courses:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

