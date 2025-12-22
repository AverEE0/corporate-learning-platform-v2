import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { analyticsDb } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; courseId: string }> }
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

    const { userId, courseId } = await params
    const details = await analyticsDb.getUserProgressDetails(
      parseInt(userId),
      parseInt(courseId)
    )

    return NextResponse.json({
      success: true,
      details,
    })
  } catch (error) {
    console.error('Error fetching user progress details:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

