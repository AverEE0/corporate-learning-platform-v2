#!/bin/bash

# Скрипт автоматической настройки проекта на сервере
# Использование: ./setup-server.sh

set -e  # Остановка при ошибке

echo "=========================================="
echo "Настройка Corporate Learning Platform"
echo "=========================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка Node.js
echo -e "${YELLOW}Проверка Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js не установлен! Установите Node.js 18+ и повторите попытку.${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js установлен: $NODE_VERSION${NC}"

# Проверка npm
echo -e "${YELLOW}Проверка npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm не установлен!${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ npm установлен: $NPM_VERSION${NC}"

# Проверка package.json
if [ ! -f "package.json" ]; then
    echo -e "${RED}Ошибка: package.json не найден! Убедитесь, что вы находитесь в корне проекта.${NC}"
    exit 1
fi

# Установка зависимостей
echo ""
echo -e "${YELLOW}Установка зависимостей...${NC}"
echo "Это может занять несколько минут..."
npm install
echo -e "${GREEN}✓ Зависимости установлены${NC}"

# Создание .env.local из .env.example
echo ""
echo -e "${YELLOW}Настройка переменных окружения...${NC}"
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo -e "${GREEN}✓ Файл .env.local создан из .env.example${NC}"
        echo -e "${YELLOW}⚠ ВАЖНО: Отредактируйте .env.local и укажите:${NC}"
        echo -e "   - DATABASE_URL (строка подключения к PostgreSQL)"
        echo -e "   - JWT_SECRET (случайная строка минимум 32 символа)"
    else
        echo -e "${YELLOW}⚠ .env.example не найден, создаю базовый .env.local...${NC}"
        cat > .env.local << EOF
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/database_name

# JWT Secret (минимум 32 символа)
JWT_SECRET=$(openssl rand -base64 32)

# Node Environment
NODE_ENV=production
EOF
        echo -e "${GREEN}✓ Файл .env.local создан${NC}"
        echo -e "${RED}⚠ ОБЯЗАТЕЛЬНО отредактируйте .env.local и укажите правильный DATABASE_URL!${NC}"
    fi
else
    echo -e "${YELLOW}⚠ .env.local уже существует, пропускаю создание${NC}"
fi

# Создание директорий
echo ""
echo -e "${YELLOW}Создание необходимых директорий...${NC}"
mkdir -p uploads
mkdir -p logs
echo -e "${GREEN}✓ Директории созданы${NC}"

# Проверка подключения к БД (если DATABASE_URL установлен)
if [ -f ".env.local" ]; then
    source .env.local
    if [ ! -z "$DATABASE_URL" ] && [ "$DATABASE_URL" != "postgresql://user:password@localhost:5432/database_name" ]; then
        echo ""
        echo -e "${YELLOW}Проверка подключения к базе данных...${NC}"
        # Попытка подключения (требует psql)
        if command -v psql &> /dev/null; then
            if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
                echo -e "${GREEN}✓ Подключение к БД успешно${NC}"
            else
                echo -e "${RED}⚠ Не удалось подключиться к БД. Проверьте DATABASE_URL в .env.local${NC}"
            fi
        else
            echo -e "${YELLOW}⚠ psql не установлен, пропускаю проверку БД${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ DATABASE_URL не настроен в .env.local${NC}"
    fi
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Настройка завершена!${NC}"
echo "=========================================="
echo ""
echo "Следующие шаги:"
echo ""
echo "1. Отредактируйте .env.local и укажите:"
echo "   - DATABASE_URL (строка подключения к PostgreSQL)"
echo "   - JWT_SECRET (случайная строка минимум 32 символа)"
echo ""
echo "2. Выполните миграции БД (из папки scripts/):"
echo "   psql \$DATABASE_URL < scripts/01_create_database.sql"
echo ""
echo "3. Соберите проект:"
echo "   npm run build"
echo ""
echo "4. Запустите проект:"
echo "   npm start"
echo ""
echo "   Или для разработки:"
echo "   npm run dev"
echo ""

