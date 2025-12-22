# Скрипт для загрузки всех измененных файлов на сервер

$ErrorActionPreference = "Stop"

# Список файлов для загрузки
$filesToUpload = @(
    @{
        Local = "app\course-builder\page.tsx"
        Remote = "app/course-builder/page.tsx"
    },
    @{
        Local = "app\course\[id]\page.tsx"
        Remote = "app/course/[id]/page.tsx"
    },
    @{
        Local = "app\api\courses\lessons\[id]\route.ts"
        Remote = "app/api/courses/lessons/[id]/route.ts"
    },
    @{
        Local = "app\api\courses\blocks\[id]\route.ts"
        Remote = "app/api/courses/blocks/[id]/route.ts"
    }
)

$baseDir = "C:\corporate-learning-platform\corporate-learning-platform-v2"

Write-Host "Начинаем загрузку файлов на сервер..." -ForegroundColor Cyan
Write-Host ""

foreach ($file in $filesToUpload) {
    $localPath = Join-Path $baseDir $file.Local
    
    if (-not (Test-Path $localPath)) {
        Write-Warning "Файл не найден: $localPath"
        continue
    }
    
    Write-Host "Загрузка: $($file.Local)" -ForegroundColor Yellow
    
    try {
        & .\upload-file.ps1 -LocalPath $localPath -RemotePath $file.Remote
        Write-Host "✓ Успешно" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Error "Ошибка при загрузке $($file.Local): $_"
        Write-Host ""
    }
}

Write-Host "Все файлы загружены!" -ForegroundColor Green
Write-Host ""
Write-Host "Теперь нужно пересобрать приложение на сервере:" -ForegroundColor Cyan
Write-Host "  docker compose build app" -ForegroundColor Yellow
Write-Host "  docker compose up -d app" -ForegroundColor Yellow

