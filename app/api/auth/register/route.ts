import { NextRequest, NextResponse } from 'next/server'
import { userDb } from '@/lib/database'
import { hashPassword, generateToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { validateEmail, sanitizeInput } from '@/lib/error-handler'
import { rateLimit, getClientIdentifier } from '@/lib/rate-limiter'
import { auditLogDb, getClientIp, getUserAgent } from '@/lib/audit-log'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting для защиты от массовой регистрации
    const clientId = getClientIdentifier(request)
    const limitCheck = rateLimit(clientId, {
      windowMs: 60 * 60 * 1000, // 1 час
      maxRequests: 3, // 3 регистрации в час
      message: 'Превышен лимит регистраций. Пожалуйста, попробуйте позже.',
    })

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { success: false, error: limitCheck.message },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((limitCheck.resetTime - Date.now()) / 1000).toString(),
          }
        }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { email, password, firstName, lastName, role = 'student' } = body

    // Валидация обязательных полей
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Все поля обязательны' },
        { status: 400 }
      )
    }

    // Валидация email
    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный формат email' },
        { status: 400 }
      )
    }

    // Валидация пароля
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      )
    }

    if (password.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Пароль слишком длинный (максимум 100 символов)' },
        { status: 400 }
      )
    }

    // Валидация имени и фамилии
    const sanitizedFirstName = sanitizeInput(firstName)
    const sanitizedLastName = sanitizeInput(lastName)

    if (!sanitizedFirstName || sanitizedFirstName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Имя должно содержать минимум 2 символа' },
        { status: 400 }
      )
    }

    if (!sanitizedLastName || sanitizedLastName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Фамилия должна содержать минимум 2 символа' },
        { status: 400 }
      )
    }

    if (sanitizedFirstName.length > 100 || sanitizedLastName.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Имя и фамилия не должны превышать 100 символов' },
        { status: 400 }
      )
    }

    // Валидация роли
    if (role && !['admin', 'manager', 'student'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Недопустимая роль пользователя' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли пользователь
    const existingUser = await userDb.getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    // Хешируем пароль
    const passwordHash = await hashPassword(password)

    // Создаем пользователя
    const result = await userDb.createUser({
      email: email.trim().toLowerCase(),
      password: passwordHash,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      role: role as 'admin' | 'manager' | 'student',
    })

    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new Error('Пользователь не был создан')
    }

    const user = result[0]

    if (!user || !user.id) {
      throw new Error('Ошибка при создании пользователя')
    }

    // Логируем создание пользователя
    try {
      await auditLogDb.createLog({
        user_id: user.id,
        action: 'user.created',
        resource_type: 'user',
        resource_id: user.id,
        details: {
          email: user.email,
          role: user.role,
        },
        ip_address: getClientIp(request),
        user_agent: getUserAgent(request),
      })
    } catch (auditError) {
      console.error('Error creating audit log:', auditError)
    }

    const token: string = generateToken({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    })

    // Устанавливаем cookie
    const cookieStore = await cookies()
    const isHttps = request.url.startsWith('https://')
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: isHttps, // Только для HTTPS соединений
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
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
      token,
    })
  } catch (error: any) {
    console.error('Register error:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.split('\n').slice(0, 5),
    })

    // Обработка специфических ошибок
    if (error?.message?.includes('уже существует') || error?.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error?.message || 'Ошибка регистрации' },
      { status: 500 }
    )
  }
}

