#!/bin/bash

set -e

echo "🚀 Начинаем развертывание Corporate Learning Platform..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo -e "${RED}❌ Файл .env не найден!${NC}"
    echo "Создайте файл .env на основе .env.example"
    exit 1
fi

# Проверка переменных окружения
echo -e "${YELLOW}📋 Проверка переменных окружения...${NC}"
source .env

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL не установлен в .env${NC}"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}❌ JWT_SECRET не установлен в .env${NC}"
    exit 1
fi

# Создание необходимых директорий
echo -e "${YELLOW}📁 Создание директорий...${NC}"
mkdir -p uploads logs ssl

# Установка прав
chmod 755 uploads
chmod 755 logs

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker не установлен!${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose не установлен!${NC}"
    exit 1
fi

# Остановка существующих контейнеров
echo -e "${YELLOW}🛑 Остановка существующих контейнеров...${NC}"
docker-compose down || true

# Сборка образов
echo -e "${YELLOW}🔨 Сборка Docker образов...${NC}"
docker-compose build --no-cache

# Запуск контейнеров
echo -e "${YELLOW}🚀 Запуск контейнеров...${NC}"
docker-compose up -d

# Ожидание готовности приложения
echo -e "${YELLOW}⏳ Ожидание готовности приложения...${NC}"
sleep 10

# Проверка здоровья
for i in {1..30}; do
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Приложение запущено и готово!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Приложение не отвечает после 30 попыток${NC}"
        docker-compose logs app
        exit 1
    fi
    sleep 2
done

# Инициализация базы данных
echo -e "${YELLOW}🗄️  Инициализация базы данных...${NC}"
docker-compose exec -T app node -e "
const { neon } = require('@neondatabase/serverless');
const { readFileSync } = require('fs');
const sql = neon(process.env.DATABASE_URL);
const schema = readFileSync('./scripts/01_create_database.sql', 'utf8');
sql(schema).then(() => {
  console.log('База данных инициализирована');
  process.exit(0);
}).catch(err => {
  console.error('Ошибка инициализации БД:', err);
  process.exit(1);
});
" || echo -e "${YELLOW}⚠️  База данных может быть уже инициализирована${NC}"

echo -e "${GREEN}✅ Развертывание завершено успешно!${NC}"
echo ""
echo "Приложение доступно по адресу: http://$(hostname -I | awk '{print $1}')"
echo "Или: http://localhost"
echo ""
echo "Полезные команды:"
echo "  docker-compose logs -f app    # Просмотр логов"
echo "  docker-compose restart app    # Перезапуск приложения"
echo "  docker-compose down           # Остановка всех контейнеров"

