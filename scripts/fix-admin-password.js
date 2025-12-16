const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixAdminPassword() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing Super Admin Password...\n');
    
    const password = 'Admin@123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await client.query(`
      UPDATE admin_users
      SET password_hash = $1, updated_at = NOW()
      WHERE username = 'superadmin'
      RETURNING id, username, full_name, email
    `, [passwordHash]);
    
    if (result.rows.length > 0) {
      console.log('✅ Password updated successfully!');
      console.log(`\nAdmin Details:`);
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Username: ${result.rows[0].username}`);
      console.log(`   Name: ${result.rows[0].full_name}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`\n🔑 Credentials:`);
      console.log(`   Username: superadmin`);
      console.log(`   Password: Admin@123`);
    } else {
      console.log('❌ Super admin not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixAdminPassword().catch(console.error);
