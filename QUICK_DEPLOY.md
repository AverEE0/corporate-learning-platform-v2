# ⚡ Быстрое развертывание за 5 минут

## 🎯 Минимальные команды

```bash
# 1. Установка Docker (если не установлен)
curl -fsSL https://get.docker.com | sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 2. Загрузка проекта
cd /opt
mkdir -p corporate-learning-platform-v2
cd corporate-learning-platform-v2
# Загрузите все файлы проекта сюда

# 3. Настройка
cp .env.production.example .env
nano .env  # Заполните DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_APP_URL

# 4. Развертывание
chmod +x deploy.sh
./deploy.sh

# 5. Готово! Откройте http://your-server-ip
```

## 📝 Минимальный .env

```env
DATABASE_URL=postgresql://user:password@host:5432/corporate_learning
JWT_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_APP_URL=http://your-server-ip
UPLOAD_DIR=/app/uploads
NODE_ENV=production
```

## ✅ Проверка

```bash
curl http://localhost/api/health
# Должен вернуть: {"status":"ok","timestamp":"..."}
```

## 🆘 Если что-то не работает

```bash
# Логи
docker-compose logs -f app

# Перезапуск
docker-compose restart app

# Статус
docker-compose ps
```

Готово! 🎉

