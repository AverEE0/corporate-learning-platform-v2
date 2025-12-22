-- Создание таблицы для аудит логов

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INTEGER,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Комментарии к таблице
COMMENT ON TABLE audit_logs IS 'Таблица для хранения аудит логов действий пользователей';
COMMENT ON COLUMN audit_logs.action IS 'Тип действия (например: course.created, user.deleted)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Тип ресурса (course, user, group, etc.)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID ресурса, над которым было выполнено действие';
COMMENT ON COLUMN audit_logs.details IS 'Дополнительные детали действия в формате JSON';

