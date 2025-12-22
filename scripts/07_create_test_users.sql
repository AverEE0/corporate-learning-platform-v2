-- Создание тестовых пользователей для проверки функционала
-- Пароль для всех: Test123!
-- ВАЖНО: Рекомендуется использовать скрипт create_test_users_with_db.js для автоматического создания
-- Для ручного создания через SQL сгенерируйте хеш: node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('Test123!', 10));"

-- Хеш пароля Test123! (сгенерирован через bcrypt):
-- $2b$10$9T0BtexVvuK2tVcnF6hVo.3OROJE4yObhbnVyKnXL/VF5ddqlmsea

-- Создание менеджера
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
  'manager@test.com',
  '$2b$10$9T0BtexVvuK2tVcnF6hVo.3OROJE4yObhbnVyKnXL/VF5ddqlmsea',
  'Иван',
  'Менеджеров',
  'manager'
)
ON CONFLICT (email) DO UPDATE
SET 
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  updated_at = CURRENT_TIMESTAMP;

-- Создание студента
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
  'student@test.com',
  '$2b$10$9T0BtexVvuK2tVcnF6hVo.3OROJE4yObhbnVyKnXL/VF5ddqlmsea',
  'Петр',
  'Студентов',
  'student'
)
ON CONFLICT (email) DO UPDATE
SET 
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  updated_at = CURRENT_TIMESTAMP;

-- После выполнения проверьте:
-- SELECT email, first_name, last_name, role FROM users WHERE email IN ('manager@test.com', 'student@test.com');
