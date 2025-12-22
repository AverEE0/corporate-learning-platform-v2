# Инструкция по развертыванию на VPS

## 📋 Требования

- VPS с Ubuntu 20.04+ или Debian 11+
- Минимум 2GB RAM, 2 CPU cores
- 20GB свободного места
- Docker и Docker Compose установлены
- PostgreSQL база данных (можно использовать внешнюю или в docker-compose)

## 🚀 Быстрое развертывание

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Клонирование и настройка проекта

```bash
# Клонирование проекта (или загрузка файлов)
cd /opt
git clone <your-repo> corporate-learning-platform-v2
cd corporate-learning-platform-v2

# Создание .env файла
cp .env.example .env
nano .env
```

### 3. Настройка .env файла

Отредактируйте `.env` файл:

```env
# База данных
DATABASE_URL=postgresql://user:password@host:5432/corporate_learning

# JWT Secret (сгенерируйте случайную строку)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long

# URL приложения
NEXT_PUBLIC_APP_URL=http://your-domain.com
# или для IP
NEXT_PUBLIC_APP_URL=http://your-server-ip

# Директория для загрузок
UPLOAD_DIR=/app/uploads

# Режим работы
NODE_ENV=production
```

### 4. Развертывание

```bash
# Сделайте скрипт исполняемым
chmod +x deploy.sh

# Запустите развертывание
./deploy.sh
```

Или вручную:

```bash
# Создание директорий
mkdir -p uploads logs ssl

# Сборка и запуск
docker-compose build
docker-compose up -d

# Проверка статуса
docker-compose ps
docker-compose logs -f app
```

### 5. Инициализация базы данных

```bash
# Подключитесь к контейнеру
docker-compose exec app sh

# Или выполните SQL скрипт напрямую
docker-compose exec -T app psql $DATABASE_URL -f scripts/01_create_database.sql
```

## 🔧 Настройка Nginx (опционально, если не используете docker-compose nginx)

Если хотите использовать свой Nginx на хосте:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/files/ {
        alias /opt/corporate-learning-platform-v2/uploads/;
    }
}
```

## 🔒 Настройка SSL (Let's Encrypt)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление
sudo certbot renew --dry-run
```

## 📊 Мониторинг и логи

```bash
# Просмотр логов приложения
docker-compose logs -f app

# Просмотр логов Nginx
docker-compose logs -f nginx

# Статус контейнеров
docker-compose ps

# Использование ресурсов
docker stats
```

## 🔄 Обновление приложения

```bash
# Остановка контейнеров
docker-compose down

# Обновление кода (git pull или загрузка новых файлов)
git pull  # или загрузите новые файлы

# Пересборка и запуск
docker-compose build --no-cache
docker-compose up -d
```

## 🛠 Управление

```bash
# Перезапуск приложения
docker-compose restart app

# Остановка всех контейнеров
docker-compose down

# Остановка с удалением volumes
docker-compose down -v

# Просмотр использования ресурсов
docker stats corporate_learning_app
```

## 🔐 Безопасность

1. **Измените JWT_SECRET** на случайную строку минимум 32 символа
2. **Настройте firewall**:
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
3. **Регулярно обновляйте систему**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
4. **Настройте резервное копирование** БД и файлов

## 📝 Резервное копирование

```bash
# Бэкап базы данных
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Бэкап загруженных файлов
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## ❓ Решение проблем

### Приложение не запускается
```bash
# Проверьте логи
docker-compose logs app

# Проверьте переменные окружения
docker-compose exec app env | grep DATABASE_URL
```

### Проблемы с базой данных
```bash
# Проверьте подключение
docker-compose exec app node -e "console.log(process.env.DATABASE_URL)"
```

### Проблемы с загрузкой файлов
```bash
# Проверьте права доступа
ls -la uploads/
chmod 755 uploads/
```

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи: `docker-compose logs -f`
2. Проверьте статус: `docker-compose ps`
3. Проверьте переменные окружения в `.env`

