#!/bin/bash
# Скрипт для выполнения на сервере - скопируйте и запустите одной командой

cd /root/corporate-learning-platform-v2 || exit 1

echo "=== ДИАГНОСТИКА ==="
echo "Проверка Docker..."
docker --version || echo "Docker не установлен"
docker compose version || docker-compose --version || echo "docker-compose не установлен"

echo ""
echo "Проверка контейнеров..."
docker ps -a | grep corporate_learning || echo "Контейнеры не найдены"

echo ""
echo "Проверка файлов..."
ls -la .env.local 2>/dev/null || echo ".env.local не найден"
ls -la docker-compose.yml 2>/dev/null || echo "docker-compose.yml не найден"
ls -la Dockerfile 2>/dev/null || echo "Dockerfile не найден"

echo ""
echo "=== ИСПРАВЛЕНИЕ ==="

# Создание .env.local
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://postgres:password@postgres:5432/learning_platform
JWT_SECRET=tfj6T/jJ5dgTqoKfZmw1hTqJYSIXO/jI1g2RRlF87bE=
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_APP_URL=http://212.113.123.94:3044
EOF
echo "✓ .env.local создан"

# Исправление next.config.js
if [ -f "next.config.js" ]; then
    if ! grep -q "output: 'standalone'" next.config.js; then
        sed -i "s/const nextConfig = {/const nextConfig = {\n  output: 'standalone',/" next.config.js
        echo "✓ next.config.js исправлен"
    fi
fi

# Создание директорий
mkdir -p uploads logs && chmod 755 uploads logs
echo "✓ Директории созданы"

# Остановка старых процессов
echo "Остановка старых процессов..."
pm2 stop learning-platform 2>/dev/null || true
pm2 delete learning-platform 2>/dev/null || true
docker compose down 2>/dev/null || true
docker stop corporate_learning_app corporate_learning_db 2>/dev/null || true
docker rm corporate_learning_app corporate_learning_db 2>/dev/null || true

# Запуск Docker
echo ""
echo "=== ЗАПУСК DOCKER ==="
systemctl start docker 2>/dev/null || true

# Сборка и запуск
echo "Сборка образов..."
docker compose build --no-cache 2>&1 | tail -10

echo "Запуск контейнеров..."
docker compose up -d

echo "Ожидание запуска (15 секунд)..."
sleep 15

# Проверка
echo ""
echo "=== ПРОВЕРКА ==="
docker compose ps

echo ""
echo "Health check:"
curl -s http://localhost:3044/api/health || echo "Health check не прошел"

echo ""
echo "Логи (последние 30 строк):"
docker logs corporate_learning_app --tail=30 2>&1

echo ""
echo "=== ГОТОВО ==="

