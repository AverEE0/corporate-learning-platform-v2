// Скрипт для создания тестовых пользователей
const bcrypt = require('bcryptjs');

async function createTestUsers() {
  const password = 'Test123!';
  const managerHash = await bcrypt.hash(password, 10);
  const studentHash = await bcrypt.hash(password, 10);

  console.log('-- Создание тестовых пользователей');
  console.log('-- Пароль для всех пользователей: Test123!');
  console.log('');
  
  console.log('-- Менеджер');
  console.log(`INSERT INTO users (email, password_hash, first_name, last_name, role)`);
  console.log(`VALUES (`);
  console.log(`  'manager@test.com',`);
  console.log(`  '${managerHash}',`);
  console.log(`  'Иван',`);
  console.log(`  'Менеджеров',`);
  console.log(`  'manager'`);
  console.log(`) ON CONFLICT (email) DO UPDATE`);
  console.log(`SET`);
  console.log(`  first_name = EXCLUDED.first_name,`);
  console.log(`  last_name = EXCLUDED.last_name,`);
  console.log(`  role = EXCLUDED.role;`);
  console.log('');
  
  console.log('-- Студент');
  console.log(`INSERT INTO users (email, password_hash, first_name, last_name, role)`);
  console.log(`VALUES (`);
  console.log(`  'student@test.com',`);
  console.log(`  '${studentHash}',`);
  console.log(`  'Петр',`);
  console.log(`  'Студентов',`);
  console.log(`  'student'`);
  console.log(`) ON CONFLICT (email) DO UPDATE`);
  console.log(`SET`);
  console.log(`  first_name = EXCLUDED.first_name,`);
  console.log(`  last_name = EXCLUDED.last_name,`);
  console.log(`  role = EXCLUDED.role;`);
}

createTestUsers().catch(console.error);

