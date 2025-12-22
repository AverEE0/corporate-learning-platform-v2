import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { executeQuery } from '@/lib/database'

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

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Нет доступа' },
        { status: 403 }
      )
    }

    // Получаем статистику
    const usersQuery = `SELECT COUNT(*) as count, role FROM users GROUP BY role`
    const usersResult: any = await executeQuery(usersQuery)
    const users = Array.isArray(usersResult) ? usersResult : [usersResult]

    const coursesQuery = `SELECT COUNT(*) as count FROM courses`
    const coursesResult: any = await executeQuery(coursesQuery)
    const coursesCount = Array.isArray(coursesResult) ? coursesResult[0]?.count : coursesResult?.count || 0

    // Получаем курсы по статусам
    const coursesByStatusQuery = `SELECT status, COUNT(*) as count FROM courses GROUP BY status`
    const coursesByStatusResult: any = await executeQuery(coursesByStatusQuery)
    const coursesByStatus = Array.isArray(coursesByStatusResult) 
      ? coursesByStatusResult.map((c: any) => ({
          status: c.status === 'published' ? 'Опубликовано' : c.status === 'draft' ? 'Черновики' : 'Архив',
          count: parseInt(String(c.count || 0))
        }))
      : []

    const totalUsers = users.reduce((sum: number, u: any) => sum + parseInt(String(u.count || 0)), 0)
    const totalStudents = parseInt(String(users.find((u: any) => u.role === 'student')?.count || 0))
    const totalManagers = parseInt(String(users.find((u: any) => u.role === 'manager')?.count || 0))

    const usersByRole = users.map((u: any) => ({
      role: u.role === 'student' ? 'Студенты' : u.role === 'manager' ? 'Менеджеры' : 'Админы',
      count: parseInt(String(u.count || 0))
    }))

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        totalCourses: parseInt(String(coursesCount)) || 0,
        totalStudents: totalStudents || 0,
        totalManagers: totalManagers || 0,
      },
      coursesByStatus,
      usersByRole,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

