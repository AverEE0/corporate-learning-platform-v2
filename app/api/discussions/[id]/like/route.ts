import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { executeQuery } from '@/lib/database'

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

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const { id } = await params
    const discussionId = parseInt(id)

    const body = await request.json()
    const { replyId } = body

    // Проверяем, есть ли уже лайк
    const existingQuery = replyId
      ? 'SELECT id FROM discussion_likes WHERE user_id = $1 AND reply_id = $2'
      : 'SELECT id FROM discussion_likes WHERE user_id = $1 AND discussion_id = $2'
    
    const existingParams = replyId ? [user.id, replyId] : [user.id, discussionId]
    const existing: any = await executeQuery(existingQuery, existingParams)

    if (Array.isArray(existing) && existing.length > 0) {
      // Удаляем лайк
      const deleteQuery = replyId
        ? 'DELETE FROM discussion_likes WHERE user_id = $1 AND reply_id = $2'
        : 'DELETE FROM discussion_likes WHERE user_id = $1 AND discussion_id = $2'
      
      await executeQuery(deleteQuery, existingParams)

      return NextResponse.json({
        success: true,
        liked: false,
      })
    } else {
      // Добавляем лайк
      const insertQuery = replyId
        ? 'INSERT INTO discussion_likes (user_id, reply_id) VALUES ($1, $2)'
        : 'INSERT INTO discussion_likes (user_id, discussion_id) VALUES ($1, $2)'
      
      await executeQuery(insertQuery, existingParams)

      return NextResponse.json({
        success: true,
        liked: true,
      })
    }
  } catch (error: any) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка обработки лайка' },
      { status: 500 }
    )
  }
}

