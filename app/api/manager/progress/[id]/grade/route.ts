import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { executeQuery } from '@/lib/database'
import { requireCSRF } from '@/lib/csrf'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверка CSRF токена
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.success) {
      return NextResponse.json(
        { success: false, error: csrfCheck.error },
        { status: 403 }
      )
    }

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
    const progressId = parseInt(id)

    if (!progressId || isNaN(progressId)) {
      return NextResponse.json(
        { success: false, error: 'Неверный ID прогресса' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { score, feedback } = body

    if (score === undefined || score === null) {
      return NextResponse.json(
        { success: false, error: 'Оценка обязательна' },
        { status: 400 }
      )
    }

    const scoreNum = parseFloat(String(score))
    if (isNaN(scoreNum) || scoreNum < 0) {
      return NextResponse.json(
        { success: false, error: 'Оценка должна быть неотрицательным числом' },
        { status: 400 }
      )
    }

    // Проверяем, что этот прогресс относится к курсу менеджера (или пользователь - админ)
    const progressCheck = await executeQuery(
      `SELECT up.course_id, c.created_by 
       FROM user_progress up
       INNER JOIN courses c ON up.course_id = c.id
       WHERE up.id = $1`,
      [progressId]
    )
    const progressData = Array.isArray(progressCheck) ? progressCheck[0] : progressCheck

    if (!progressData) {
      return NextResponse.json(
        { success: false, error: 'Прогресс не найден' },
        { status: 404 }
      )
    }

    if (user.role === 'manager' && progressData.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Нет доступа к этому прогрессу' },
        { status: 403 }
      )
    }

    // Обновляем оценку
    // Если есть feedback, добавляем его в answers как feedback
    let updateQuery = 'UPDATE user_progress SET score = $1, updated_at = CURRENT_TIMESTAMP'
    const updateParams: any[] = [scoreNum]

    if (feedback) {
      // Получаем текущие answers
      const currentAnswers = await executeQuery(
        'SELECT answers FROM user_progress WHERE id = $1',
        [progressId]
      )
      const current = Array.isArray(currentAnswers) ? currentAnswers[0] : currentAnswers
      let answersObj = {}
      
      try {
        if (current?.answers) {
          answersObj = typeof current.answers === 'string'
            ? JSON.parse(current.answers)
            : current.answers
        }
      } catch (e) {
        console.error('Error parsing current answers:', e)
      }

      // Добавляем feedback в answers
      answersObj = { ...answersObj, feedback: String(feedback) }
      updateQuery += ', answers = $2'
      updateParams.push(JSON.stringify(answersObj))
    }

    updateQuery += ' WHERE id = $' + (updateParams.length + 1)
    updateParams.push(progressId)

    await executeQuery(updateQuery, updateParams)

    return NextResponse.json({
      success: true,
      message: 'Оценка обновлена',
    })
  } catch (error: any) {
    console.error('Error updating grade:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

