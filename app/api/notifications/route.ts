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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const query = `
      SELECT 
        id,
        user_id,
        type,
        title,
        message,
        link,
        read,
        created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `

    const notifications = await executeQuery(query, [user.id, limit, offset])

    return NextResponse.json({
      success: true,
      notifications: Array.isArray(notifications) ? notifications : [notifications],
    })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка загрузки уведомлений' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const { userId, type, title, message, link } = body

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      )
    }

    const query = `
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `

    const result = await executeQuery(query, [userId, type, title, message, link || null])

    return NextResponse.json({
      success: true,
      notification: Array.isArray(result) ? result[0] : result,
    })
  } catch (error: any) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка создания уведомления' },
      { status: 500 }
    )
  }
}
