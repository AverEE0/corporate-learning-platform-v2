# КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Admin Dashboard

## Проблема
Компоненты ThemeToggle и NotificationsBell не отображались, потому что:
1. Функция `loadStats` была определена дважды (дубликат)
2. Условие `if (loading)` возвращало skeleton loader ДО того, как useEffect мог выполниться
3. Если `user` был undefined, `loadStats()` не вызывался, и `loading` оставался `true` навсегда

## Решение
1. ✅ Удален дубликат функции `loadStats`
2. ✅ Изменено условие `if (loading)` на `if (loading && !user)` чтобы показывать skeleton только при загрузке пользователя
3. ✅ Добавлен `setLoading(false)` при редиректе не-админа

## Файл
- `app/admin/dashboard/page.tsx`

## Статус
✅ Исправлено локально
⏳ Требуется загрузка на сервер и пересборка


