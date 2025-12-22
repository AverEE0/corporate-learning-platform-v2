# Последний файл для загрузки

## Файл: `components/ui/rich-text-editor.tsx`

Исправлена ошибка TypeScript с импортом CSS - добавлен `@ts-ignore` комментарий.

## После загрузки файла выполните на сервере:

```bash
plink -ssh root@212.113.123.94 -pw "wNaqg6r+wRUDV?" "cd /root/corporate-learning-platform-v2 && rm -rf .next node_modules/.cache && npm run build"
```

Если сборка успешна:
```bash
plink -ssh root@212.113.123.94 -pw "wNaqg6r+wRUDV?" "cd /root/corporate-learning-platform-v2 && pm2 delete learning-platform 2>/dev/null; PORT=3044 pm2 start npm --name 'learning-platform' -- start && pm2 save"
```

Или используйте правильный синтаксис SSH (если у вас установлен SSH клиент):
```bash
ssh root@212.113.123.94 "cd /root/corporate-learning-platform-v2 && rm -rf .next node_modules/.cache && npm run build && pm2 delete learning-platform 2>/dev/null; PORT=3044 pm2 start npm --name 'learning-platform' -- start && pm2 save"
```

⚠️ **Внимание:** Для SSH нужен пароль, который нужно ввести интерактивно, или использовать SSH ключи.

