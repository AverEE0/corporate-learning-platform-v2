# ФАЙЛЫ ДЛЯ ЗАГРУЗКИ НА СЕРВЕР СЕЙЧАС

## Критический файл

### 1. `app/admin/dashboard/page.tsx`
**Проблема**: Компоненты ThemeToggle и NotificationsBell не отображались из-за бесконечного состояния loading.

**Исправления**:
- ✅ Удален дубликат функции `loadStats`
- ✅ Изменено условие `if (loading)` на `if (loading && !user)`
- ✅ Добавлен `setLoading(false)` при редиректе

**Действия после загрузки**:
```bash
cd /root/corporate-learning-platform-v2
npm run build
pm2 restart learning-platform --update-env
```

## Проверка
После пересборки и перезапуска проверьте в браузере:
1. Откройте https://ykz.tw1.ru/admin/dashboard
2. В header должны быть видны:
   - Кнопка переключения темы (луна/солнце)
   - Колокольчик уведомлений
   - Кнопка "Дашборд"
   - Кнопка выхода


