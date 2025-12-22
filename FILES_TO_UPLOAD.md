# Файлы для загрузки на сервер

## ⚠️ ВАЖНО: Всего 6 файлов нужно загрузить

### 1. app/api/auth/login/route.ts  
**Исправлена ошибка:** `Attempted import error: 'rateLimiter' is not exported`
- Исправлен импорт `rateLimit` и `getClientIdentifier`

### 2. app/admin/dashboard/page.tsx  
**Исправлена ошибка:** `Cannot find name 'setCoursesByStatus'`
- Удален код, использующий несуществующие функции

### 3. app/api/groups/[id]/route.ts
**Исправлена ошибка:** `Type 'number | null' is not assignable to type 'number | undefined'`
- Изменен `processedManagerId` с `null` на `undefined`
- Добавлена проверка `isNaN`

### 4. app/api/groups/route.ts
**Исправлена ошибка:** `Type 'number | null' is not assignable to type 'number | undefined'`
- Изменен `processedManagerId` с `null` на `undefined`
- Добавлена проверка `isNaN`

### 5. app/course/[id]/page.tsx
**Исправлена ошибка:** 
- `Cannot find name 'MessageSquare'`
- `Parameter 'match' implicitly has an 'any' type`
- Добавлен импорт `MessageSquare`
- Добавлены типы для параметров функции replace

### 6. app/manager/dashboard/page.tsx (НОВЫЙ!)
**Исправлена ошибка:** `Cannot find name 'searchQuery'`
- Добавлен state `const [searchQuery, setSearchQuery] = useState('')`

## Пути на сервере

```
/root/corporate-learning-platform-v2/app/api/auth/login/route.ts
/root/corporate-learning-platform-v2/app/admin/dashboard/page.tsx
/root/corporate-learning-platform-v2/app/api/groups/[id]/route.ts
/root/corporate-learning-platform-v2/app/api/groups/route.ts
/root/corporate-learning-platform-v2/app/course/[id]/page.tsx
/root/corporate-learning-platform-v2/app/manager/dashboard/page.tsx
```

## Команды для выполнения на сервере после загрузки

```bash
cd /root/corporate-learning-platform-v2

# Очистить кеш и собрать заново
rm -rf .next node_modules/.cache
npm run build

# Если сборка успешна, перезапустить PM2
pm2 restart learning-platform --update-env
pm2 save
```

## Проверка успешной сборки

После `npm run build` должно быть:
```
✓ Compiled successfully
Linting and checking validity of types ...
✓ Linting and checking validity of types
```

Если есть ошибки - пришлите вывод команды `npm run build`.
