# Исправление RSC ошибки в Docker

## Проблема

Ошибка: `Failed to fetch RSC payload` и `Cannot read properties of undefined (reading 'call')`

Это связано с проблемами React Server Components в Next.js при сборке или подключении к БД.

## Решение

1. ✅ Добавлен `extra_hosts` в docker-compose.yml для доступа к хосту из контейнера
2. ✅ Исправлен порт на 3044:3000
3. ✅ Пересобран контейнер без кеша
4. ✅ Проверено подключение к БД через `host.docker.internal`

## Проверка

После пересборки проверьте:
- Логи контейнера: `docker compose logs app`
- Health endpoint: `curl http://localhost:3044/api/health`
- Работает ли авторизация
- Загружаются ли данные на странице админки


