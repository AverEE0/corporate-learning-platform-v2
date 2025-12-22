const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    console.log('Hash generated, length:', hash.length);
    
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role',
      ['admin@example.com', hash, 'Admin', 'User', 'admin']
    );
    
    console.log('User created:', result.rows[0]);
    
    pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    pool.end();
    process.exit(1);
  }
}

main();

