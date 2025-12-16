const mysql = require('../backend/node_modules/mysql2/promise');

async function checkAdminStatus() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'rasid_db'
  });

  const [rows] = await conn.execute(
    'SELECT id, username, full_name, is_active FROM admin_users WHERE id = 6'
  );
  
  console.log('Admin status in database:');
  console.log(JSON.stringify(rows, null, 2));
  
  await conn.end();
}

checkAdminStatus().catch(console.error);
