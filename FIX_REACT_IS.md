# Исправление проблемы с react-is

## Проблема
Сборка не проходит из-за отсутствия зависимости `react-is`, которая нужна для `recharts`.

## Решение
Установить `react-is` с флагом `--legacy-peer-deps` из-за конфликта зависимостей с `react-quill`.

```bash
cd /root/corporate-learning-platform-v2
npm install react-is --legacy-peer-deps
npm run build
pm2 restart learning-platform --update-env
```

## Статус
- ✅ react-is установлен
- ⏳ Сборка выполняется
- ⏳ PM2 перезапускается


