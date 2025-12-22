# 📋 Список файлов для загрузки на сервер

## Всего 6 файлов

### 1. `app/api/auth/login/route.ts`
**Ошибка:** `Attempted import error: 'rateLimiter' is not exported`  
**Исправление:** Исправлен импорт `rateLimit` и `getClientIdentifier`  
**Путь на сервере:** `/root/corporate-learning-platform-v2/app/api/auth/login/route.ts`

### 2. `app/admin/dashboard/page.tsx`
**Ошибка:** `Cannot find name 'setCoursesByStatus'`  
**Исправление:** Удален код, использующий несуществующие функции  
**Путь на сервере:** `/root/corporate-learning-platform-v2/app/admin/dashboard/page.tsx`

### 3. `app/api/groups/[id]/route.ts`
**Ошибка:** `Type 'number | null' is not assignable to type 'number | undefined'`  
**Исправление:** Изменен `processedManagerId` с `null` на `undefined`, добавлена проверка `isNaN`  
**Путь на сервере:** `/root/corporate-learning-platform-v2/app/api/groups/[id]/route.ts`

### 4. `app/api/groups/route.ts`
**Ошибка:** `Type 'number | null' is not assignable to type 'number | undefined'`  
**Исправление:** Изменен `processedManagerId` с `null` на `undefined`, добавлена проверка `isNaN`  
**Путь на сервере:** `/root/corporate-learning-platform-v2/app/api/groups/route.ts`

### 5. `app/course/[id]/page.tsx`
**Ошибка:** 
- `Cannot find name 'MessageSquare'`
- `Parameter 'match' implicitly has an 'any' type`  
**Исправление:** 
- Добавлен импорт `MessageSquare` из `lucide-react`
- Добавлены типы для параметров функции replace  
**Путь на сервере:** `/root/corporate-learning-platform-v2/app/course/[id]/page.tsx`

### 6. `app/manager/dashboard/page.tsx`
**Ошибка:** `Cannot find name 'searchQuery'`  
**Исправление:** Добавлен state `const [searchQuery, setSearchQuery] = useState('')`  
**Путь на сервере:** `/root/corporate-learning-platform-v2/app/manager/dashboard/page.tsx`

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

