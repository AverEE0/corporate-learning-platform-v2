#!/bin/bash

# Скрипт резервного копирования

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "💾 Создание резервной копии..."

# Бэкап базы данных
if [ ! -z "$DATABASE_URL" ]; then
    echo "📊 Бэкап базы данных..."
    pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"
    echo "✅ База данных сохранена: $BACKUP_DIR/db_backup_$DATE.sql.gz"
fi

# Бэкап загруженных файлов
if [ -d "uploads" ]; then
    echo "📁 Бэкап загруженных файлов..."
    tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" uploads/
    echo "✅ Файлы сохранены: $BACKUP_DIR/uploads_backup_$DATE.tar.gz"
fi

# Удаление старых бэкапов (старше 7 дней)
find "$BACKUP_DIR" -type f -mtime +7 -delete

echo "✅ Резервное копирование завершено!"

