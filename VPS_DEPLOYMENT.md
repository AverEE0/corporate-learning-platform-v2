# 🚀 Развертывание на VPS - Полная инструкция

## 📋 Предварительные требования

### Минимальные требования к серверу:
- **ОС**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM**: 2GB (рекомендуется 4GB)
- **CPU**: 2 ядра
- **Диск**: 20GB свободного места
- **Сеть**: Публичный IP адрес

### Необходимое ПО:
- Docker 20.10+
- Docker Compose 2.0+
- PostgreSQL (можно в Docker)

## 🔧 Шаг 1: Подготовка сервера

### Установка Docker

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка зависимостей
sudo apt install -y curl wget git

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверка установки
docker --version
docker-compose --version

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker
```

### Настройка Firewall

```bash
# Установка UFW (если не установлен)
sudo apt install -y ufw

# Разрешение портов
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Включение firewall
sudo ufw enable
sudo ufw status
```

## 📦 Шаг 2: Установка проекта

### Вариант A: Через Git

```bash
# Создание директории
sudo mkdir -p /opt/corporate-learning
cd /opt/corporate-learning

# Клонирование (или загрузка файлов)
git clone <your-repo-url> corporate-learning-platform-v2
cd corporate-learning-platform-v2
```

### Вариант B: Загрузка файлов

```bash
# Создание директории
sudo mkdir -p /opt/corporate-learning
cd /opt/corporate-learning

# Загрузите файлы проекта через SCP, FTP или другим способом
# Затем распакуйте архив
```

## ⚙️ Шаг 3: Настройка окружения

```bash
cd /opt/corporate-learning/corporate-learning-platform-v2

# Создание .env файла
cp .env.production.example .env

# Редактирование .env
nano .env
```

### Настройка .env файла:

```env
# База данных
# Если используете внешнюю БД:
DATABASE_URL=postgresql://user:password@host:5432/corporate_learning

# Если используете PostgreSQL из docker-compose:
DATABASE_URL=postgresql://corporate_user:your_password@postgres:5432/corporate_learning

# JWT Secret (сгенерируйте случайную строку)
JWT_SECRET=$(openssl rand -base64 32)

# URL приложения
NEXT_PUBLIC_APP_URL=http://your-server-ip
# или с доменом:
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Директория для загрузок
UPLOAD_DIR=/app/uploads

# Режим работы
NODE_ENV=production
```

## 🗄️ Шаг 4: Настройка базы данных

### Вариант A: PostgreSQL в Docker (рекомендуется для начала)

Используйте `docker-compose.prod.yml` который включает PostgreSQL.

### Вариант B: Внешняя база данных

1. Создайте базу данных на вашем PostgreSQL сервере:
```sql
CREATE DATABASE corporate_learning;
CREATE USER corporate_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE corporate_learning TO corporate_user;
```

2. Выполните SQL скрипт:
```bash
psql -h your-db-host -U corporate_user -d corporate_learning -f scripts/01_create_database.sql
```

## 🚀 Шаг 5: Развертывание

```bash
cd /opt/corporate-learning/corporate-learning-platform-v2

# Создание необходимых директорий
mkdir -p uploads logs ssl backups

# Установка прав
chmod 755 uploads logs
chmod +x deploy.sh scripts/*.sh

# Если используете PostgreSQL в Docker:
docker-compose -f docker-compose.prod.yml up -d

# Или стандартный вариант:
docker-compose up -d --build

# Проверка статуса
docker-compose ps
docker-compose logs -f app
```

## ✅ Шаг 6: Проверка работы

```bash
# Проверка здоровья приложения
curl http://localhost/api/health

# Проверка через браузер
# Откройте: http://your-server-ip
```

## 🔒 Шаг 7: Настройка SSL (Let's Encrypt)

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Остановка nginx в Docker (временно)
docker-compose stop nginx

# Получение сертификата
sudo certbot certonly --standalone -d your-domain.com

# Настройка автоматического обновления
sudo certbot renew --dry-run
```

После получения сертификата, обновите `nginx.conf` для использования SSL.

## 📊 Шаг 8: Мониторинг

### Просмотр логов

```bash
# Логи приложения
docker-compose logs -f app

# Логи Nginx
docker-compose logs -f nginx

# Все логи
docker-compose logs -f
```

### Статус контейнеров

```bash
docker-compose ps
docker stats
```

## 🔄 Обновление приложения

```bash
cd /opt/corporate-learning/corporate-learning-platform-v2

# Остановка
docker-compose down

# Обновление кода
git pull  # или загрузите новые файлы

# Пересборка
docker-compose build --no-cache

# Запуск
docker-compose up -d

# Проверка
docker-compose logs -f app
```

## 💾 Резервное копирование

### Автоматический бэкап (cron)

```bash
# Редактирование crontab
crontab -e

# Добавьте строку для ежедневного бэкапа в 2:00
0 2 * * * cd /opt/corporate-learning/corporate-learning-platform-v2 && ./scripts/backup.sh
```

### Ручной бэкап

```bash
cd /opt/corporate-learning/corporate-learning-platform-v2
./scripts/backup.sh
```

## 🛠 Полезные команды

```bash
# Перезапуск приложения
docker-compose restart app

# Остановка всех контейнеров
docker-compose down

# Остановка с удалением volumes
docker-compose down -v

# Просмотр использования ресурсов
docker stats

# Вход в контейнер
docker-compose exec app sh

# Проверка переменных окружения
docker-compose exec app env
```

## 🔐 Безопасность

1. **Измените все пароли** в `.env`
2. **Используйте сильный JWT_SECRET** (минимум 32 символа)
3. **Настройте firewall** (UFW)
4. **Регулярно обновляйте систему**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
5. **Настройте fail2ban** для защиты от брутфорса:
   ```bash
   sudo apt install fail2ban
   ```

## ❓ Решение проблем

### Приложение не запускается

```bash
# Проверьте логи
docker-compose logs app

# Проверьте переменные окружения
docker-compose exec app printenv | grep DATABASE_URL
```

### Ошибки подключения к БД

```bash
# Проверьте доступность БД
docker-compose exec app ping postgres

# Проверьте переменную DATABASE_URL
docker-compose exec app echo $DATABASE_URL
```

### Проблемы с загрузкой файлов

```bash
# Проверьте права доступа
ls -la uploads/
chmod 755 uploads/
chown -R 1001:1001 uploads/
```

### Контейнер падает

```bash
# Проверьте логи
docker-compose logs --tail=100 app

# Перезапустите контейнер
docker-compose restart app
```

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи: `docker-compose logs -f`
2. Проверьте статус: `docker-compose ps`
3. Проверьте переменные окружения
4. Убедитесь что все порты открыты

## ✅ Чеклист после развертывания

- [ ] Приложение доступно по IP/домену
- [ ] База данных инициализирована
- [ ] SSL сертификат установлен (если используется домен)
- [ ] Firewall настроен
- [ ] Резервное копирование настроено
- [ ] Мониторинг настроен
- [ ] Все пароли изменены

