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
        
        // Создаем простой объект без циклических ссылок
        const courseData = {
          id: Number(course.id) || 0,
          title: String(course.title || ''),
          description: String(course.description || ''),
          progress: Number(latestProgress.completion_percentage) || 0,
          score: Number(latestProgress.score) || 0,
          status: latestProgress.completed 
            ? 'completed' 
            : (Number(latestProgress.completion_percentage) > 0 ? 'in-progress' : 'not-started'),
        }
        
        return courseData
      })
    )

    // Убеждаемся, что данные сериализуются без проблем
    try {
      // Тестовая сериализация для проверки циклических ссылок
      JSON.stringify(userProgress)
    } catch (error: any) {
      console.error('Error serializing courses data:', error)
      // Возвращаем упрощенные данные в случае ошибки
      return NextResponse.json({
        success: true,
        courses: userProgress.map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          progress: c.progress,
          score: c.score,
          status: c.status,
        })),
      })
    }

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

