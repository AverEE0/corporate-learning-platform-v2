"use client"

/**
 * Клиентские функции для работы с CSRF токенами
 */

let csrfTokenCache: string | null = null

/**
 * Получает CSRF токен с сервера и кеширует его
 */
export async function getCSRFToken(): Promise<string> {
  if (csrfTokenCache) {
    return csrfTokenCache
  }

  try {
    const response = await fetch('/api/csrf-token', { credentials: 'include' })
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.token) {
        csrfTokenCache = data.token
        return data.token
      }
    } else {
      console.error('Failed to fetch CSRF token:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('Error fetching CSRF token:', error)
  }

  throw new Error('Не удалось получить CSRF токен')
}

/**
 * Очищает кеш CSRF токена (например, при выходе)
 */
export function clearCSRFTokenCache(): void {
  csrfTokenCache = null
}

/**
 * Добавляет CSRF токен в заголовки запроса
 */
export async function addCSRFHeader(headers: HeadersInit = {}): Promise<HeadersInit> {
  const token = await getCSRFToken()
  
  const headersObj = headers instanceof Headers 
    ? Object.fromEntries(headers.entries())
    : Array.isArray(headers)
    ? Object.fromEntries(headers)
    : headers

  return {
    ...headersObj,
    'x-csrf-token': token,
  }
}

/**
 * Wrapper для fetch с автоматическим добавлением CSRF токена
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfHeaders = await addCSRFHeader(options.headers)
  
  return fetch(url, {
    ...options,
    headers: {
      ...csrfHeaders,
      ...(options.headers || {}),
    },
  })
}

