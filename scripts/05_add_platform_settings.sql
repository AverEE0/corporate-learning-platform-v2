-- Таблица для хранения настроек платформы
CREATE TABLE IF NOT EXISTS platform_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(key);

-- Комментарии к таблице
COMMENT ON TABLE platform_settings IS 'Таблица для хранения настроек платформы обучения';
COMMENT ON COLUMN platform_settings.key IS 'Ключ настройки';
COMMENT ON COLUMN platform_settings.value IS 'Значение настройки (JSON или текст)';
COMMENT ON COLUMN platform_settings.updated_at IS 'Время последнего обновления';
