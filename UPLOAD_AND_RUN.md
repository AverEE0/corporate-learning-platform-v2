# Инструкция по загрузке и запуску на сервере

## Файлы для загрузки

Загрузите на сервер следующие исправленные файлы:

1. **package.json** - исправлен (tailwindcss v3.4.1, удален @tailwindcss/postcss)
2. **postcss.config.mjs** - исправлен (использует tailwindcss и autoprefixer)

## Шаги на сервере

### 1. Остановите старый проект (если еще не остановлен)
```bash
cd /opt/corporate-learning-platform
docker-compose down
```

### 2. Перейдите в новый проект
```bash
cd /root/corporate-learning-platform-v2
```

### 3. Замените исправленные файлы
Загрузите `package.json` и `postcss.config.mjs` в эту директорию, заменив существующие.

### 4. Проверьте .env файл
Убедитесь, что файл `.env` существует и содержит:
```env
DATABASE_URL=postgresql://postgres:secure_password_123@postgres:5432/corporate_learning
JWT_SECRET=UBmE/47qH8rNlcIRZpDhZNjcw0LBE7Xd5+1s5cE5F2w=
NEXT_PUBLIC_APP_URL=http://212.113.123.94
UPLOAD_DIR=/app/uploads
NODE_ENV=production
```

### 5. Создайте необходимые директории
```bash
mkdir -p uploads logs
chmod 755 uploads logs
```

### 6. Соберите и запустите проект
```bash
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### 7. Проверьте статус
```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f app
```

### 8. Проверьте работу
```bash
curl http://localhost/api/health
```

## Если возникнут проблемы

### Просмотр логов
```bash
docker-compose -f docker-compose.prod.yml logs app
```

### Перезапуск
```bash
docker-compose -f docker-compose.prod.yml restart app
```

### Полная пересборка
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## Готово!

После успешного запуска приложение будет доступно по адресу: http://212.113.123.94

