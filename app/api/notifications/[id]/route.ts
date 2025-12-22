import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { executeQuery } from '@/lib/database'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const notificationId = parseInt(id)

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Неверный ID уведомления' },
        { status: 400 }
      )
    }

    // Проверяем, что уведомление принадлежит пользователю
    const checkQuery = `SELECT user_id FROM notifications WHERE id = $1`
    const checkResult: any = await executeQuery(checkQuery, [notificationId])
    const notification = Array.isArray(checkResult) ? checkResult[0] : checkResult

    if (!notification || notification.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Уведомление не найдено' },
        { status: 404 }
      )
    }

    const query = `DELETE FROM notifications WHERE id = $1`
    await executeQuery(query, [notificationId])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка удаления уведомления' },
      { status: 500 }
    )
  }
}

