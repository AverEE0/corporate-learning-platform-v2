# Файлы для загрузки на сервер

## Исправленные файлы (загрузите эти):

### 1. Конфигурация
- `package.json` - исправлен Tailwind CSS (v3.4.1)
- `postcss.config.mjs` - исправлен для Tailwind v3

### 2. API Routes (исправлены для Next.js 15)
- `app/api/admin/stats/route.ts`
- `app/api/manager/students/route.ts`
- `app/api/manager/courses/route.ts`
- `app/api/courses/lessons/route.ts`
- `app/api/courses/blocks/route.ts`
- `app/api/progress/route.ts`
- `app/api/courses/my/route.ts`
- `app/api/courses/route.ts`
- `app/api/auth/me/route.ts`

## Что было исправлено:

1. **Tailwind CSS**: Понижена версия с v4.1.9 до v3.4.1 (совместимость)
2. **PostCSS**: Изменен с @tailwindcss/postcss на стандартный tailwindcss
3. **Next.js 15**: Все вызовы cookies() теперь используют await: `(await cookies()).get()`

## После загрузки на сервере:

```bash
cd /root/corporate-learning-platform-v2
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

