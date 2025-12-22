const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    const hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    console.log('Hash length:', hash.length);
    
    const result = await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'admin@example.com']);
    console.log('Updated rows:', result.rowCount);
    
    const check = await pool.query('SELECT email, LENGTH(password_hash) as len FROM users WHERE email = $1', ['admin@example.com']);
    console.log('After update:', check.rows[0]);
    
    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
    process.exit(1);
  }
}

main();

