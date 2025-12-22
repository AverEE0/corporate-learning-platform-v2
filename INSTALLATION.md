# Инструкция по установке

## Требования

- Node.js 18+ 
- PostgreSQL 14+
- npm или pnpm

## Шаги установки

### 1. Установка зависимостей

```bash
cd corporate-learning-platform-v2
npm install
# или
pnpm install
```

### 2. Настройка базы данных

1. Создайте базу данных PostgreSQL:
```sql
CREATE DATABASE corporate_learning;
```

2. Выполните SQL скрипт для создания таблиц:
```bash
psql -d corporate_learning -f scripts/01_create_database.sql
```

### 3. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/corporate_learning
JWT_SECRET=your-super-secret-jwt-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
UPLOAD_DIR=./uploads
```

### 4. Создание папки для загрузок

```bash
mkdir uploads
```

### 5. Запуск проекта

```bash
# Режим разработки
npm run dev

# Продакшн сборка
npm run build
npm start
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Создание первого пользователя

После установки базы данных создайте первого администратора через SQL:

```sql
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
  'admin@example.com',
  '$2a$10$...', -- хеш пароля (используйте bcrypt)
  'Admin',
  'User',
  'admin'
);
```

Или используйте скрипт регистрации в интерфейсе.

## Структура проекта

```
corporate-learning-platform-v2/
├── app/                    # Next.js App Router
│   ├── login/             # Страница входа
│   ├── register/          # Страница регистрации
│   ├── dashboard/         # Дашборд пользователя
│   └── ...
├── components/            # React компоненты
│   ├── ui/               # UI компоненты (Radix UI)
│   └── ...
├── lib/                  # Утилиты и конфигурация
│   ├── database.ts       # Работа с БД
│   └── utils.ts         # Вспомогательные функции
├── scripts/             # SQL скрипты
└── public/              # Статические файлы
```

## Особенности

- ✅ Современный дизайн с градиентами и анимациями
- ✅ Адаптивная верстка
- ✅ Темная тема (поддержка)
- ✅ Система ролей (Админ, Менеджер, Студент)
- ✅ Конструктор курсов
- ✅ Плеер курсов с видео/аудио
- ✅ Система прогресса и аналитики

## Решение проблем

### Ошибка подключения к БД
Проверьте правильность `DATABASE_URL` в `.env.local`

### Ошибки при сборке
Убедитесь, что все зависимости установлены:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Проблемы с загрузкой файлов
Убедитесь, что папка `uploads` существует и доступна для записи

