#!/bin/bash

# Health check скрипт для мониторинга

HEALTH_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/health"

response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")

if [ "$response" = "200" ]; then
    echo "✅ Приложение работает"
    exit 0
else
    echo "❌ Приложение не отвечает (код: $response)"
    exit 1
fi

