import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { executeQuery } from '@/lib/database'

export async function PUT(
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
    const lessonId = parseInt(id)

    if (!lessonId || isNaN(lessonId)) {
      return NextResponse.json(
        { success: false, error: 'Неверный ID урока' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { title, description, orderIndex } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Название урока обязательно' },
        { status: 400 }
      )
    }

    const result = await executeQuery(
      `UPDATE lessons 
       SET title = $1, description = $2, order_index = $3
       WHERE id = $4
       RETURNING *`,
      [title.trim(), description?.trim() || '', orderIndex || 0, lessonId]
    )

    const updatedLesson = Array.isArray(result) ? result[0] : result

    if (!updatedLesson) {
      return NextResponse.json(
        { success: false, error: 'Урок не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      lesson: updatedLesson,
    })
  } catch (error: any) {
    console.error('Error updating lesson:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Ошибка сервера' },
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
    const lessonId = parseInt(id)

    if (!lessonId || isNaN(lessonId)) {
      return NextResponse.json(
        { success: false, error: 'Неверный ID урока' },
        { status: 400 }
      )
    }

    // Удаляем блоки урока
    await executeQuery('DELETE FROM blocks WHERE lesson_id = $1', [lessonId])
    
    // Удаляем урок
    await executeQuery('DELETE FROM lessons WHERE id = $1', [lessonId])

    return NextResponse.json({
      success: true,
      message: 'Урок успешно удален',
    })
  } catch (error: any) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

