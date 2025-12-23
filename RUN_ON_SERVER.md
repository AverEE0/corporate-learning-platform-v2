# Команды для выполнения на сервере

Подключитесь к серверу по SSH:
```bash
ssh root@212.113.123.94
```

## Вариант 1: Автоматическое исправление (рекомендуется)

Выполните на сервере одну команду:

```bash
cd /root/corporate-learning-platform-v2 && curl -s https://raw.githubusercontent.com/AverEE0/corporate-learning-platform-v2/main/fix-server.sh | bash
```

Или вручную скопируйте и выполните скрипт:

```bash
cd /root/corporate-learning-platform-v2
bash fix-server.sh
```

## Вариант 2: Диагностика проблемы

Сначала выполните диагностику, чтобы понять проблему:

```bash
cd /root/corporate-learning-platform-v2
bash server-diagnose.sh
```

Скрипт покажет:
- Текущий коммит на сервере
- Коммит в контейнере
- Статус контейнеров
- Наличие кеша
- Рекомендации по исправлению

## Вариант 3: Ручное исправление

Если скрипты не работают, выполните команды вручную:

```bash
# 1. Перейти в директорию проекта
cd /root/corporate-learning-platform-v2

# 2. Получить последний код
git pull origin main

# 3. Очистить весь кеш
rm -rf .next node_modules/.cache
find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true

# 4. Остановить контейнер
docker compose down app
docker compose stop app
docker compose rm -f app

# 5. Пересобрать без кеша
docker compose build --no-cache app

# 6. Запустить с принудительным пересозданием
docker compose up -d --force-recreate app

# 7. Очистить кеш внутри контейнера
docker compose exec -T app sh -c "rm -rf .next node_modules/.cache 2>/dev/null || true"

# 8. Перезапустить
docker compose restart app

# 9. Проверить статус
docker compose ps
docker compose logs app --tail=50

# 10. Проверить версию кода
docker compose exec -T app git rev-parse --short HEAD
git rev-parse --short HEAD
```

## Проверка результата

После выполнения команд проверьте:

1. **Статус контейнера:**
   ```bash
   docker compose ps
   ```
   Должен быть статус "Up"

2. **Логи приложения:**
   ```bash
   docker compose logs app --tail=50
   ```
   Не должно быть ошибок

3. **Версия кода:**
   ```bash
   # На сервере
   git rev-parse --short HEAD
   
   # В контейнере
   docker compose exec -T app git rev-parse --short HEAD
   ```
   Коммиты должны совпадать

4. **В браузере:**
   - Откройте https://ykz.tw1.ru в режиме инкогнито
   - Проверьте иконку в боковой панели - должна быть ListChecks (список с галочками)
   - Откройте консоль (F12) и проверьте имя файла .js - не должно быть page-d5f44ff9a7161f69.js

