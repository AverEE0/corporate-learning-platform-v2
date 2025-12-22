# Быстрая настройка на сервере

## Вариант 1: Через plink (одна команда)

Замените `/путь/к/project` на реальный путь к проекту на сервере:

```bash
plink -ssh root@212.113.123.94 -pw "wNaqg6r+wRUDV?" "cd /путь/к/project && npm install && cp .env.example .env.local && mkdir -p uploads logs && echo 'Настройка завершена! Отредактируйте .env.local'"
```

## Вариант 2: Интерактивная настройка

```bash
# 1. Подключитесь
plink -ssh root@212.113.123.94 -pw "wNaqg6r+wRUDV?"

# 2. В сессии выполните:
cd /путь/к/project
npm install
cp .env.example .env.local
nano .env.local  # Отредактируйте DATABASE_URL и JWT_SECRET
mkdir -p uploads logs
npm run build
npm start
```

## Важные настройки в .env.local

```env
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
JWT_SECRET=сгенерируйте_случайную_строку_32+_символов
NODE_ENV=production
```

## После настройки

1. Выполните миграции БД
2. Создайте первого пользователя
3. Проверьте работу: `curl http://localhost:3000`

