import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { courseDb, progressDb } from '@/lib/database'

export async function GET(request: NextRequest) {
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
        { success: false, error: 'Неверный токен' },
        { status: 401 }
      )
    }

    // Получаем только опубликованные курсы для студентов
    // Менеджеры и админы видят все курсы через другой endpoint
    const allCourses = user.role === 'student' 
      ? await courseDb.getPublishedCourses()
      : await courseDb.getAllCourses()

    // Получаем прогресс пользователя по всем курсам
    const userProgress = await Promise.all(
      allCourses.map(async (course: any) => {
        const progress = await progressDb.getUserProgress(user.id, course.id)
        const latestProgress = progress[0] || {}
        
        return {
          id: course.id,
          title: course.title,
          description: course.description,
          progress: latestProgress.completion_percentage || 0,
          score: latestProgress.score || 0,
          status: latestProgress.completed 
            ? 'completed' 
            : (latestProgress.completion_percentage > 0 ? 'in-progress' : 'not-started'),
        }
      })
    )

    return NextResponse.json({
      success: true,
      courses: userProgress,
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

