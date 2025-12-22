# Инструкция по развертыванию проекта

## Быстрый старт

### 1. Копирование файлов
Скопируйте все файлы проекта (кроме `node_modules`, `.next`, `.env.local`)

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка переменных окружения
Создайте файл `.env.local`:
```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_random_secret_key_here_min_32_chars
NODE_ENV=production
```

### 4. Выполнение миграций БД
Выполните все SQL скрипты из папки `scripts/` в правильном порядке:
1. `01_create_database.sql`
2. `03_add_audit_logs.sql` (если нужно)
3. `04_add_notifications.sql` (если нужно)
4. `05_add_achievements.sql` (если нужно)
5. `06_add_forums.sql` (если нужно)

### 5. Создание первого пользователя
Создайте админ пользователя через SQL или через регистрацию (если доступна).

Или используйте скрипт для создания тестовых пользователей:
```bash
node scripts/create_test_users_with_db.js
```

### 6. Сборка и запуск
```bash
# Сборка
npm run build

# Запуск (продакшен)
npm start

# Или для разработки
npm run dev
```

## Проверка работоспособности

1. Откройте браузер и перейдите на `http://localhost:3000`
2. Попробуйте войти с созданными учетными данными
3. Проверьте основные функции согласно `TESTING_GUIDE.md`

## Полная документация

- `DEPLOYMENT_CHECKLIST.md` - подробный чеклист развертывания
- `TESTING_GUIDE.md` - руководство по тестированию
- `FUNCTIONALITY_CHECKLIST.md` - чеклист проверки функций
