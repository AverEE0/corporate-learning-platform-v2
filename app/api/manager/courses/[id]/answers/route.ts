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

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json(
        { success: false, error: 'Нет доступа' },
        { status: 403 }
      )
    }

    const { id } = await params
    const courseId = parseInt(id)

    if (!courseId || isNaN(courseId)) {
      return NextResponse.json(
        { success: false, error: 'Неверный ID курса' },
        { status: 400 }
      )
    }

    // Проверяем, что курс принадлежит менеджеру (или пользователь - админ)
    if (user.role === 'manager') {
      const courseCheck = await executeQuery(
        'SELECT created_by FROM courses WHERE id = $1',
        [courseId]
      )
      const course = Array.isArray(courseCheck) ? courseCheck[0] : courseCheck
      if (!course || course.created_by !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Нет доступа к этому курсу' },
          { status: 403 }
        )
      }
    }

    // Получаем все ответы студентов по этому курсу
    // Ищем блоки с типами вопросов text/audio/video и получаем ответы на них
    const query = `
      SELECT 
        up.id as progress_id,
        up.user_id,
        up.course_id,
        up.lesson_id,
        up.block_id,
        up.answers,
        up.score,
        up.completed_at,
        up.updated_at,
        u.first_name,
        u.last_name,
        u.email,
        l.title as lesson_title,
        b.title as block_title,
        b.type as block_type,
        b.content as block_content
      FROM user_progress up
      INNER JOIN users u ON up.user_id = u.id
      INNER JOIN lessons l ON up.lesson_id = l.id
      INNER JOIN blocks b ON up.block_id = b.id
      WHERE up.course_id = $1
        AND b.type = 'quiz'
        AND (
          (b.content::jsonb->>'questionType')::text IN ('text', 'audio', 'video')
          OR up.answers IS NOT NULL
        )
      ORDER BY up.updated_at DESC, u.last_name, u.first_name
    `

    const results = await executeQuery(query, [courseId])
    const answers = Array.isArray(results) ? results : [results]

    // Парсим JSONB поля
    const parsedAnswers = answers.map((item: any) => {
      let blockContent = {}
      let answersObj = {}

      try {
        if (item.block_content) {
          blockContent = typeof item.block_content === 'string'
            ? JSON.parse(item.block_content)
            : item.block_content
        }
      } catch (e) {
        console.error('Error parsing block_content:', e)
      }

      try {
        if (item.answers) {
          answersObj = typeof item.answers === 'string'
            ? JSON.parse(item.answers)
            : item.answers
        }
      } catch (e) {
        console.error('Error parsing answers:', e)
      }

      return {
        ...item,
        block_content: blockContent,
        answers: answersObj,
      }
    })

    return NextResponse.json({
      success: true,
      answers: parsedAnswers,
    })
  } catch (error: any) {
    console.error('Error fetching student answers:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

