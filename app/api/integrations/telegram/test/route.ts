import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { getBotInfo, sendTelegramMessage } from '@/lib/telegram-bot'
import { executeQuery } from '@/lib/database'

/**
 * Тестирование Telegram бота
 */
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

    const { botToken, chatId } = await request.json()

    if (!botToken) {
      return NextResponse.json(
        { success: false, error: 'Токен бота обязателен' },
        { status: 400 }
      )
    }

    // Проверяем информацию о боте
    try {
      const botInfo = await getBotInfo(botToken)
      
      // Если указан chatId, отправляем тестовое сообщение
      if (chatId) {
        const success = await sendTelegramMessage(
          { botToken, chatId },
          {
            text: '✅ <b>Тестовое сообщение</b>\n\nTelegram бот успешно настроен и работает!',
            parse_mode: 'HTML',
          }
        )

        if (success) {
          return NextResponse.json({
            success: true,
            message: 'Тестовое сообщение отправлено',
            botInfo,
          })
        } else {
          return NextResponse.json(
            { success: false, error: 'Не удалось отправить тестовое сообщение', botInfo },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Бот настроен корректно',
        botInfo,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Ошибка проверки бота' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error testing Telegram bot:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

