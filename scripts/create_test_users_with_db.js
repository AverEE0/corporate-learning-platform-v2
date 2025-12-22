// Скрипт для создания тестовых пользователей в базе данных
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

async function createTestUsers() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const password = 'Test123!';

  try {
    console.log('Создание тестовых пользователей...');
    console.log('Пароль для всех: Test123!');
    console.log('');

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Создаем менеджера
    try {
      await sql`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES (
          'manager@test.com',
          ${passwordHash},
          'Иван',
          'Менеджеров',
          'manager'
        )
        ON CONFLICT (email) DO UPDATE
        SET 
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role
      `;
      console.log('✅ Менеджер создан: manager@test.com');
    } catch (error) {
      console.error('❌ Ошибка при создании менеджера:', error.message);
    }

    // Создаем студента
    try {
      await sql`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES (
          'student@test.com',
          ${passwordHash},
          'Петр',
          'Студентов',
          'student'
        )
        ON CONFLICT (email) DO UPDATE
        SET 
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role
      `;
      console.log('✅ Студент создан: student@test.com');
    } catch (error) {
      console.error('❌ Ошибка при создании студента:', error.message);
    }

    console.log('');
    console.log('Готово! Теперь вы можете войти с:');
    console.log('  Менеджер: manager@test.com / Test123!');
    console.log('  Студент: student@test.com / Test123!');
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

createTestUsers();

