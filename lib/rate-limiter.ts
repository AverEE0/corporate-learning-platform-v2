// Простой rate limiter для API endpoints

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

interface RateLimitOptions {
  windowMs: number // Окно времени в миллисекундах
  maxRequests: number // Максимальное количество запросов
  message?: string // Сообщение при превышении лимита
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = {
    windowMs: 60 * 1000, // 1 минута по умолчанию
    maxRequests: 100, // 100 запросов по умолчанию
    message: 'Слишком много запросов. Пожалуйста, попробуйте позже.',
  }
): { allowed: boolean; remaining: number; resetTime: number; message?: string } {
  const now = Date.now()
  const key = identifier
  const record = store[key]

  // Если записи нет или окно истекло, создаем новую
  if (!record || now > record.resetTime) {
    store[key] = {
      count: 1,
      resetTime: now + options.windowMs,
    }
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime: store[key].resetTime,
    }
  }

  // Увеличиваем счетчик
  record.count += 1

  // Проверяем лимит
  if (record.count > options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      message: options.message,
    }
  }

  return {
    allowed: true,
    remaining: options.maxRequests - record.count,
    resetTime: record.resetTime,
  }
}

export function getClientIdentifier(request: { headers: { get: (key: string) => string | null } }): string {
  // Получаем IP адрес из заголовков или из request
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'
  
  // Также можно использовать user ID если авторизован
  const authHeader = request.headers.get('authorization')
  const userId = authHeader ? 'user_' + authHeader.substring(0, 10) : 'anonymous'
  
  return `${ip}_${userId}`
}

// Очистка старых записей (можно запускать периодически)
export function cleanExpiredEntries(): void {
  const now = Date.now()
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}

// Запускаем очистку каждые 5 минут
if (typeof setInterval !== 'undefined') {
  setInterval(cleanExpiredEntries, 5 * 60 * 1000)
}

