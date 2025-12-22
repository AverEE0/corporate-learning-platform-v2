# ✅ Финальная конфигурация сервера

## Настройки выполнены

✅ **Порт изменен на 3044**  
✅ **DATABASE_URL настроен**  
✅ **Проект перезапущен через PM2**  

## Текущая конфигурация .env.local

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/learning_platform
JWT_SECRET=tfj6T/jJ5dgTqoKfZmw1hTqJYSIXO/jI1g2RRlF87bE=
NODE_ENV=production
PORT=3044
```

⚠️ **ВАЖНО:** 
- Если пароль PostgreSQL другой, обновите DATABASE_URL
- Если база данных называется по-другому, измените `learning_platform` на нужное имя

## Доступ к приложению

Приложение теперь доступно на порту **3044**:
- `http://localhost:3044` (на сервере)
- `http://212.113.123.94:3044` (если порт открыт в firewall)

## Команды управления

```bash
# Статус
pm2 status

# Логи
pm2 logs learning-platform

# Перезапуск
pm2 restart learning-platform

# Остановка
pm2 stop learning-platform
```

## Следующие шаги

1. **Проверить подключение к БД:**
   ```bash
   psql postgresql://postgres:password@localhost:5432/learning_platform
   ```

2. **Создать базу данных (если не существует):**
   ```sql
   CREATE DATABASE learning_platform;
   ```

3. **Выполнить миграции:**
   ```bash
   cd /root/corporate-learning-platform-v2
   psql postgresql://postgres:password@localhost:5432/learning_platform < scripts/01_create_database.sql
   # и т.д. для остальных миграций
   ```

4. **Обновить DATABASE_URL** в `.env.local` если нужно:
   ```bash
   nano /root/corporate-learning-platform-v2/.env.local
   ```

