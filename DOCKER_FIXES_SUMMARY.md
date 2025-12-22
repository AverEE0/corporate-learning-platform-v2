# Исправления для Docker

## Проблемы и решения

### 1. Отсутствие react-is
**Проблема**: `Module not found: Can't resolve 'react-is'`

**Решение**: 
- ✅ Добавлен `react-is` в `package.json` 
- ✅ Обновлен Dockerfile для установки react-is

### 2. База данных в Docker
**Проблема**: Подключение к внешней БД через host.docker.internal может не работать

**Решение**:
- ✅ Добавлен PostgreSQL контейнер в docker-compose.yml
- ✅ Настроено подключение app -> postgres через Docker network
- ✅ Добавлен depends_on для ожидания готовности БД

## Файлы которые нужно загрузить на сервер

1. **package.json** - добавлен react-is
2. **docker-compose.yml** - добавлен PostgreSQL сервис
3. **Dockerfile** - обновлена установка зависимостей
4. **ENV_EXAMPLE.txt** - обновлен DATABASE_URL

## После загрузки на сервер выполните:

```bash
cd /root/corporate-learning-platform-v2

# Обновить .env.local
sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:password@postgres:5432/learning_platform|' .env.local

# Остановить старые контейнеры
docker compose down

# Пересобрать и запустить
docker compose build --no-cache
docker compose up -d

# Проверить логи
docker compose logs -f
```


