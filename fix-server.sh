#!/bin/bash

# Скрипт для автоматического исправления проблем на сервере
# Запустите на сервере: bash fix-server.sh

set -e

echo "========================================"
echo "AUTOMATIC SERVER FIX SCRIPT"
echo "========================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Переходим в директорию проекта
echo -e "${YELLOW}1. Changing to project directory...${NC}"
cd /root/corporate-learning-platform-v2
echo -e "${GREEN}Current directory: $(pwd)${NC}"
echo ""

# Получаем последний код
echo -e "${YELLOW}2. Pulling latest code from GitHub...${NC}"
git pull origin main
echo ""

# Показываем текущий коммит
CURRENT_COMMIT=$(git rev-parse --short HEAD)
echo -e "${GREEN}Current commit: $CURRENT_COMMIT${NC}"
echo ""

# Очищаем весь кеш
echo -e "${YELLOW}3. Clearing all caches...${NC}"
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name ".swc" -exec rm -rf {} + 2>/dev/null || true
echo -e "${GREEN}Cache cleared${NC}"
echo ""

# Останавливаем контейнер
echo -e "${YELLOW}4. Stopping container...${NC}"
docker compose down app 2>/dev/null || true
docker compose stop app 2>/dev/null || true
docker compose rm -f app 2>/dev/null || true
docker kill corporate_learning_app 2>/dev/null || true
docker rm -f corporate_learning_app 2>/dev/null || true
sleep 2
echo -e "${GREEN}Container stopped${NC}"
echo ""

# Пересобираем контейнер
echo -e "${YELLOW}5. Rebuilding container (this will take 5-8 minutes)...${NC}"
docker compose build --no-cache app
echo -e "${GREEN}Container rebuilt${NC}"
echo ""

# Запускаем контейнер
echo -e "${YELLOW}6. Starting container...${NC}"
docker compose up -d --force-recreate app
sleep 5
echo -e "${GREEN}Container started${NC}"
echo ""

# Очищаем кеш внутри контейнера
echo -e "${YELLOW}7. Clearing cache inside container...${NC}"
docker compose exec -T app sh -c "rm -rf .next node_modules/.cache 2>/dev/null || true" 2>/dev/null || true
echo -e "${GREEN}Cache cleared inside container${NC}"
echo ""

# Перезапускаем контейнер
echo -e "${YELLOW}8. Restarting container...${NC}"
docker compose restart app
sleep 5
echo -e "${GREEN}Container restarted${NC}"
echo ""

# Проверяем статус
echo -e "${YELLOW}9. Checking status...${NC}"
docker compose ps
echo ""

# Проверяем версию кода в контейнере
echo -e "${YELLOW}10. Verifying code version...${NC}"
CONTAINER_COMMIT=$(docker compose exec -T app git rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "Commit on server: $CURRENT_COMMIT"
echo "Commit in container: $CONTAINER_COMMIT"
if [ "$CONTAINER_COMMIT" = "$CURRENT_COMMIT" ]; then
    echo -e "${GREEN}SUCCESS: Commits match - new code is loaded!${NC}"
else
    echo -e "${RED}WARNING: Commits do not match${NC}"
fi
echo ""

# Проверяем здоровье приложения
echo -e "${YELLOW}11. Checking application health...${NC}"
sleep 3
if curl -f http://localhost:3044/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}SUCCESS: Application is responding${NC}"
else
    echo -e "${YELLOW}WARNING: Application is not responding yet (may still be starting)${NC}"
fi
echo ""

echo "========================================"
echo -e "${GREEN}FIX COMPLETED!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Open site in incognito mode (Ctrl+Shift+N)"
echo "3. Check if new icon (ListChecks) appears in sidebar"
echo ""

