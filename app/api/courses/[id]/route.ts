import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { executeQuery } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, error: 'Неверный ID курса' },
        { status: 400 }
      )
    }

    const courseId = parseInt(id)

    // Получаем курс
    const courseQuery = `SELECT * FROM courses WHERE id = $1`
    const courseResult = await executeQuery(courseQuery, [courseId])
    const course = Array.isArray(courseResult) && courseResult.length > 0 
      ? courseResult[0] 
      : (courseResult || null)

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Курс не найден' },
        { status: 404 }
      )
    }

    // Получаем уроки
    const lessonsQuery = `
      SELECT * FROM lessons 
      WHERE course_id = $1 
      ORDER BY order_index ASC
    `
    const lessonsResult = await executeQuery(lessonsQuery, [courseId])
    const lessons = Array.isArray(lessonsResult) ? lessonsResult : (lessonsResult ? [lessonsResult] : [])

    // Получаем блоки для каждого урока
    const lessonsWithBlocks = await Promise.all(
      lessons.map(async (lesson: any) => {
        if (!lesson || !lesson.id) {
          return lesson
        }

        try {
          const blocksQuery = `
            SELECT * FROM blocks 
            WHERE lesson_id = $1 
            ORDER BY order_index ASC
          `
          const blocksResult = await executeQuery(blocksQuery, [lesson.id])
          const blocks = Array.isArray(blocksResult) ? blocksResult : (blocksResult ? [blocksResult] : [])

          return {
            ...lesson,
            blocks: blocks.map((block: any) => {
              if (!block || !block.content) {
                return { ...block, content: {} }
              }

              try {
                return {
                  ...block,
                  content: typeof block.content === 'string' 
                    ? JSON.parse(block.content) 
                    : block.content,
                }
              } catch (parseError) {
                console.error('Error parsing block content:', parseError)
                return { ...block, content: {} }
              }
            }),
          }
        } catch (blockError) {
          console.error('Error fetching blocks for lesson:', blockError)
          return { ...lesson, blocks: [] }
        }
      })
    )

    return NextResponse.json({
      success: true,
      course: {
        ...course,
        lessons: lessonsWithBlocks || [],
      },
    })
  } catch (error: any) {
    console.error('Error fetching course:', {
      message: error?.message,
      stack: error?.stack?.split('\n').slice(0, 5),
    })
    return NextResponse.json(
      { success: false, error: error?.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

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
    const courseId = parseInt(id)

    if (!courseId || isNaN(courseId)) {
      return NextResponse.json(
        { success: false, error: 'Неверный ID курса' },
        { status: 400 }
      )
    }

    // Проверяем, что курс существует и принадлежит менеджеру (если не админ)
    const courseCheck = await executeQuery('SELECT * FROM courses WHERE id = $1', [courseId])
    const course = Array.isArray(courseCheck) && courseCheck.length > 0 ? courseCheck[0] : null

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Курс не найден' },
        { status: 404 }
      )
    }

    // Менеджер может обновлять только свои курсы
    if (user.role === 'manager' && course.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Вы можете редактировать только свои курсы' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { title, description, status } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Название курса обязательно' },
        { status: 400 }
      )
    }

    const result = await executeQuery(
      `UPDATE courses 
       SET title = $1, description = $2, status = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [title.trim(), description?.trim() || null, status || 'draft', courseId]
    )

    const updatedCourse = Array.isArray(result) ? result[0] : result

    return NextResponse.json({
      success: true,
      course: updatedCourse,
    })
  } catch (error: any) {
    console.error('Error updating course:', error)
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
    const courseId = parseInt(id)

    if (!courseId || isNaN(courseId)) {
      return NextResponse.json(
        { success: false, error: 'Неверный ID курса' },
        { status: 400 }
      )
    }

    // Проверяем, что курс существует и принадлежит менеджеру (если не админ)
    const courseCheck = await executeQuery('SELECT * FROM courses WHERE id = $1', [courseId])
    const course = Array.isArray(courseCheck) && courseCheck.length > 0 ? courseCheck[0] : null

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Курс не найден' },
        { status: 404 }
      )
    }

    // Менеджер может удалять только свои курсы
    if (user.role === 'manager' && course.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Вы можете удалять только свои курсы' },
        { status: 403 }
      )
    }

    // Удаляем связанные данные (блоки, уроки, назначения, прогресс)
    // Сначала блоки
    const lessonsResult = await executeQuery('SELECT id FROM lessons WHERE course_id = $1', [courseId])
    const lessons = Array.isArray(lessonsResult) ? lessonsResult : (lessonsResult ? [lessonsResult] : [])
    
    for (const lesson of lessons) {
      await executeQuery('DELETE FROM blocks WHERE lesson_id = $1', [lesson.id])
    }
    
    // Удаляем уроки
    await executeQuery('DELETE FROM lessons WHERE course_id = $1', [courseId])
    
    // Удаляем назначения курса
    await executeQuery('DELETE FROM course_assignments WHERE course_id = $1', [courseId])
    
    // Удаляем прогресс
    await executeQuery('DELETE FROM user_progress WHERE course_id = $1', [courseId])
    
    // Удаляем зачисления
    await executeQuery('DELETE FROM course_enrollments WHERE course_id = $1', [courseId])
    
    // Удаляем курс
    await executeQuery('DELETE FROM courses WHERE id = $1', [courseId])

    return NextResponse.json({
      success: true,
      message: 'Курс успешно удален',
    })
  } catch (error: any) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

