#!/bin/bash

# Автоматическая настройка VPS для развертывания

set -e

echo "🚀 Настройка VPS для Corporate Learning Platform..."

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Запустите скрипт с правами root: sudo ./setup-vps.sh${NC}"
    exit 1
fi

# Обновление системы
echo -e "${YELLOW}📦 Обновление системы...${NC}"
apt update && apt upgrade -y

# Установка необходимых пакетов
echo -e "${YELLOW}📦 Установка необходимых пакетов...${NC}"
apt install -y curl wget git ufw fail2ban

# Установка Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Установка Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo -e "${GREEN}✅ Docker уже установлен${NC}"
fi

# Установка Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}🐳 Установка Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo -e "${GREEN}✅ Docker Compose уже установлен${NC}"
fi

# Настройка Firewall
echo -e "${YELLOW}🔥 Настройка Firewall...${NC}"
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Создание пользователя для приложения (если не существует)
if ! id "appuser" &>/dev/null; then
    echo -e "${YELLOW}👤 Создание пользователя appuser...${NC}"
    useradd -m -s /bin/bash appuser
    usermod -aG docker appuser
else
    echo -e "${GREEN}✅ Пользователь appuser уже существует${NC}"
fi

# Создание директорий
echo -e "${YELLOW}📁 Создание директорий...${NC}"
mkdir -p /opt/corporate-learning
chown appuser:appuser /opt/corporate-learning

echo -e "${GREEN}✅ Настройка VPS завершена!${NC}"
echo ""
echo "Следующие шаги:"
echo "1. Загрузите файлы проекта в /opt/corporate-learning/corporate-learning-platform-v2"
echo "2. Настройте .env файл"
echo "3. Запустите ./deploy.sh"

