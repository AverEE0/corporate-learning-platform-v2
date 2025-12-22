import { NextRequest, NextResponse } from 'next/server'
import { requireCSRF } from './csrf'

/**
 * Список путей, которые не требуют CSRF защиты
 */
const CSRF_EXEMPT_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/csrf-token',
  '/api/upload', // Исключаем загрузку файлов из CSRF проверки
]

/**
 * Методы, которые не требуют CSRF защиты (read-only)
 */
const READ_ONLY_METHODS = ['GET', 'HEAD', 'OPTIONS']

/**
 * Middleware для проверки CSRF токена
 * Использовать в middleware.ts или в начале защищенных роутов
 */
export async function csrfMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname
  const method = request.method

  // Пропускаем read-only методы
  if (READ_ONLY_METHODS.includes(method)) {
    return null
  }

  // Пропускаем исключенные пути
  if (CSRF_EXEMPT_PATHS.some(path => pathname.startsWith(path))) {
    return null
  }

  // Проверяем CSRF токен
  const csrfCheck = await requireCSRF(request)

  if (!csrfCheck.success) {
    return NextResponse.json(
      { success: false, error: csrfCheck.error || 'CSRF проверка не пройдена' },
      { status: 403 }
    )
  }

  return null // Продолжаем выполнение
}

