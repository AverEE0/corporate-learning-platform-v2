# Инструкции по развертыванию через Docker

## Проблема
Изменения не применяются из-за проблем с кешем и сборкой. Docker решит эту проблему.

## Быстрое развертывание

### 1. Остановить текущий процесс
```bash
cd /root/corporate-learning-platform-v2
pm2 stop learning-platform
pm2 delete learning-platform
```

### 2. Проверить Docker
```bash
docker --version
docker compose version
```

### 3. Обновить .env.local для Docker
```bash
cat > .env.local << EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/learning_platform
JWT_SECRET=tfj6T/jJ5dgTqoKfZmw1hTqJYSIXO/jI1g2RRlF87bE=
PORT=3044
NODE_ENV=production
EOF
```

### 4. Обновить next.config.js для Docker
Убедитесь что в `next.config.js` есть:
```javascript
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Важно для Docker
  images: {
    domains: ['localhost', 'ykz.tw1.ru', 'www.ykz.tw1.ru'],
  },
}
```

### 5. Создать docker-compose.yml для текущего порта
```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: corporate_learning_app
    restart: unless-stopped
    ports:
      - "3044:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - PORT=3000
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
```

### 6. Собрать и запустить
```bash
docker compose build --no-cache
docker compose up -d
```

### 7. Проверить логи
```bash
docker compose logs -f app
```

### 8. Проверить статус
```bash
docker compose ps
curl http://localhost:3044/api/health
```

## Преимущества Docker

1. ✅ Изолированное окружение
2. ✅ Автоматическая пересборка при изменениях
3. ✅ Легкое масштабирование
4. ✅ Консистентность между окружениями
5. ✅ Простое управление зависимостями

## Если нужно обновить код

```bash
# Остановить
docker compose down

# Пересобрать без кеша
docker compose build --no-cache

# Запустить
docker compose up -d
```

