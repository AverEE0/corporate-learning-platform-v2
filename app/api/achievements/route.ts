import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { getUserAchievements, getUserXP } from '@/lib/achievements'

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
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeXP = searchParams.get('includeXP') === 'true'

    const achievements = await getUserAchievements(user.id)
    let xp = null

    if (includeXP) {
      xp = await getUserXP(user.id)
    }

    return NextResponse.json({
      success: true,
      achievements,
      xp,
    })
  } catch (error: any) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка загрузки достижений' },
      { status: 500 }
    )
  }
}

