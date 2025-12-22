# Создание тестовых пользователей

## Способ 1: Через Node.js скрипт (Рекомендуется)

```bash
cd corporate-learning-platform-v2
node scripts/create_test_users_with_db.js
```

Этот скрипт:
- Подключится к базе данных через `DATABASE_URL`
- Сгенерирует правильные bcrypt хеши
- Создаст пользователей в базе данных

## Способ 2: Через SQL (Требует предварительной генерации хеша)

1. Сгенерируйте хеш пароля:
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('Test123!', 10));"
```

2. Замените хеш в файле `scripts/07_create_test_users.sql`

3. Выполните SQL скрипт в вашей базе данных

## Способ 3: Через API регистрации

Можно использовать API endpoint `/api/auth/register`:
- Email: `manager@test.com`
- Password: `Test123!`
- Role: `manager` (но нужно будет потом изменить через базу данных, так как регистрация создает только студентов)

## Данные для входа

После создания пользователей вы сможете войти с:

**Менеджер:**
- Email: `manager@test.com`
- Password: `Test123!`

**Студент:**
- Email: `student@test.com`
- Password: `Test123!`

## Проверка

После создания пользователей проверьте их наличие:

```sql
SELECT id, email, first_name, last_name, role, created_at 
FROM users 
WHERE email IN ('manager@test.com', 'student@test.com');
```

