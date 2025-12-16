const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Sprint 5 Complete Admin System Migration...\n');
    
    const sqlPath = path.join(__dirname, 'database', 'sprint5-complete-admin-system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Sprint 5 Complete Admin System Migration completed successfully!\n');
    
    // Verify tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('admin_users', 'admin_roles', 'admin_permissions', 'admin_role_permissions')
      ORDER BY table_name
    `);
    
    console.log('📋 Created Tables:');
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    
    // Count permissions
    const permCount = await client.query('SELECT COUNT(*) FROM admin_permissions');
    console.log(`\n🔐 Permissions Created: ${permCount.rows[0].count}`);
    
    // Count roles
    const roleCount = await client.query('SELECT COUNT(*) FROM admin_roles');
    console.log(`👥 Roles Created: ${roleCount.rows[0].count}`);
    
    // Show default admin
    const admin = await client.query('SELECT username, full_name, email FROM admin_users LIMIT 1');
    if (admin.rows.length > 0) {
      console.log(`\n🔑 Default Admin Created:`);
      console.log(`   Username: ${admin.rows[0].username}`);
      console.log(`   Password: Admin@123 (CHANGE THIS!)`);
      console.log(`   Email: ${admin.rows[0].email}`);
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
