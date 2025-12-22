# Docker Deployment Guide

## Быстрый старт

1. Скопируйте `.env.example` в `.env.local`:
```bash
cp .env.example .env.local
```

2. Отредактируйте `.env.local` и укажите правильные значения, особенно:
   - `DATABASE_URL` - должен указывать на доступную PostgreSQL базу данных
   - `JWT_SECRET` - сгенерируйте безопасный случайный ключ
   - `NEXT_PUBLIC_APP_URL` - URL вашего приложения

3. Для Docker используйте `host.docker.internal` в DATABASE_URL если БД на хосте:
```
DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/learning_platform
```

4. Запустите контейнер:
```bash
docker compose up -d --build
```

5. Проверьте логи:
```bash
docker compose logs -f app
```

## Требования

- Docker 20.10+
- Docker Compose 2.0+
- PostgreSQL база данных (может быть на хосте или в отдельном контейнере)
- Минимум 2GB RAM для контейнера

## Конфигурация

### Переменные окружения

Все переменные окружения читаются из файла `.env.local`. Основные:

- `DATABASE_URL` - строка подключения к PostgreSQL
- `JWT_SECRET` - секретный ключ для JWT токенов
- `NEXT_PUBLIC_APP_URL` - публичный URL приложения
- `PORT` - порт внутри контейнера (по умолчанию 3000)

### Порты

- Приложение доступно на порту `3044` на хосте (маппится на `3000` внутри контейнера)
- Если нужно изменить порт, измените в `docker-compose.yml`:
```yaml
ports:
  - "ВАШ_ПОРТ:3000"
```

### Volumes

Следующие директории монтируются как volumes:
- `./uploads` → `/app/uploads` - загруженные файлы
- `./logs` → `/app/logs` - логи приложения

## Управление

### Запуск
```bash
docker compose up -d
```

### Остановка
```bash
docker compose down
```

### Перезапуск
```bash
docker compose restart app
```

### Просмотр логов
```bash
docker compose logs -f app
```

### Пересборка после изменений кода
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Вход в контейнер
```bash
docker compose exec app sh
```

## Проверка работоспособности

1. Проверьте health endpoint:
```bash
curl http://localhost:3044/api/health
```

2. Проверьте статус контейнера:
```bash
docker compose ps
```

3. Проверьте логи на ошибки:
```bash
docker compose logs app | grep -i error
```

## Решение проблем

### Контейнер не запускается

1. Проверьте логи:
```bash
docker compose logs app
```

2. Проверьте что `.env.local` существует и содержит правильные значения

3. Проверьте что порт 3044 свободен:
```bash
lsof -i :3044
# или
netstat -tulpn | grep 3044
```

### Ошибки подключения к базе данных

1. Убедитесь что DATABASE_URL правильный
2. Для БД на хосте используйте `host.docker.internal` вместо `localhost`
3. Проверьте что PostgreSQL доступен:
```bash
docker compose exec app sh -c 'nc -zv host.docker.internal 5432'
```

### Проблемы с правами доступа

Если возникают проблемы с записью в volumes:
```bash
sudo chown -R 1001:1001 uploads logs
```

## Production рекомендации

1. Используйте секреты Docker вместо `.env.local` для чувствительных данных
2. Настройте обратный прокси (nginx) перед приложением
3. Включите SSL/TLS сертификаты
4. Настройте регулярные бэкапы базы данных
5. Мониторинг и логирование
6. Используйте Docker secrets для JWT_SECRET и паролей БД

## Структура

```
corporate-learning-platform-v2/
├── Dockerfile              # Docker образ
├── docker-compose.yml      # Docker Compose конфигурация
├── .dockerignore          # Файлы исключаемые из образа
├── .env.example           # Пример переменных окружения
├── .env.local             # Ваши переменные окружения (не в git)
├── uploads/               # Загруженные файлы (volume)
└── logs/                  # Логи приложения (volume)
```

## Поддержка

При возникновении проблем проверьте:
1. Логи контейнера: `docker compose logs app`
2. Статус контейнера: `docker compose ps`
3. Health endpoint: `curl http://localhost:3044/api/health`
4. Подключение к БД из контейнера


