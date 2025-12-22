import { cookies } from 'next/headers'
import crypto from 'crypto'

const CSRF_TOKEN_COOKIE = 'csrf-token'
const CSRF_TOKEN_HEADER = 'x-csrf-token'
const CSRF_TOKEN_EXPIRY = 60 * 60 * 24 // 24 часа в секундах

/**
 * Генерирует новый CSRF токен
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Получает CSRF токен из cookie
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_TOKEN_COOKIE)?.value || null
}

/**
 * Устанавливает CSRF токен в cookie
 */
export async function setCSRFToken(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Изменено с 'strict' на 'lax' для лучшей совместимости
    maxAge: CSRF_TOKEN_EXPIRY,
    path: '/',
  })
}

/**
 * Верифицирует CSRF токен из заголовка запроса
 */
export async function verifyCSRFToken(request: Request): Promise<boolean> {
  try {
    // Получаем токен из заголовка
    const tokenFromHeader = request.headers.get(CSRF_TOKEN_HEADER)
    
    if (!tokenFromHeader) {
      console.log('[CSRF] No token in header', {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries())
      })
      return false
    }

    // Получаем токен из cookie
    const tokenFromCookie = await getCSRFToken()

    if (!tokenFromCookie) {
      console.log('[CSRF] No token in cookie', {
        url: request.url,
        method: request.method,
      })
      return false
    }

    // Проверяем длину перед сравнением
    const headerBuffer = Buffer.from(tokenFromHeader)
    const cookieBuffer = Buffer.from(tokenFromCookie)
    
    if (headerBuffer.length !== cookieBuffer.length) {
      console.log(`[CSRF] Token length mismatch: header=${headerBuffer.length}, cookie=${cookieBuffer.length}`)
      return false
    }

    // Сравниваем токены (постоянное время сравнения для защиты от timing attacks)
    const isValid = crypto.timingSafeEqual(headerBuffer, cookieBuffer)
    
    if (!isValid) {
      console.log('[CSRF] Token mismatch', {
        headerPrefix: tokenFromHeader.substring(0, 10),
        cookiePrefix: tokenFromCookie.substring(0, 10),
      })
    } else {
      console.log('[CSRF] Token verified successfully')
    }
    
    return isValid
  } catch (error: any) {
    console.error('[CSRF] Verification error:', error?.message || error, {
      stack: error?.stack?.split('\n').slice(0, 3),
    })
    return false
  }
}

/**
 * Middleware для проверки CSRF токена в API роутах
 */
export async function requireCSRF(request: Request): Promise<{ success: boolean; error?: string }> {
  // Исключаем GET запросы (они не изменяют состояние)
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return { success: true }
  }

  const isValid = await verifyCSRFToken(request)

  if (!isValid) {
    return {
      success: false,
      error: 'Неверный или отсутствующий CSRF токен',
    }
  }

  return { success: true }
}

/**
 * Получает или создает CSRF токен для клиента
 */
export async function getOrCreateCSRFToken(): Promise<string> {
  let token = await getCSRFToken()

  if (!token) {
    token = generateCSRFToken()
    await setCSRFToken(token)
  }

  return token
}

