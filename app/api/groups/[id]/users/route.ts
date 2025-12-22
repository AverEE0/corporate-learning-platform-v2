import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { groupDb } from '@/lib/database'

export async function POST(
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
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID пользователя обязателен' },
        { status: 400 }
      )
    }

    await groupDb.addUserToGroup(userId, parseInt(id))

    return NextResponse.json({
      success: true,
      message: 'Пользователь добавлен в группу',
    })
  } catch (error: any) {
    console.error('Error adding user to group:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID пользователя обязателен' },
        { status: 400 }
      )
    }

    await groupDb.removeUserFromGroup(parseInt(userId), parseInt(id))

    return NextResponse.json({
      success: true,
      message: 'Пользователь удален из группы',
    })
  } catch (error: any) {
    console.error('Error removing user from group:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

