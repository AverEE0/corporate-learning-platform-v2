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

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const query = `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = FALSE`
    const result: any = await executeQuery(query, [user.id])
    const count = Array.isArray(result) ? result[0]?.count : result?.count || 0

    return NextResponse.json({
      success: true,
      count: parseInt(String(count)),
    })
  } catch (error: any) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка загрузки количества уведомлений' },
      { status: 500 }
    )
  }
}

