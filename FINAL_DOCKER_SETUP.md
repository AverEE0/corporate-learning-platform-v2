# ✅ ФИНАЛЬНАЯ НАСТРОЙКА DOCKER

## Что исправлено локально

### 1. package.json ✅
- Добавлен `"react-is": "^18.3.1"` в dependencies

### 2. Dockerfile ✅
- Исправлена установка зависимостей
- Добавлена явная установка react-is

### 3. docker-compose.yml ✅
- Добавлен PostgreSQL контейнер
- Настроено подключение app -> postgres
- Добавлен depends_on и healthcheck
- Добавлен volume для данных БД

### 4. ENV_EXAMPLE.txt ✅
- Обновлен DATABASE_URL для Docker

## ФАЙЛЫ ДЛЯ ЗАГРУЗКИ НА СЕРВЕР

Обязательно загрузите эти обновленные файлы:

1. **package.json** - с react-is
2. **docker-compose.yml** - с PostgreSQL
3. **Dockerfile** - с исправленной установкой
4. **ENV_EXAMPLE.txt** - с обновленным DATABASE_URL

## КОМАНДЫ ДЛЯ ЗАПУСКА НА СЕРВЕРЕ

После загрузки файлов выполните:

```bash
cd /root/corporate-learning-platform-v2

# 1. Обновить .env.local
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://postgres:password@postgres:5432/learning_platform
JWT_SECRET=tfj6T/jJ5dgTqoKfZmw1hTqJYSIXO/jI1g2RRlF87bE=
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://ykz.tw1.ru
EOF

# 2. Остановить все старые контейнеры
docker compose down

# 3. Пересобрать и запустить
docker compose build --no-cache
docker compose up -d

# 4. Проверить статус
docker compose ps

# 5. Проверить логи
docker compose logs -f app

# 6. Проверить подключение к БД
docker compose exec app sh -c 'nc -zv postgres 5432'
```

## Структура docker-compose.yml

Теперь включает:
- **postgres** - база данных PostgreSQL 16
- **app** - Next.js приложение
- Оба контейнера в одной сети app-network
- app зависит от postgres (ждет готовности)

## Проверка работы

```bash
# Health endpoint
curl http://localhost:3044/api/health

# Подключение к БД
docker compose exec postgres psql -U postgres -d learning_platform

# Создать таблицы (если нужно)
docker compose exec -T postgres psql -U postgres -d learning_platform < scripts/01_create_database.sql
```

## Решение проблем

Если build все еще падает с ошибкой react-is:
```bash
# Убедитесь что package.json содержит react-is
grep react-is package.json

# Если нет - добавьте вручную или перезагрузите package.json
```

Если БД не создается:
```bash
# Проверить логи PostgreSQL
docker compose logs postgres

# Вручную создать БД
docker compose exec postgres psql -U postgres -c "CREATE DATABASE learning_platform;"
```


