// Утилиты для обработки ошибок

export interface ApiError {
  success: false
  error: string
  code?: string
  details?: any
}

export function createErrorResponse(
  error: any,
  defaultMessage: string = 'Ошибка сервера',
  status: number = 500
): Response {
  const errorMessage = error?.message || error?.error || defaultMessage
  const errorCode = error?.code

  // Логируем ошибку с контекстом
  console.error('API Error:', {
    message: errorMessage,
    code: errorCode,
    status,
    stack: error?.stack?.split('\n').slice(0, 5),
    timestamp: new Date().toISOString(),
  })

  const response: ApiError = {
    success: false,
    error: errorMessage,
  }

  if (errorCode) {
    response.code = errorCode
  }

  // В режиме разработки добавляем детали ошибки
  if (process.env.NODE_ENV === 'development' && error?.details) {
    response.details = error.details
  }

  return Response.json(response, { status })
}

export function validateRequired(
  data: Record<string, any>,
  fields: string[]
): { valid: boolean; missingFields?: string[] } {
  const missingFields = fields.filter((field) => {
    const value = data[field]
    return value === undefined || value === null || value === ''
  })

  if (missingFields.length > 0) {
    return {
      valid: false,
      missingFields,
    }
  }

  return { valid: true }
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  // Удаляем потенциально опасные символы
  return input.trim().replace(/[<>]/g, '')
}

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

export function validateInteger(value: any, min?: number, max?: number): boolean {
  const num = parseInt(String(value))
  if (isNaN(num)) {
    return false
  }
  if (min !== undefined && num < min) {
    return false
  }
  if (max !== undefined && num > max) {
    return false
  }
  return true
}

