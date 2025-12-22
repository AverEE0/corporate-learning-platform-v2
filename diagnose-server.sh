#!/bin/bash

# Скрипт диагностики сервера для Corporate Learning Platform
# Использование: ./diagnose-server.sh

echo "=========================================="
echo "🔍 Диагностика сервера Corporate Learning Platform"
echo "=========================================="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для проверки команды
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 установлен: $(command -v $1)"
        return 0
    else
        echo -e "${RED}✗${NC} $1 не установлен"
        return 1
    fi
}

# Функция для проверки статуса
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

echo "1. Проверка установленных инструментов"
echo "----------------------------------------"
check_command docker
check_command docker-compose
check_command curl
check_command psql
echo ""

echo "2. Проверка рабочей директории"
echo "----------------------------------------"
if [ -d "/root/corporate-learning-platform-v2" ]; then
    echo -e "${GREEN}✓${NC} Директория проекта найдена"
    cd /root/corporate-learning-platform-v2
    echo "   Текущая директория: $(pwd)"
else
    echo -e "${RED}✗${NC} Директория проекта не найдена в /root/corporate-learning-platform-v2"
    echo "   Проверьте путь к проекту"
    exit 1
fi
echo ""

echo "3. Проверка Docker"
echo "----------------------------------------"
if systemctl is-active --quiet docker; then
    echo -e "${GREEN}✓${NC} Docker сервис запущен"
else
    echo -e "${RED}✗${NC} Docker сервис не запущен"
    echo "   Попробуйте: systemctl start docker"
fi
echo ""

echo "4. Проверка Docker контейнеров"
echo "----------------------------------------"
CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep -E "corporate_learning|postgres")
if [ -z "$CONTAINERS" ]; then
    echo -e "${YELLOW}⚠${NC} Контейнеры не найдены"
    echo "   Возможно, контейнеры не были созданы"
else
    echo "Найденные контейнеры:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "NAMES|corporate_learning|postgres"
    
    # Проверка статуса основного контейнера
    if docker ps --format "{{.Names}}" | grep -q "corporate_learning_app"; then
        echo -e "${GREEN}✓${NC} Контейнер corporate_learning_app запущен"
    else
        echo -e "${RED}✗${NC} Контейнер corporate_learning_app не запущен"
        echo "   Попробуйте: docker compose up -d"
    fi
fi
echo ""

echo "5. Проверка логов контейнера приложения"
echo "----------------------------------------"
if docker ps --format "{{.Names}}" | grep -q "corporate_learning_app"; then
    echo "Последние 30 строк логов:"
    echo "---"
    docker logs --tail 30 corporate_learning_app 2>&1 | tail -30
    echo "---"
    
    # Проверка на ошибки
    ERROR_COUNT=$(docker logs corporate_learning_app 2>&1 | grep -i "error\|fail\|exception" | wc -l)
    if [ $ERROR_COUNT -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC} Найдено ошибок в логах: $ERROR_COUNT"
        echo "   Показываю последние ошибки:"
        docker logs corporate_learning_app 2>&1 | grep -i "error\|fail\|exception" | tail -5
    else
        echo -e "${GREEN}✓${NC} Ошибок в логах не найдено"
    fi
else
    echo -e "${RED}✗${NC} Не могу проверить логи - контейнер не запущен"
fi
echo ""

echo "6. Проверка файлов конфигурации"
echo "----------------------------------------"
if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✓${NC} docker-compose.yml найден"
else
    echo -e "${RED}✗${NC} docker-compose.yml не найден"
fi

if [ -f "Dockerfile" ]; then
    echo -e "${GREEN}✓${NC} Dockerfile найден"
else
    echo -e "${RED}✗${NC} Dockerfile не найден"
fi

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local найден"
    echo "   Проверка переменных окружения:"
    if grep -q "DATABASE_URL" .env.local; then
        DB_URL=$(grep "DATABASE_URL" .env.local | cut -d '=' -f2-)
        echo -e "${GREEN}✓${NC} DATABASE_URL установлен: ${DB_URL:0:50}..."
    else
        echo -e "${RED}✗${NC} DATABASE_URL не найден в .env.local"
    fi
    
    if grep -q "JWT_SECRET" .env.local; then
        echo -e "${GREEN}✓${NC} JWT_SECRET установлен"
    else
        echo -e "${RED}✗${NC} JWT_SECRET не найден в .env.local"
    fi
else
    echo -e "${RED}✗${NC} .env.local не найден"
    echo "   Создайте файл .env.local с необходимыми переменными"
fi
echo ""

echo "7. Проверка подключения к приложению"
echo "----------------------------------------"
if docker ps --format "{{.Names}}" | grep -q "corporate_learning_app"; then
    # Проверка внутри контейнера
    HEALTH_CHECK=$(docker exec corporate_learning_app curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
    if [ "$HEALTH_CHECK" = "200" ]; then
        echo -e "${GREEN}✓${NC} Health endpoint отвечает (код: $HEALTH_CHECK)"
    else
        echo -e "${RED}✗${NC} Health endpoint не отвечает (код: $HEALTH_CHECK)"
    fi
    
    # Проверка с хоста
    HOST_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3044/api/health 2>/dev/null || echo "000")
    if [ "$HOST_CHECK" = "200" ]; then
        echo -e "${GREEN}✓${NC} Приложение доступно на порту 3044 (код: $HOST_CHECK)"
    else
        echo -e "${RED}✗${NC} Приложение недоступно на порту 3044 (код: $HOST_CHECK)"
    fi
else
    echo -e "${RED}✗${NC} Не могу проверить - контейнер не запущен"
fi
echo ""

echo "8. Проверка базы данных"
echo "----------------------------------------"
# Проверка PostgreSQL контейнера
if docker ps --format "{{.Names}}" | grep -q "corporate_learning_db\|postgres"; then
    echo -e "${GREEN}✓${NC} PostgreSQL контейнер запущен"
    
    # Попытка подключения
    DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "corporate_learning_db|postgres" | head -1)
    if [ ! -z "$DB_CONTAINER" ]; then
        DB_TEST=$(docker exec $DB_CONTAINER pg_isready -U postgres 2>&1)
        if echo "$DB_TEST" | grep -q "accepting connections"; then
            echo -e "${GREEN}✓${NC} PostgreSQL готов к подключениям"
        else
            echo -e "${RED}✗${NC} PostgreSQL не готов: $DB_TEST"
        fi
    fi
else
    echo -e "${YELLOW}⚠${NC} PostgreSQL контейнер не найден"
    echo "   Проверьте, используется ли внешняя БД"
fi

# Проверка подключения из приложения
if [ -f ".env.local" ] && grep -q "DATABASE_URL" .env.local; then
    DB_URL=$(grep "DATABASE_URL" .env.local | cut -d '=' -f2-)
    echo "   Попытка подключения к БД из контейнера приложения..."
    
    if docker ps --format "{{.Names}}" | grep -q "corporate_learning_app"; then
        # Извлекаем параметры из DATABASE_URL
        if echo "$DB_URL" | grep -q "@"; then
            DB_TEST_CMD="node -e \"const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 }); pool.query('SELECT 1').then(() => { console.log('OK'); process.exit(0); }).catch(e => { console.log('ERROR:', e.message); process.exit(1); });\""
            DB_TEST_RESULT=$(docker exec -e DATABASE_URL="$DB_URL" corporate_learning_app sh -c "$DB_TEST_CMD" 2>&1)
            if echo "$DB_TEST_RESULT" | grep -q "OK"; then
                echo -e "${GREEN}✓${NC} Подключение к БД успешно"
            else
                echo -e "${RED}✗${NC} Ошибка подключения к БД: $DB_TEST_RESULT"
            fi
        fi
    fi
fi
echo ""

echo "9. Проверка портов"
echo "----------------------------------------"
if netstat -tuln 2>/dev/null | grep -q ":3044"; then
    echo -e "${GREEN}✓${NC} Порт 3044 открыт"
    netstat -tuln | grep ":3044"
else
    echo -e "${YELLOW}⚠${NC} Порт 3044 не найден в netstat"
    # Альтернативная проверка через ss
    if command -v ss &> /dev/null; then
        if ss -tuln | grep -q ":3044"; then
            echo -e "${GREEN}✓${NC} Порт 3044 открыт (через ss)"
        else
            echo -e "${RED}✗${NC} Порт 3044 не слушается"
        fi
    fi
fi
echo ""

echo "10. Проверка файлов и директорий"
echo "----------------------------------------"
if [ -d "uploads" ]; then
    echo -e "${GREEN}✓${NC} Директория uploads существует"
    if [ -w "uploads" ]; then
        echo -e "${GREEN}✓${NC} Директория uploads доступна для записи"
    else
        echo -e "${YELLOW}⚠${NC} Директория uploads недоступна для записи"
        echo "   Попробуйте: chmod 755 uploads"
    fi
else
    echo -e "${YELLOW}⚠${NC} Директория uploads не существует"
    echo "   Создайте: mkdir -p uploads"
fi

if [ -d "logs" ]; then
    echo -e "${GREEN}✓${NC} Директория logs существует"
else
    echo -e "${YELLOW}⚠${NC} Директория logs не существует"
    echo "   Создайте: mkdir -p logs"
fi

if [ -d ".next" ]; then
    echo -e "${GREEN}✓${NC} Директория .next существует (приложение собрано)"
else
    echo -e "${YELLOW}⚠${NC} Директория .next не существует"
    echo "   Приложение не собрано. Запустите: npm run build"
fi
echo ""

echo "11. Рекомендации по исправлению"
echo "----------------------------------------"
echo ""

# Сбор проблем
ISSUES=0

if ! docker ps --format "{{.Names}}" | grep -q "corporate_learning_app"; then
    echo "🔧 ПРОБЛЕМА: Контейнер приложения не запущен"
    echo "   РЕШЕНИЕ:"
    echo "   cd /root/corporate-learning-platform-v2"
    echo "   docker compose up -d"
    echo ""
    ISSUES=$((ISSUES + 1))
fi

if [ ! -f ".env.local" ]; then
    echo "🔧 ПРОБЛЕМА: Файл .env.local отсутствует"
    echo "   РЕШЕНИЕ:"
    echo "   Создайте .env.local с содержимым:"
    echo "   DATABASE_URL=postgresql://postgres:password@localhost:5432/learning_platform"
    echo "   JWT_SECRET=tfj6T/jJ5dgTqoKfZmw1hTqJYSIXO/jI1g2RRlF87bE="
    echo "   NODE_ENV=production"
    echo "   PORT=3000"
    echo ""
    ISSUES=$((ISSUES + 1))
fi

if docker ps --format "{{.Names}}" | grep -q "corporate_learning_app"; then
    HEALTH_CHECK=$(docker exec corporate_learning_app curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
    if [ "$HEALTH_CHECK" != "200" ]; then
        echo "🔧 ПРОБЛЕМА: Приложение не отвечает на health check"
        echo "   РЕШЕНИЕ:"
        echo "   1. Проверьте логи: docker logs corporate_learning_app"
        echo "   2. Пересоберите контейнер: docker compose down && docker compose build --no-cache && docker compose up -d"
        echo ""
        ISSUES=$((ISSUES + 1))
    fi
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Все основные проверки пройдены успешно!"
    echo ""
    echo "Если проблема сохраняется, проверьте:"
    echo "  - Логи: docker logs -f corporate_learning_app"
    echo "  - Nginx конфигурацию (если используется)"
    echo "  - Firewall правила (порт 3044 должен быть открыт)"
fi

echo ""
echo "=========================================="
echo "✅ Диагностика завершена"
echo "=========================================="


