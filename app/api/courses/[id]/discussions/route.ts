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
    const courseId = parseInt(id)

    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'recent' // recent, popular, pinned
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Безопасная сортировка (избегаем SQL injection)
    let orderByClause = 'd.created_at DESC'
    if (sort === 'popular') {
      orderByClause = 'd.replies_count DESC, d.views_count DESC, d.created_at DESC'
    } else if (sort === 'pinned') {
      orderByClause = 'd.is_pinned DESC, d.created_at DESC'
    }
    // Дополнительная проверка безопасности
    const allowedSorts = [
      'd.created_at DESC',
      'd.replies_count DESC, d.views_count DESC, d.created_at DESC',
      'd.is_pinned DESC, d.created_at DESC'
    ]
    if (!allowedSorts.includes(orderByClause)) {
      orderByClause = 'd.created_at DESC'
    }

    const query = `
      SELECT 
        d.id,
        d.course_id,
        d.user_id,
        d.title,
        d.content,
        d.is_pinned,
        d.is_locked,
        d.views_count,
        d.replies_count,
        d.last_reply_at,
        d.created_at,
        d.updated_at,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(DISTINCT l.id) as likes_count
      FROM course_discussions d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN discussion_likes l ON l.discussion_id = d.id
      WHERE d.course_id = $1
      GROUP BY 
        d.id, d.course_id, d.user_id, d.title, d.content, d.is_pinned, 
        d.is_locked, d.views_count, d.replies_count, d.last_reply_at, 
        d.created_at, d.updated_at, u.first_name, u.last_name, u.email
      ORDER BY ${orderByClause}
      LIMIT $2 OFFSET $3
    `

    const discussions = await executeQuery(query, [courseId, limit, offset])

    // Получаем общее количество
    const countQuery = `SELECT COUNT(*) as count FROM course_discussions WHERE course_id = $1`
    const countResult: any = await executeQuery(countQuery, [courseId])
    const total = Array.isArray(countResult) ? countResult[0]?.count : countResult?.count || 0

    return NextResponse.json({
      success: true,
      discussions: Array.isArray(discussions) ? discussions : [discussions],
      pagination: {
        page,
        limit,
        total: parseInt(String(total)),
        totalPages: Math.ceil(parseInt(String(total)) / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching discussions:', error)
    
    // Если таблица не существует, возвращаем пустой список
    if (error?.message?.includes('does not exist') || error?.code === '42P01') {
      return NextResponse.json({
        success: true,
        discussions: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      })
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка загрузки обсуждений' },
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
    const courseId = parseInt(id)

    const body = await request.json()
    const { title, content } = body

    if (!title || !title.trim() || !content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Заголовок и содержимое обязательны' },
        { status: 400 }
      )
    }

    if (title.trim().length > 255) {
      return NextResponse.json(
        { success: false, error: 'Заголовок не должен превышать 255 символов' },
        { status: 400 }
      )
    }

    const query = `
      INSERT INTO course_discussions (course_id, user_id, title, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `

    const result: any = await executeQuery(query, [courseId, user.id, title.trim(), content.trim()])
    const discussion = Array.isArray(result) ? result[0] : result

    return NextResponse.json({
      success: true,
      discussion,
    })
  } catch (error: any) {
    console.error('Error creating discussion:', error)
    
    // Если таблица не существует, возвращаем ошибку
    if (error?.message?.includes('does not exist') || error?.code === '42P01') {
      return NextResponse.json(
        { success: false, error: 'Функция обсуждений не настроена. Выполните миграцию базы данных.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка создания обсуждения' },
      { status: 500 }
    )
  }
}

