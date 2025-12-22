# Docker с PostgreSQL - Настройка завершена

## Что было сделано

1. ✅ Добавлен PostgreSQL контейнер в docker-compose.yml
2. ✅ Настроено подключение приложения к PostgreSQL контейнеру
3. ✅ Добавлен healthcheck для PostgreSQL
4. ✅ Добавлен depends_on чтобы приложение ждало готовности БД
5. ✅ Настроен volume для персистентности данных БД
6. ✅ Обновлен DATABASE_URL в .env.local

## Структура docker-compose.yml

```yaml
services:
  postgres:
    - База данных PostgreSQL 16
    - Порт: 5433 на хосте, 5432 в контейнере
    - Volume: postgres_data для сохранения данных
    
  app:
    - Next.js приложение
    - Подключается к postgres:5432
    - Ждет готовности БД перед запуском
```

## Переменные окружения

DATABASE_URL теперь:
```
postgresql://postgres:password@postgres:5432/learning_platform
```

Где:
- `postgres` - имя сервиса в docker-compose (вместо localhost)
- `password` - пароль БД
- `learning_platform` - имя базы данных

## Первый запуск

При первом запуске PostgreSQL автоматически:
1. Создаст базу данных `learning_platform`
2. Выполнит SQL скрипты из `./scripts` (если есть)

## Команды управления

```bash
# Запуск всех сервисов
docker compose up -d

# Остановка всех сервисов
docker compose down

# Остановка с удалением volumes (удалит данные БД!)
docker compose down -v

# Просмотр логов PostgreSQL
docker compose logs postgres

# Подключение к БД
docker compose exec postgres psql -U postgres -d learning_platform

# Выполнение SQL скрипта
docker compose exec -T postgres psql -U postgres -d learning_platform < scripts/01_create_database.sql
```

## Бэкап базы данных

```bash
# Создать бэкап
docker compose exec postgres pg_dump -U postgres learning_platform > backup.sql

# Восстановить из бэкапа
docker compose exec -T postgres psql -U postgres learning_platform < backup.sql
```


