#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Автоматическая настройка сервера"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Проверка и установка Git
echo "📦 Проверка Git..."
if ! command -v git > /dev/null 2>&1; then
    echo "   ⚠️ Git не установлен, устанавливаем..."
    apt-get update -qq
    apt-get install -y git > /dev/null 2>&1
    echo "   ✅ Git установлен"
else
    echo "   ✅ Git уже установлен: $(git --version)"
fi

# 2. Настройка Git config
echo ""
echo "⚙️ Настройка Git config..."
git config --global user.name "Deploy Bot" 2>/dev/null || true
git config --global user.email "deploy@corporate-learning-platform" 2>/dev/null || true
echo "   ✅ Git config настроен"

# 3. Работа с директорией проекта
echo ""
echo "📁 Проверка директории проекта..."
if [ ! -d "/root/corporate-learning-platform-v2" ]; then
    echo "   📦 Директория не найдена, клонируем репозиторий..."
    cd /root
    git clone https://github.com/AverEE0/corporate-learning-platform-v2.git
    echo "   ✅ Репозиторий клонирован"
else
    echo "   ✅ Директория существует"
fi

cd /root/corporate-learning-platform-v2

# 4. Настройка Git Remote
echo ""
echo "🔗 Настройка Git Remote..."
if git remote get-url origin > /dev/null 2>&1; then
    CURRENT_URL=$(git remote get-url origin)
    echo "   📍 Текущий remote: $CURRENT_URL"
    if [ "$CURRENT_URL" != "https://github.com/AverEE0/corporate-learning-platform-v2.git" ]; then
        echo "   🔄 Обновляем remote URL..."
        git remote set-url origin https://github.com/AverEE0/corporate-learning-platform-v2.git
        echo "   ✅ Remote URL обновлен"
    else
        echo "   ✅ Remote URL правильный"
    fi
else
    echo "   ➕ Добавляем remote..."
    git remote add origin https://github.com/AverEE0/corporate-learning-platform-v2.git
    echo "   ✅ Remote добавлен"
fi

# 5. Проверка подключения к GitHub
echo ""
echo "🌐 Проверка подключения к GitHub..."
if git fetch origin --dry-run > /dev/null 2>&1; then
    echo "   ✅ Подключение к GitHub работает"
else
    echo "   ⚠️ Не удалось подключиться к GitHub, но продолжаем..."
fi

# 6. Проверка Docker
echo ""
echo "🐳 Проверка Docker..."
if command -v docker > /dev/null 2>&1; then
    echo "   ✅ Docker установлен: $(docker --version)"
else
    echo "   ⚠️ Docker не установлен (может потребоваться установка)"
fi

if command -v docker-compose > /dev/null 2>&1 || docker compose version > /dev/null 2>&1; then
    echo "   ✅ Docker Compose установлен"
else
    echo "   ⚠️ Docker Compose не установлен (может потребоваться установка)"
fi

# 7. Итоговая информация
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Настройка завершена!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Итоговая информация:"
echo "   📁 Директория: $(pwd)"
echo "   🔗 Remote: $(git remote get-url origin)"
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')
echo "   📝 Последний коммит: $COMMIT_HASH"
echo ""
