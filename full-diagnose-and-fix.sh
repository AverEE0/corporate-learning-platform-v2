#!/bin/bash

# Полный скрипт диагностики и исправления всех проблем
# Автоматически исправляет найденные проблемы

set -e

echo "=========================================="
echo "🔍 ПОЛНАЯ ДИАГНОСТИКА И ИСПРАВЛЕНИЕ"
echo "=========================================="
echo ""

PROJECT_DIR="/root/corporate-learning-platform-v2"
cd "$PROJECT_DIR" 2>/dev/null || {
    echo "❌ Директория $PROJECT_DIR не найдена!"
    exit 1
}

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS_FOUND=0
FIXES_APPLIED=0

# Функция логирования
log_error() {
    echo -e "${RED}✗${NC} $1"
    ERRORS_FOUND=$((ERRORS_FOUND + 1))
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_info() {
    echo -e "${BLUE}→${NC} $1"
}

log_fix() {
    echo -e "${GREEN}🔧${NC} Исправление: $1"
    FIXES_APPLIED=$((FIXES_APPLIED + 1))
}

echo "1. ПРОВЕРКА СИСТЕМЫ"
echo "=========================================="

# Проверка Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker не установлен"
    echo "Установка Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
    log_fix "Docker установлен и запущен"
else
    log_success "Docker установлен: $(docker --version)"
fi

# Проверка docker-compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "docker-compose не установлен"
else
    log_success "docker-compose доступен"
fi

# Проверка сервиса Docker
if ! systemctl is-active --quiet docker; then
    log_error "Docker сервис не запущен"
    systemctl start docker
    log_fix "Docker сервис запущен"
else
    log_success "Docker сервис запущен"
fi

echo ""
echo "2. ПРОВЕРКА ПРОЕКТА"
echo "=========================================="

# Проверка директории
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Директория проекта не найдена"
    exit 1
fi
log_success "Директория проекта найдена"

cd "$PROJECT_DIR"

# Проверка файлов
if [ ! -f "package.json" ]; then
    log_error "package.json не найден"
    exit 1
fi
log_success "package.json найден"

if [ ! -f "Dockerfile" ]; then
    log_error "Dockerfile не найден"
    exit 1
fi
log_success "Dockerfile найден"

if [ ! -f "docker-compose.yml" ]; then
    log_error "docker-compose.yml не найден - создаю..."
    cat > docker-compose.yml << 'EOF'
version: '3.8'

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
    log_fix "docker-compose.yml создан"
else
    log_success "docker-compose.yml найден"
fi

echo ""
echo "3. ПРОВЕРКА КОНФИГУРАЦИИ"
echo "=========================================="

# Проверка .env.local
if [ ! -f ".env.local" ]; then
    log_error ".env.local не найден - создаю..."
    cat > .env.local << 'EOF'
DATABASE_URL=postgresql://postgres:password@postgres:5432/learning_platform
JWT_SECRET=tfj6T/jJ5dgTqoKfZmw1hTqJYSIXO/jI1g2RRlF87bE=
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_APP_URL=http://212.113.123.94:3044
EOF
    log_fix ".env.local создан"
else
    log_success ".env.local найден"
    # Проверяем содержимое
    if ! grep -q "DATABASE_URL" .env.local; then
        log_warning "DATABASE_URL отсутствует в .env.local - добавляю..."
        echo "DATABASE_URL=postgresql://postgres:password@postgres:5432/learning_platform" >> .env.local
        log_fix "DATABASE_URL добавлен"
    fi
    if ! grep -q "JWT_SECRET" .env.local; then
        log_warning "JWT_SECRET отсутствует в .env.local - добавляю..."
        echo "JWT_SECRET=tfj6T/jJ5dgTqoKfZmw1hTqJYSIXO/jI1g2RRlF87bE=" >> .env.local
        log_fix "JWT_SECRET добавлен"
    fi
    if ! grep -q "HOSTNAME" .env.local; then
        echo "HOSTNAME=0.0.0.0" >> .env.local
        log_fix "HOSTNAME добавлен"
    fi
fi

# Проверка next.config.js
if [ -f "next.config.js" ]; then
    if ! grep -q "output: 'standalone'" next.config.js; then
        log_error "next.config.js не содержит output: 'standalone' - исправляю..."
        sed -i "s/const nextConfig = {/const nextConfig = {\n  output: 'standalone',/" next.config.js
        log_fix "next.config.js исправлен"
    else
        log_success "next.config.js настроен правильно"
    fi
elif [ -f "next.config.mjs" ]; then
    log_warning "Используется next.config.mjs"
    if ! grep -q "output: 'standalone'" next.config.mjs; then
        log_error "next.config.mjs не содержит output: 'standalone' - исправляю..."
        sed -i "s/output:.*/output: 'standalone',/" next.config.mjs || \
        sed -i "/const nextConfig = {/a\\  output: 'standalone'," next.config.mjs
        log_fix "next.config.mjs исправлен"
    fi
fi

echo ""
echo "4. ПРОВЕРКА ДИРЕКТОРИЙ"
echo "=========================================="

# Создание необходимых директорий
mkdir -p uploads logs
chmod 755 uploads logs
log_success "Директории uploads и logs созданы"

echo ""
echo "5. ОСТАНОВКА СТАРЫХ КОНТЕЙНЕРОВ"
echo "=========================================="

# Остановка PM2 если используется
if command -v pm2 &> /dev/null; then
    pm2 stop learning-platform 2>/dev/null || true
    pm2 delete learning-platform 2>/dev/null || true
    log_info "PM2 процессы остановлены"
fi

# Остановка старых контейнеров
log_info "Остановка старых Docker контейнеров..."
docker compose down 2>/dev/null || true
docker stop corporate_learning_app corporate_learning_db 2>/dev/null || true
docker rm corporate_learning_app corporate_learning_db 2>/dev/null || true
log_success "Старые контейнеры остановлены"

echo ""
echo "6. СБОРКА И ЗАПУСК КОНТЕЙНЕРОВ"
echo "=========================================="

log_info "Сборка Docker образов (это может занять несколько минут)..."
if docker compose build --no-cache 2>&1 | tee /tmp/docker-build.log; then
    log_success "Образы успешно собраны"
else
    log_error "Ошибка при сборке образов"
    echo "Последние строки логов сборки:"
    tail -20 /tmp/docker-build.log
    exit 1
fi

log_info "Запуск контейнеров..."
docker compose up -d

sleep 10

# Проверка запуска
if docker ps --format "{{.Names}}" | grep -q "corporate_learning_app"; then
    log_success "Контейнеры запущены"
else
    log_error "Контейнеры не запустились"
    docker compose logs --tail=50
    exit 1
fi

echo ""
echo "7. ПРОВЕРКА РАБОТОСПОСОБНОСТИ"
echo "=========================================="

# Ожидание готовности
log_info "Ожидание готовности приложения (до 90 секунд)..."
for i in {1..18}; do
    if docker exec corporate_learning_app curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        log_success "Приложение готово! (попытка $i/18)"
        break
    fi
    if [ $i -eq 18 ]; then
        log_error "Приложение не готово после 90 секунд"
        log_info "Логи приложения:"
        docker logs corporate_learning_app --tail=30
    else
        echo "   Попытка $i/18..."
        sleep 5
    fi
done

# Проверка health endpoint
sleep 3
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3044/api/health 2>/dev/null || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
    log_success "Health endpoint работает (http://localhost:3044/api/health)"
else
    log_error "Health endpoint вернул код: $HEALTH_STATUS"
    log_info "Проверяю логи..."
    docker logs corporate_learning_app --tail=30
fi

# Проверка главной страницы
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3044/ 2>/dev/null || echo "000")
if [ "$MAIN_STATUS" = "200" ] || [ "$MAIN_STATUS" = "302" ] || [ "$MAIN_STATUS" = "301" ]; then
    log_success "Главная страница доступна (код: $MAIN_STATUS)"
else
    log_warning "Главная страница вернула код: $MAIN_STATUS"
fi

echo ""
echo "8. ПРОВЕРКА БАЗЫ ДАННЫХ"
echo "=========================================="

if docker ps --format "{{.Names}}" | grep -q "corporate_learning_db"; then
    DB_READY=$(docker exec corporate_learning_db pg_isready -U postgres 2>&1)
    if echo "$DB_READY" | grep -q "accepting connections"; then
        log_success "PostgreSQL готов к подключениям"
        
        # Проверка существования базы
        DB_EXISTS=$(docker exec corporate_learning_db psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -w learning_platform | wc -l)
        if [ "$DB_EXISTS" -eq 0 ]; then
            log_warning "База данных learning_platform не существует - создаю..."
            docker exec corporate_learning_db psql -U postgres -c "CREATE DATABASE learning_platform;" 2>/dev/null || true
            log_fix "База данных создана"
        else
            log_success "База данных learning_platform существует"
        fi
        
        # Выполнение миграций
        if [ -d "scripts" ] && [ "$(ls -A scripts/*.sql 2>/dev/null)" ]; then
            log_info "Проверка миграций..."
            for sql_file in scripts/*.sql; do
                if [ -f "$sql_file" ]; then
                    log_info "Выполнение: $(basename $sql_file)"
                    docker exec -i corporate_learning_db psql -U postgres -d learning_platform < "$sql_file" 2>&1 | grep -v "already exists" || true
                fi
            done
            log_success "Миграции проверены"
        fi
    else
        log_error "PostgreSQL не готов: $DB_READY"
    fi
else
    log_warning "Контейнер базы данных не найден"
fi

echo ""
echo "9. ИТОГОВЫЙ СТАТУС"
echo "=========================================="
echo ""
docker compose ps
echo ""

echo "=========================================="
echo "📊 РЕЗУЛЬТАТЫ ДИАГНОСТИКИ"
echo "=========================================="
echo ""
echo "Найдено проблем: $ERRORS_FOUND"
echo "Применено исправлений: $FIXES_APPLIED"
echo ""

if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ ПРИЛОЖЕНИЕ РАБОТАЕТ!${NC}"
    echo ""
    echo "Доступно по адресам:"
    echo "  - http://localhost:3044 (на сервере)"
    echo "  - http://212.113.123.94:3044 (внешний доступ)"
else
    echo -e "${YELLOW}⚠️  ПРИЛОЖЕНИЕ ТРЕБУЕТ ДОПОЛНИТЕЛЬНОЙ ПРОВЕРКИ${NC}"
    echo ""
    echo "Проверьте логи:"
    echo "  docker logs -f corporate_learning_app"
fi

echo ""
echo "Полезные команды:"
echo "  docker logs -f corporate_learning_app    # Логи приложения"
echo "  docker logs -f corporate_learning_db     # Логи базы данных"
echo "  docker compose ps                        # Статус контейнеров"
echo "  docker compose restart                   # Перезапуск"
echo ""


