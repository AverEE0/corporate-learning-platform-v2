# 🚀 НАЧНИТЕ ЗДЕСЬ - Развертывание на VPS

## ⚡ Быстрый старт (5 минут)

### 1. Подготовка сервера

```bash
# Установка Docker (если не установлен)
curl -fsSL https://get.docker.com | sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Загрузка проекта

```bash
cd /opt
mkdir -p corporate-learning-platform-v2
cd corporate-learning-platform-v2
# Загрузите все файлы проекта сюда
```

### 3. Настройка

```bash
# Создайте .env файл
cp .env.production.example .env
nano .env
```

Минимальные настройки:
```env
DATABASE_URL=postgresql://user:password@host:5432/corporate_learning
JWT_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_APP_URL=http://your-server-ip
```

### 4. Развертывание

```bash
# Автоматическое развертывание
chmod +x deploy.sh
./deploy.sh
```

### 5. Готово!

Откройте в браузере: `http://your-server-ip`

## 📚 Документация

- **Быстрое развертывание**: `QUICK_DEPLOY.md`
- **Полная инструкция**: `VPS_DEPLOYMENT.md`
- **Детальное руководство**: `DEPLOYMENT.md`
- **Чеклист**: `DEPLOY_CHECKLIST.md`

## 🛠 Полезные команды

```bash
# Просмотр логов
docker-compose logs -f app

# Перезапуск
docker-compose restart app

# Статус
docker-compose ps

# Или используйте Makefile
make help
make logs
make restart
```

## ✅ Проверка работы

```bash
# Health check
curl http://localhost/api/health

# Должен вернуть: {"status":"ok","timestamp":"..."}
```

## 🆘 Проблемы?

1. Проверьте логи: `docker-compose logs -f app`
2. Проверьте статус: `docker-compose ps`
3. Проверьте .env файл
4. Смотрите `DEPLOYMENT.md` для деталей

## 🎉 Готово к работе!

Проект полностью настроен для развертывания на VPS!

