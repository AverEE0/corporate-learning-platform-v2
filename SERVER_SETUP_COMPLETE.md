# ✅ Настройка сервера завершена

## Выполненные задачи

✅ **Проект скопирован** на сервер: `/root/corporate-learning-platform-v2`

✅ **Зависимости установлены**: 
- npm install --legacy-peer-deps выполнено успешно
- 307 пакетов установлено

✅ **Файл popover.tsx скопирован** пользователем

✅ **.env.local настроен**:
- JWT_SECRET сгенерирован автоматически
- NODE_ENV=production

✅ **Проект собран**: 
- npm run build выполнен успешно
- Директория .next создана

✅ **Запущен через PM2**: 
- Процесс learning-platform запущен
- Конфигурация сохранена (pm2 save)
- Автозапуск настроен (pm2 startup)

## Важно! Требуется настройка

⚠️ **DATABASE_URL**: 
**ОБЯЗАТЕЛЬНО** нужно обновить в `.env.local`:
```bash
nano /root/corporate-learning-platform-v2/.env.local
```

Укажите правильную строку подключения к БД:
```env
DATABASE_URL=postgresql://user:password@host:port/database_name
```

После настройки DATABASE_URL:
1. Выполните миграции БД
2. Перезапустите проект: `pm2 restart learning-platform`

## Команды для управления

```bash
# Статус процесса
pm2 status

# Просмотр логов
pm2 logs learning-platform

# Перезапуск
pm2 restart learning-platform

# Остановка
pm2 stop learning-platform

# Проверка портов
netstat -tlnp | grep :3000
ss -tlnp | grep :3000

# Проверка доступности
curl http://localhost:3000
```

## Проверка работы

Проект должен быть доступен по адресу сервера на порту 3000.

Для проверки через браузер откройте:
- `http://212.113.123.94:3000` (если порт открыт)
- или через домен, если настроен прокси

## Следующие шаги

1. ✅ Настроить DATABASE_URL в .env.local
2. ✅ Выполнить миграции БД (scripts/*.sql)
3. ✅ Создать первого администратора
4. ✅ Настроить nginx/reverse proxy (опционально)
5. ✅ Настроить SSL сертификаты (опционально)

