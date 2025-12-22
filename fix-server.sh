#!/bin/bash

# Скрипт для автоматического исправления проблем на сервере
# Использование: ./fix-server.sh

set -e

echo "=========================================="
echo "🔧 Исправление проблем сервера"
echo "=========================================="
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd /root/corporate-learning-platform-v2

echo "1. Проверка и создание .env.local"
echo "----------------------------------------"
if [ ! -f ".env.local" ]; then
    echo "Создаю .env.local..."
    cat > .env.local << EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/learning_platform
JWT_SECRET=tfj6T/jJ5dgTqoKfZmw1hTqJYSIXO/jI1g2RRlF87bE=
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=http://212.113.123.94:3044
EOF
    echo -e "${GREEN}✓${NC} .env.local создан"
else
    echo -e "${GREEN}✓${NC} .env.local уже существует"
    # Проверяем наличие обязательных переменных
    if ! grep -q "DATABASE_URL" .env.local; then
        echo "Добавляю DATABASE_URL..."
        echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/learning_platform" >> .env.local
    fi
    if ! grep -q "JWT_SECRET" .env.local; then
        echo "Добавляю JWT_SECRET..."
        echo "JWT_SECRET=tfj6T/jJ5dgTqoKfZmw1hTqJYSIXO/jI1g2RRlF87bE=" >> .env.local
    fi
fi
echo ""

echo "2. Создание необходимых директорий"
echo "----------------------------------------"
mkdir -p uploads logs
chmod 755 uploads logs
echo -e "${GREEN}✓${NC} Директории созданы"
echo ""

echo "3. Остановка старых контейнеров"
echo "----------------------------------------"
if docker ps -a --format "{{.Names}}" | grep -q "corporate_learning_app"; then
    echo "Останавливаю старые контейнеры..."
    docker compose down 2>/dev/null || true
    docker stop corporate_learning_app 2>/dev/null || true
    docker rm corporate_learning_app 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Старые контейнеры остановлены"
else
    echo -e "${GREEN}✓${NC} Старые контейнеры не найдены"
fi
echo ""

echo "4. Проверка docker-compose.yml"
echo "----------------------------------------"
if [ ! -f "docker-compose.yml" ]; then
    echo "Создаю docker-compose.yml..."
    cat > docker-compose.yml << 'EOF'
services:
  postgres:
    image: postgres:16-alpine
    container_name: corporate_learning_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: learning_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts:/docker-entrypoint-initdb.d
    ports:
      - "5433:5432"
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: corporate_learning_app
    restart: unless-stopped
    ports:
      - "3044:3000"
    env_file:
      - .env.local
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/learning_platform
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    networks:
      - app-network
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres_data:
    driver: local

networks:
  app-network:
    driver: bridge
EOF
    echo -e "${GREEN}✓${NC} docker-compose.yml создан"
else
    echo -e "${GREEN}✓${NC} docker-compose.yml существует"
fi
echo ""

echo "5. Проверка Dockerfile"
echo "----------------------------------------"
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}✗${NC} Dockerfile не найден - это критично!"
    echo "   Пожалуйста, убедитесь, что Dockerfile присутствует в проекте"
    exit 1
else
    echo -e "${GREEN}✓${NC} Dockerfile найден"
fi
echo ""

echo "6. Проверка next.config.js"
echo "----------------------------------------"
if [ -f "next.config.js" ]; then
    if grep -q "output: 'standalone'" next.config.js; then
        echo -e "${GREEN}✓${NC} next.config.js настроен правильно"
    else
        echo "Исправляю next.config.js..."
        # Добавляем standalone output если его нет
        sed -i "s/const nextConfig = {/const nextConfig = {\n  output: 'standalone',/" next.config.js || true
        echo -e "${GREEN}✓${NC} next.config.js исправлен"
    fi
else
    echo -e "${YELLOW}⚠${NC} next.config.js не найден"
fi
echo ""

echo "7. Сборка и запуск Docker контейнеров"
echo "----------------------------------------"
echo "Собираю образы (это может занять несколько минут)..."
docker compose build --no-cache

echo "Запускаю контейнеры..."
docker compose up -d

echo "Ожидание запуска приложения..."
sleep 10

# Проверка статуса
if docker ps --format "{{.Names}}" | grep -q "corporate_learning_app"; then
    echo -e "${GREEN}✓${NC} Контейнер запущен"
    
    # Ждем пока приложение запустится
    echo "Ожидание готовности приложения (до 60 секунд)..."
    for i in {1..12}; do
        if docker exec corporate_learning_app curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} Приложение готово!"
            break
        fi
        if [ $i -eq 12 ]; then
            echo -e "${YELLOW}⚠${NC} Приложение еще не готово. Проверьте логи:"
            echo "   docker logs corporate_learning_app"
        else
            echo "   Попытка $i/12..."
            sleep 5
        fi
    done
else
    echo -e "${RED}✗${NC} Не удалось запустить контейнер"
    echo "   Проверьте логи: docker compose logs"
    exit 1
fi
echo ""

echo "8. Проверка работы приложения"
echo "----------------------------------------"
sleep 5

# Проверка health endpoint
if curl -f http://localhost:3044/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Приложение отвечает на http://localhost:3044/api/health"
else
    echo -e "${RED}✗${NC} Приложение не отвечает на порту 3044"
    echo "   Проверьте логи: docker logs corporate_learning_app"
fi

# Проверка главной страницы
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3044/ 2>/dev/null || echo "000")
if [ "$MAIN_STATUS" = "200" ] || [ "$MAIN_STATUS" = "302" ] || [ "$MAIN_STATUS" = "301" ]; then
    echo -e "${GREEN}✓${NC} Главная страница доступна (код: $MAIN_STATUS)"
else
    echo -e "${YELLOW}⚠${NC} Главная страница вернула код: $MAIN_STATUS"
fi
echo ""

echo "9. Показ статуса контейнеров"
echo "----------------------------------------"
docker compose ps
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Исправление завершено${NC}"
echo "=========================================="
echo ""
echo "Полезные команды:"
echo "  - Логи: docker logs -f corporate_learning_app"
echo "  - Статус: docker compose ps"
echo "  - Перезапуск: docker compose restart"
echo "  - Остановка: docker compose down"
echo ""


