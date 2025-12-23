#!/bin/bash

# Скрипт для диагностики проблем на сервере
# Запустите на сервере: bash server-diagnose.sh

set -e

echo "========================================"
echo "DIAGNOSTIC SCRIPT FOR SERVER"
echo "========================================"
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Проверка текущей директории
echo -e "${YELLOW}1. Checking current directory...${NC}"
cd /root/corporate-learning-platform-v2 2>/dev/null || {
    echo -e "${RED}Error: Directory /root/corporate-learning-platform-v2 not found${NC}"
    exit 1
}
echo -e "${GREEN}Current directory: $(pwd)${NC}"
echo ""

# 2. Проверка git статуса
echo -e "${YELLOW}2. Checking git status...${NC}"
echo "Current branch:"
git branch --show-current || echo "Not a git repository"
echo ""
echo "Last 5 commits:"
git log --oneline -5 || echo "No commits found"
echo ""
echo "Git status:"
git status --short || echo "Git status check failed"
echo ""

# 3. Проверка последнего коммита
echo -e "${YELLOW}3. Checking last commit...${NC}"
LAST_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
LAST_MESSAGE=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "unknown")
echo "Last commit: $LAST_COMMIT"
echo "Message: $LAST_MESSAGE"
echo ""

# 4. Проверка Docker контейнеров
echo -e "${YELLOW}4. Checking Docker containers...${NC}"
echo "Container status:"
docker compose ps 2>/dev/null || docker-compose ps 2>/dev/null || echo "Docker compose not available"
echo ""

# 5. Проверка логов контейнера
echo -e "${YELLOW}5. Checking container logs (last 30 lines)...${NC}"
docker compose logs --tail=30 app 2>/dev/null || docker-compose logs --tail=30 app 2>/dev/null || echo "Cannot read logs"
echo ""

# 6. Проверка кеша Next.js
echo -e "${YELLOW}6. Checking Next.js cache...${NC}"
if [ -d ".next" ]; then
    echo -e "${RED}.next directory EXISTS (cache present)${NC}"
    echo "Size: $(du -sh .next 2>/dev/null | cut -f1)"
    echo "Build ID:"
    cat .next/BUILD_ID 2>/dev/null || echo "No BUILD_ID found"
else
    echo -e "${GREEN}.next directory NOT FOUND (cache cleared)${NC}"
fi
echo ""

# 7. Проверка версии кода в контейнере
echo -e "${YELLOW}7. Checking code version in container...${NC}"
CONTAINER_COMMIT=$(docker compose exec -T app git rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "Commit in container: $CONTAINER_COMMIT"
echo "Commit on server: $LAST_COMMIT"
if [ "$CONTAINER_COMMIT" = "$LAST_COMMIT" ]; then
    echo -e "${GREEN}Commits MATCH - container has latest code${NC}"
else
    echo -e "${RED}Commits DO NOT MATCH - container has OLD code!${NC}"
fi
echo ""

# 8. Проверка процесса Next.js
echo -e "${YELLOW}8. Checking Next.js process in container...${NC}"
docker compose exec -T app ps aux | grep -i next || echo "No Next.js process found"
echo ""

# 9. Проверка доступности приложения
echo -e "${YELLOW}9. Checking application health...${NC}"
if curl -f http://localhost:3044/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}Application is responding on port 3044${NC}"
else
    echo -e "${RED}Application is NOT responding on port 3044${NC}"
fi
echo ""

# 10. Проверка файлов в контейнере
echo -e "${YELLOW}10. Checking .next directory in container...${NC}"
if docker compose exec -T app test -d .next 2>/dev/null; then
    echo -e "${RED}.next directory EXISTS in container${NC}"
    CONTAINER_BUILD_ID=$(docker compose exec -T app cat .next/BUILD_ID 2>/dev/null || echo "unknown")
    echo "Build ID in container: $CONTAINER_BUILD_ID"
else
    echo -e "${GREEN}.next directory NOT FOUND in container${NC}"
fi
echo ""

# 11. Рекомендации
echo "========================================"
echo -e "${YELLOW}RECOMMENDATIONS:${NC}"
echo "========================================"
echo ""

if [ "$CONTAINER_COMMIT" != "$LAST_COMMIT" ]; then
    echo -e "${RED}ACTION REQUIRED: Container has old code!${NC}"
    echo "Run these commands to fix:"
    echo ""
    echo "  cd /root/corporate-learning-platform-v2"
    echo "  git pull origin main"
    echo "  rm -rf .next node_modules/.cache"
    echo "  docker compose down app"
    echo "  docker compose build --no-cache app"
    echo "  docker compose up -d --force-recreate app"
    echo "  docker compose restart app"
    echo ""
elif [ -d ".next" ]; then
    echo -e "${YELLOW}ACTION RECOMMENDED: Clear cache${NC}"
    echo "Run these commands:"
    echo ""
    echo "  cd /root/corporate-learning-platform-v2"
    echo "  rm -rf .next node_modules/.cache"
    echo "  docker compose restart app"
    echo ""
else
    echo -e "${GREEN}Everything looks good!${NC}"
    echo "If changes are still not visible, try:"
    echo "  - Clear browser cache (Ctrl+Shift+Delete)"
    echo "  - Open site in incognito mode (Ctrl+Shift+N)"
    echo ""
fi

echo "========================================"

