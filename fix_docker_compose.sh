#!/bin/bash
# Скрипт для обновления docker-compose.yml на сервере

cd /root/corporate-learning-platform-v2

# Останавливаем контейнеры
docker compose down

# Исправляем docker-compose.yml
cat > docker-compose.yml << 'EOF'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: corporate_learning_app
    restart: unless-stopped
    ports:
      - "3044:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - UPLOAD_DIR=/app/uploads
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  app-network:
    driver: bridge
EOF

echo "✅ docker-compose.yml обновлен"
docker compose config 2>&1 | head -5


