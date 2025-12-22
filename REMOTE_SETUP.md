# Инструкция по настройке на удаленном сервере

## Подключение через plink

### Быстрый вариант (одна строка):

```bash
plink -ssh root@212.113.123.94 -pw "wNaqg6r+wRUDV?" "cd /путь/к/project && npm install && cp .env.example .env.local"
```

### Пошаговая настройка:

#### 1. Подключитесь к серверу:
```bash
plink -ssh root@212.113.123.94 -pw "wNaqg6r+wRUDV?"
```

#### 2. Перейдите в директорию проекта:
```bash
cd /путь/к/вашему/проекту
# Например: cd /var/www/corporate-learning-platform-v2
```

#### 3. Проверьте версии:
```bash
node --version  # Должно быть 18+
npm --version
```

#### 4. Установите зависимости:
```bash
npm install
```

#### 5. Создайте файл окружения:
```bash
cp .env.example .env.local
nano .env.local  # или vi .env.local
```

В файле `.env.local` укажите:
```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=ваш_случайный_секрет_минимум_32_символа
NODE_ENV=production
```

#### 6. Выполните миграции БД:
```bash
# Подключитесь к PostgreSQL и выполните миграции
psql $DATABASE_URL < scripts/01_create_database.sql
psql $DATABASE_URL < scripts/03_add_audit_logs.sql
psql $DATABASE_URL < scripts/04_add_notifications.sql
psql $DATABASE_URL < scripts/05_add_achievements.sql
psql $DATABASE_URL < scripts/06_add_forums.sql
```

#### 7. Соберите проект:
```bash
npm run build
```

#### 8. Запустите проект:
```bash
# Для продакшена:
npm start

# Или для разработки:
npm run dev
```

## Автоматический скрипт

Создайте файл `setup.sh` на сервере:

```bash
#!/bin/bash
set -e

echo "Настройка проекта..."

# Установка зависимостей
npm install

# Создание .env.local
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "Файл .env.local создан. Отредактируйте его!"
fi

# Создание директорий
mkdir -p uploads logs

echo "Готово! Отредактируйте .env.local и выполните миграции БД."
```

Затем выполните:
```bash
chmod +x setup.sh
./setup.sh
```

## Использование PM2 для постоянной работы

Для запуска в фоне используйте PM2:

```bash
# Установка PM2
npm install -g pm2

# Запуск проекта
pm2 start npm --name "learning-platform" -- start

# Сохранение конфигурации
pm2 save
pm2 startup
```

## Проверка работы

После запуска проверьте:
```bash
# Статус
pm2 status

# Логи
pm2 logs learning-platform

# Перезапуск
pm2 restart learning-platform
```

