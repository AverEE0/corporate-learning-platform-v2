# Скрипты для загрузки файлов на сервер

## Использование

### Загрузка одного файла:
```powershell
.\upload-file.ps1 -LocalPath "app\course-builder\page.tsx" -RemotePath "app/course-builder/page.tsx"
```

### Загрузка всех измененных файлов:
```powershell
.\upload-all-changes.ps1
```

## Особенности

- Скрипты правильно обрабатывают UTF-8 кодировку
- Используют base64 для передачи бинарных данных
- Автоматически создают необходимые директории на сервере
- Обрабатывают пути с квадратными скобками (экранирование через обратные кавычки)

## Требования

- PowerShell 5.1 или выше
- plink.exe в PATH или в текущей директории
- Доступ к серверу по SSH

## Примеры

```powershell
# Загрузка файла с квадратными скобками в пути
.\upload-file.ps1 -LocalPath "app\api\courses\lessons`[id`]\route.ts" -RemotePath "app/api/courses/lessons/[id]/route.ts"

# Загрузка с указанием другого сервера
.\upload-file.ps1 -LocalPath "file.tsx" -RemotePath "app/file.tsx" -Server "user@example.com" -Password "pass"
```

