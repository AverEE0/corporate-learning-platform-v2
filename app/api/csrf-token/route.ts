import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const CSRF_TOKEN_COOKIE = 'csrf-token'
const CSRF_TOKEN_EXPIRY = 60 * 60 * 24 // 24 часа в секундах

/**
 * API endpoint для получения CSRF токена
 * Вызывается клиентом при загрузке страницы
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    let token = cookieStore.get(CSRF_TOKEN_COOKIE)?.value

    // Если токена нет, создаем новый
    if (!token) {
      token = crypto.randomBytes(32).toString('hex')
    }

    // Создаем response
    const response = NextResponse.json({
      success: true,
      token,
    })

    // Устанавливаем cookie в response
    // В production всегда используем secure: true, так как nginx работает с HTTPS
    // В development можно использовать false для локальной разработки
    const isSecure = process.env.NODE_ENV === 'production'
    
    response.cookies.set(CSRF_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax', // Используем 'lax' для лучшей совместимости
      maxAge: CSRF_TOKEN_EXPIRY,
      path: '/',
    })

    console.log('[CSRF Token] Generated and set:', {
      tokenLength: token.length,
      secure: isSecure,
      sameSite: 'lax',
      nodeEnv: process.env.NODE_ENV,
    })

    return response
  } catch (error: any) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка генерации CSRF токена' },
      { status: 500 }
    )
  }
}

