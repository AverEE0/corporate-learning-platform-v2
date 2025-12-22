# Исправление компонентов ThemeToggle и NotificationsBell

## Проблема
Компоненты не отображаются в браузере, хотя они есть в коде.

## Исправления

### 1. ThemeToggle (`components/theme-toggle.tsx`)
- Добавлена проверка `typeof window !== 'undefined'` перед использованием `localStorage`
- Добавлена проверка `typeof document !== 'undefined'` перед использованием `document`
- Добавлен try-catch для обработки ошибок
- Компонент теперь всегда возвращает кнопку (не возвращает null)

### 2. NotificationsBell (`components/notifications/notifications-bell.tsx`)
- Добавлен try-catch в useEffect для обработки ошибок
- Улучшена обработка ошибок при fetch

## Что нужно сделать

**ВАЖНО:** Скопировать обновленные файлы на сервер:
1. `components/theme-toggle.tsx`
2. `components/notifications/notifications-bell.tsx`

После копирования:
```bash
cd /root/corporate-learning-platform-v2
npm run build
pm2 restart learning-platform
```

