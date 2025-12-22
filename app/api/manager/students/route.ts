import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { userDb } from '@/lib/database'

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

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json(
        { success: false, error: 'Нет доступа' },
        { status: 403 }
      )
    }

    const students = await userDb.getAllStudents()

    const formattedStudents = students.map((student: any) => ({
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      enrolledCourses: parseInt(student.enrolled_courses) || 0,
      assignedCourses: parseInt(student.assigned_courses) || 0,
      averageScore: Math.round(parseFloat(student.average_score) || 0),
      lastActivity: student.last_activity || student.last_login || student.updated_at || student.created_at,
      lastLogin: student.last_login || null,
    }))

    return NextResponse.json({
      success: true,
      students: formattedStudents,
      total: formattedStudents.length,
    })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

