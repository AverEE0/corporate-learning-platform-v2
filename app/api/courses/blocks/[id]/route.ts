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
    const blockId = parseInt(id)

    if (!blockId || isNaN(blockId)) {
      return NextResponse.json(
        { success: false, error: 'Неверный ID блока' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { type, title, content, orderIndex } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Название блока обязательно' },
        { status: 400 }
      )
    }

    // Валидация и сериализация контента
    let contentJson = {}
    if (content) {
      try {
        if (typeof content === 'object' && !Array.isArray(content)) {
          contentJson = content
        } else if (typeof content === 'string') {
          try {
            contentJson = JSON.parse(content)
            if (typeof contentJson !== 'object' || Array.isArray(contentJson)) {
              contentJson = { text: content }
            }
          } catch {
            contentJson = { text: content }
          }
        }
      } catch (parseError) {
        console.error('Error parsing content:', parseError)
        contentJson = typeof content === 'string' ? { text: content } : {}
      }
    }

    const result = await executeQuery(
      `UPDATE blocks 
       SET type = $1, title = $2, content = $3, order_index = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [type || 'text', title.trim(), JSON.stringify(contentJson), orderIndex || 0, blockId]
    )

    const updatedBlock = Array.isArray(result) ? result[0] : result

    if (!updatedBlock) {
      return NextResponse.json(
        { success: false, error: 'Блок не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      block: updatedBlock,
    })
  } catch (error: any) {
    console.error('Error updating block:', error)
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
    const blockId = parseInt(id)

    if (!blockId || isNaN(blockId)) {
      return NextResponse.json(
        { success: false, error: 'Неверный ID блока' },
        { status: 400 }
      )
    }

    await executeQuery('DELETE FROM blocks WHERE id = $1', [blockId])

    return NextResponse.json({
      success: true,
      message: 'Блок успешно удален',
    })
  } catch (error: any) {
    console.error('Error deleting block:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

