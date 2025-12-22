#!/bin/bash

# Главный скрипт для автоматической настройки и запуска проекта на сервере
# Использование: chmod +x setup-and-run.sh && ./setup-and-run.sh

set -e

echo "=========================================="
echo "🚀 Автоматическая настройка и запуск Corporate Learning Platform"
echo "=========================================="
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Переход в директорию проекта
PROJECT_DIR="/root/corporate-learning-platform-v2"
cd "$PROJECT_DIR" 2>/dev/null || {
    echo -e "${RED}✗${NC} Директория $PROJECT_DIR не найдена!"
    echo "Создайте директорию или укажите правильный путь"
    exit 1
}

echo -e "${GREEN}✓${NC} Рабочая директория: $(pwd)"
echo ""

# Функция проверки команды
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 установлен"
        return 0
    else
        echo -e "${RED}✗${NC} $1 не установлен"
        return 1
    fi
}

# Функция выполнения команды с выводом
run_cmd() {
    echo -e "${BLUE}→${NC} $1"
    eval $1
}

echo "Шаг 1: Проверка зависимостей"
echo "----------------------------------------"
check_command docker || {
    echo "Установите Docker: curl -fsSL https://get.docker.com | sh"
    exit 1
}

check_command docker-compose || {
    echo "Установите docker-compose или используйте: docker compose"
    # Проверяем новую версию docker compose
    if docker compose version &> /dev/null; then
        echo -e "${GREEN}✓${NC} docker compose (v2) доступен"
    else
        exit 1
    fi
}
echo ""

echo "Шаг 2: Создание .env.local"
echo "----------------------------------------"
if [ ! -f ".env.local" ]; then
    echo "Создаю .env.local..."
    cat > .env.local << 'EOF'
DATABASE_URL=postgresql://postgres:password@postgres:5432/learning_platform
JWT_SECRET=tfj6T/jJ5dgTqoKfZmw1hTqJYSIXO/jI1g2RRlF87bE=
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_APP_URL=http://212.113.123.94:3044
EOF
    echo -e "${GREEN}✓${NC} .env.local создан"
else
    echo -e "${GREEN}✓${NC} .env.local уже существует"
    # Проверяем и дополняем если нужно
    if ! grep -q "DATABASE_URL" .env.local; then
        echo "DATABASE_URL=postgresql://postgres:password@postgres:5432/learning_platform" >> .env.local
    fi
    if ! grep -q "JWT_SECRET" .env.local; then
        echo "JWT_SECRET=tfj6T/jJ5dgTqoKfZmw1hTqJYSIXO/jI1g2RRlF87bE=" >> .env.local
    fi
    if ! grep -q "HOSTNAME" .env.local; then
        echo "HOSTNAME=0.0.0.0" >> .env.local
    fi
fi
echo ""

echo "Шаг 3: Проверка next.config.js"
echo "----------------------------------------"
if [ -f "next.config.js" ]; then
    if ! grep -q "output: 'standalone'" next.config.js; then
        echo "Добавляю output: 'standalone' в next.config.js..."
        sed -i "s/const nextConfig = {/const nextConfig = {\n  output: 'standalone',/" next.config.js
    fi
    echo -e "${GREEN}✓${NC} next.config.js настроен правильно"
elif [ -f "next.config.mjs" ]; then
    echo -e "${YELLOW}⚠${NC} Используется next.config.mjs, убедитесь что там есть output: 'standalone'"
else
    echo -e "${YELLOW}⚠${NC} Файл конфигурации Next.js не найден"
fi
echo ""

echo "Шаг 4: Создание необходимых директорий"
echo "----------------------------------------"
mkdir -p uploads logs
chmod 755 uploads logs
echo -e "${GREEN}✓${NC} Директории созданы"
echo ""

echo "Шаг 5: Остановка старых процессов"
echo "----------------------------------------"
# Останавливаем PM2 если используется
if command -v pm2 &> /dev/null; then
    pm2 stop learning-platform 2>/dev/null || true
    pm2 delete learning-platform 2>/dev/null || true
    echo -e "${GREEN}✓${NC} PM2 процессы остановлены"
fi

# Останавливаем старые Docker контейнеры
run_cmd "docker compose down 2>/dev/null || true"
echo -e "${GREEN}✓${NC} Старые контейнеры остановлены"
echo ""

echo "Шаг 6: Проверка docker-compose.yml"
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

echo "Шаг 7: Сборка Docker образов"
echo "----------------------------------------"
echo -e "${YELLOW}⏳${NC} Это может занять несколько минут..."
run_cmd "docker compose build --no-cache"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Образы успешно собраны"
else
    echo -e "${RED}✗${NC} Ошибка при сборке образов"
    echo "Проверьте логи выше"
    exit 1
fi
echo ""

echo "Шаг 8: Запуск контейнеров"
echo "----------------------------------------"
run_cmd "docker compose up -d"

sleep 5

# Проверка статуса
if docker ps --format "{{.Names}}" | grep -q "corporate_learning_app"; then
    echo -e "${GREEN}✓${NC} Контейнеры запущены"
else
    echo -e "${RED}✗${NC} Контейнеры не запустились"
    echo "Проверьте логи: docker compose logs"
    exit 1
fi
echo ""

echo "Шаг 9: Ожидание готовности приложения"
echo "----------------------------------------"
echo -e "${YELLOW}⏳${NC} Жду пока приложение запустится (до 60 секунд)..."
for i in {1..12}; do
    if docker exec corporate_learning_app curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Приложение готово! (попытка $i/12)"
        break
    fi
    if [ $i -eq 12 ]; then
        echo -e "${YELLOW}⚠${NC} Приложение еще не готово после 60 секунд"
        echo "Проверьте логи: docker logs corporate_learning_app"
    else
        echo "   Попытка $i/12..."
        sleep 5
    fi
done
echo ""

echo "Шаг 10: Проверка работы приложения"
echo "----------------------------------------"
sleep 3

# Проверка health endpoint
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3044/api/health 2>/dev/null || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} Health endpoint работает (http://localhost:3044/api/health)"
else
    echo -e "${YELLOW}⚠${NC} Health endpoint вернул код: $HEALTH_STATUS"
fi

# Проверка главной страницы
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3044/ 2>/dev/null || echo "000")
if [ "$MAIN_STATUS" = "200" ] || [ "$MAIN_STATUS" = "302" ] || [ "$MAIN_STATUS" = "301" ]; then
    echo -e "${GREEN}✓${NC} Главная страница доступна (код: $MAIN_STATUS)"
else
    echo -e "${YELLOW}⚠${NC} Главная страница вернула код: $MAIN_STATUS"
fi
echo ""

echo "Шаг 11: Проверка базы данных"
echo "----------------------------------------"
if docker ps --format "{{.Names}}" | grep -q "corporate_learning_db"; then
    DB_READY=$(docker exec corporate_learning_db pg_isready -U postgres 2>&1)
    if echo "$DB_READY" | grep -q "accepting connections"; then
        echo -e "${GREEN}✓${NC} База данных готова"
        
        # Проверка существования базы
        DB_EXISTS=$(docker exec corporate_learning_db psql -U postgres -lqt | cut -d \| -f 1 | grep -w learning_platform | wc -l)
        if [ "$DB_EXISTS" -eq 0 ]; then
            echo -e "${YELLOW}⚠${NC} База данных learning_platform не существует"
            echo "Создаю базу данных..."
            docker exec corporate_learning_db psql -U postgres -c "CREATE DATABASE learning_platform;" 2>/dev/null || true
            echo -e "${GREEN}✓${NC} База данных создана"
            
            # Выполняем миграции если есть
            if [ -d "scripts" ] && [ "$(ls -A scripts/*.sql 2>/dev/null)" ]; then
                echo "Выполняю миграции..."
                for sql_file in scripts/*.sql; do
                    echo "  - $(basename $sql_file)"
                    docker exec -i corporate_learning_db psql -U postgres -d learning_platform < "$sql_file" 2>/dev/null || true
                done
                echo -e "${GREEN}✓${NC} Миграции выполнены"
            fi
        else
            echo -e "${GREEN}✓${NC} База данных learning_platform существует"
        fi
    else
        echo -e "${RED}✗${NC} База данных не готова: $DB_READY"
    fi
else
    echo -e "${YELLOW}⚠${NC} Контейнер базы данных не найден"
fi
echo ""

echo "Шаг 12: Итоговый статус"
echo "----------------------------------------"
echo ""
echo "Статус контейнеров:"
docker compose ps
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Настройка завершена!${NC}"
echo "=========================================="
echo ""
echo "Приложение доступно по адресам:"
echo "  - http://localhost:3044 (на сервере)"
echo "  - http://212.113.123.94:3044 (внешний доступ)"
echo ""
echo "Полезные команды:"
echo "  - Логи приложения: docker logs -f corporate_learning_app"
echo "  - Логи БД: docker logs -f corporate_learning_db"
echo "  - Статус: docker compose ps"
echo "  - Перезапуск: docker compose restart"
echo "  - Остановка: docker compose down"
echo ""
echo "Если что-то не работает, запустите диагностику:"
echo "  ./diagnose-server.sh"
echo ""


