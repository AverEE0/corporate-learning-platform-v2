import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { executeQuery } from '@/lib/database'

export async function GET(
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

    const query = `
      SELECT 
        r.*,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(DISTINCT l.id) as likes_count
      FROM discussion_replies r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN discussion_likes l ON l.reply_id = r.id
      WHERE r.discussion_id = $1
      GROUP BY r.id, u.first_name, u.last_name, u.email
      ORDER BY r.created_at ASC
    `

    const replies = await executeQuery(query, [discussionId])

    return NextResponse.json({
      success: true,
      replies: Array.isArray(replies) ? replies : [replies],
    })
  } catch (error: any) {
    console.error('Error fetching replies:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка загрузки ответов' },
      { status: 500 }
    )
  }
}

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
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Содержимое ответа обязательно' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли обсуждение
    const discussionCheck: any = await executeQuery(
      'SELECT id, is_locked FROM course_discussions WHERE id = $1',
      [discussionId]
    )
    const discussion = Array.isArray(discussionCheck) ? discussionCheck[0] : discussionCheck

    if (!discussion) {
      return NextResponse.json(
        { success: false, error: 'Обсуждение не найдено' },
        { status: 404 }
      )
    }

    if (discussion.is_locked) {
      return NextResponse.json(
        { success: false, error: 'Обсуждение заблокировано' },
        { status: 403 }
      )
    }

    // Создаем ответ
    const insertQuery = `
      INSERT INTO discussion_replies (discussion_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `

    const result: any = await executeQuery(insertQuery, [discussionId, user.id, content.trim()])
    const reply = Array.isArray(result) ? result[0] : result

    // Обновляем счетчик ответов и время последнего ответа
    await executeQuery(
      `UPDATE course_discussions 
       SET replies_count = replies_count + 1, 
           last_reply_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [discussionId]
    )

    return NextResponse.json({
      success: true,
      reply,
    })
  } catch (error: any) {
    console.error('Error creating reply:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка создания ответа' },
      { status: 500 }
    )
  }
}

