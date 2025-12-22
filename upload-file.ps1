param(
    [Parameter(Mandatory=$true)]
    [string]$LocalPath,
    
    [Parameter(Mandatory=$true)]
    [string]$RemotePath,
    
    [Parameter(Mandatory=$false)]
    [string]$Server = "root@212.113.123.94",
    
    [Parameter(Mandatory=$false)]
    [string]$Password = "wNaqg6r+wRUDV?"
)

# Проверяем существование файла (экранируем квадратные скобки для Test-Path)
$testPath = $LocalPath -replace '\[', '`[' -replace '\]', '`]'
if (-not (Test-Path $testPath)) {
    Write-Error "Файл не найден: $LocalPath"
    exit 1
}

Write-Host "Загрузка: $LocalPath -> $RemotePath" -ForegroundColor Cyan

try {
    # Читаем файл как байты для правильной обработки UTF-8
    $fileBytes = [System.IO.File]::ReadAllBytes($LocalPath)
    $base64 = [Convert]::ToBase64String($fileBytes)
    
    # Создаем временный файл для base64
    $tempDir = "C:\temp"
    if (-not (Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    }
    
    $tempFile = Join-Path $tempDir "upload-$(Get-Random).txt"
    [System.IO.File]::WriteAllText($tempFile, $base64, [System.Text.Encoding]::ASCII)
    
    Write-Host "Размер base64: $($base64.Length) символов" -ForegroundColor Green
    
    # Передаем base64 через stdin в Python скрипт на сервере
    $base64Content = [System.IO.File]::ReadAllText($tempFile, [System.Text.Encoding]::ASCII)
    
    # Создаем Python скрипт с правильным экранированием
    $remotePathEscaped = $RemotePath -replace "'", "''"
    $pythonCode = "import sys, base64, os; data = sys.stdin.read().strip(); os.makedirs(os.path.dirname('$remotePathEscaped'), exist_ok=True); open('$remotePathEscaped', 'wb').write(base64.b64decode(data)); print('OK')"
    
    # Передаем base64 через stdin в Python
    $result = $base64Content | & plink -ssh $Server -pw $Password "cd /root/corporate-learning-platform-v2 && python3 -c `"$pythonCode`""
    
    if ($LASTEXITCODE -eq 0 -or $result -match "OK") {
        Write-Host "Успешно загружено!" -ForegroundColor Green
    } else {
        Write-Warning "Возможна ошибка. Код выхода: $LASTEXITCODE"
    }
    
} catch {
    Write-Error "Ошибка: $_"
    exit 1
} finally {
    if (Test-Path $tempFile) {
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    }
}
