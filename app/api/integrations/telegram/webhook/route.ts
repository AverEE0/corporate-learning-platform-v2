import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

/**
 * Webhook endpoint для получения обновлений от Telegram Bot
 * Для работы нужно настроить webhook: POST /api/integrations/telegram/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const update = await request.json()

    // Проверяем, что это обновление от Telegram
    if (!update || !update.message && !update.callback_query) {
      return NextResponse.json({ ok: true })
    }

    const message = update.message || update.callback_query?.message
    const chatId = message?.chat?.id
    const text = message?.text || update.callback_query?.data

    if (!chatId || !text) {
      return NextResponse.json({ ok: true })
    }

    // Обработка команд бота
    if (text === '/start') {
      // Сохраняем chatId пользователя (нужно будет связать с аккаунтом через код)
      // В реальном приложении нужно добавить поле telegram_chat_id в таблицу users
      
      console.log('Telegram /start command from chat:', chatId)
      
      // Здесь можно отправить приветственное сообщение
      // или запросить код для связи с аккаунтом
      
      return NextResponse.json({ ok: true })
    }

    // Обработка кода для связи аккаунта
    if (text.startsWith('/link ')) {
      const code = text.replace('/link ', '').trim()
      
      // В реальном приложении:
      // 1. Генерируем код в платформе
      // 2. Пользователь вводит /link <код> в бота
      // 3. Связываем chatId с аккаунтом
      
      console.log('Telegram link code:', code, 'chat:', chatId)
      
      // Пример обновления chatId пользователя:
      // await executeQuery(
      //   'UPDATE users SET telegram_chat_id = $1 WHERE telegram_link_code = $2',
      //   [chatId, code]
      // )
      
      return NextResponse.json({ ok: true })
    }

    // Обработка других команд
    if (text.startsWith('/')) {
      console.log('Telegram command:', text, 'from chat:', chatId)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true }) // Всегда возвращаем ok для Telegram
  }
}

