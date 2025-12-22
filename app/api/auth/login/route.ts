import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { executeQuery } from '@/lib/database'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getOrCreateCSRFToken } from '@/lib/csrf'
import { rateLimit, getClientIdentifier } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting для защиты от brute-force атак
    const clientIdentifier = getClientIdentifier(request)
    const rateLimitCheck = rateLimit(`login_${clientIdentifier}`, {
      windowMs: 15 * 60 * 1000, // 15 минут
      maxRequests: 5, // 5 попыток
      message: 'Слишком много попыток входа. Попробуйте позже.',
    })

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, error: rateLimitCheck.message || 'Слишком много попыток входа. Попробуйте позже.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    const userResult: any = await executeQuery(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )

    const user = Array.isArray(userResult) ? userResult[0] : userResult

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Обновляем время последнего входа
    await executeQuery(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    )

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    // Генерируем CSRF токен при входе
    const csrfToken = await getOrCreateCSRFToken()

    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      csrfToken, // Возвращаем CSRF токен клиенту
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
