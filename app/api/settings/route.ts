import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { executeQuery } from '@/lib/database'

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

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Нет доступа' },
        { status: 403 }
      )
    }

    // Получаем настройки из БД или возвращаем дефолтные
    const result = await executeQuery(
      `SELECT key, value FROM platform_settings ORDER BY key`
    )

    const settings: Record<string, any> = {}
    
    if (Array.isArray(result)) {
      result.forEach((row: any) => {
        try {
          settings[row.key] = JSON.parse(row.value)
        } catch {
          settings[row.key] = row.value
        }
      })
    }

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = (await cookies()).get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Нет доступа' },
        { status: 403 }
      )
    }

    const settings = await request.json()

    // Создаем таблицу настроек если её нет
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Сохраняем каждую настройку
    for (const [key, value] of Object.entries(settings)) {
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value)
      
      await executeQuery(
        `INSERT INTO platform_settings (key, value, updated_at) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) 
         DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
        [key, valueStr]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Настройки сохранены',
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сохранения настроек' },
      { status: 500 }
    )
  }
}
