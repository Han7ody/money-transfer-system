const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function cleanAndMigrate() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting Sprint 5 Clean and Migration...\n');
    
    await client.query('BEGIN');
    
    // Step 1: Drop old Sprint 5 tables
    console.log('🗑️  Dropping old Sprint 5 tables...');
    
    await client.query('DROP TABLE IF EXISTS password_reset_history CASCADE');
    console.log('   ✅ Dropped password_reset_history');
    
    await client.query('DROP TABLE IF EXISTS agent_credentials CASCADE');
    console.log('   ✅ Dropped agent_credentials');
    
    await client.query('DROP TABLE IF EXISTS role_permissions CASCADE');
    console.log('   ✅ Dropped role_permissions');
    
    // Step 2: Drop any existing new tables (in case of partial migration)
    console.log('\n🗑️  Dropping any existing new Sprint 5 tables...');
    
    await client.query('DROP TABLE IF EXISTS admin_password_resets CASCADE');
    await client.query('DROP TABLE IF EXISTS admin_audit_logs CASCADE');
    await client.query('DROP TABLE IF EXISTS admin_sessions CASCADE');
    await client.query('DROP TABLE IF EXISTS admin_role_permissions CASCADE');
    await client.query('DROP TABLE IF EXISTS admin_permissions CASCADE');
    await client.query('DROP TABLE IF EXISTS admin_users CASCADE');
    await client.query('DROP TABLE IF EXISTS admin_roles CASCADE');
    console.log('   ✅ Cleaned up any existing new tables');
    
    // Step 3: Run new migration
    console.log('\n📦 Running new Sprint 5 Complete Admin System migration...');
    
    const sqlPath = path.join(__dirname, 'database', 'sprint5-complete-admin-system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    
    await client.query('COMMIT');
    
    console.log('\n✅ Sprint 5 Clean and Migration completed successfully!\n');
    
    // Verify tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'admin_users', 'admin_roles', 'admin_permissions', 
          'admin_role_permissions', 'admin_sessions', 
          'admin_audit_logs', 'admin_password_resets'
        )
      ORDER BY table_name
    `);
    
    console.log('📋 Created Tables:');
    tables.rows.forEach(row => console.log(`   ✅ ${row.table_name}`));
    
    // Count permissions
    const permCount = await client.query('SELECT COUNT(*) FROM admin_permissions');
    console.log(`\n🔐 Permissions Created: ${permCount.rows[0].count}`);
    
    // Count roles
    const roleCount = await client.query('SELECT COUNT(*) FROM admin_roles');
    console.log(`👥 Roles Created: ${roleCount.rows[0].count}`);
    
    // Show roles with permission counts
    const roleDetails = await client.query(`
      SELECT 
        ar.role_name,
        COUNT(arp.permission_id) as permission_count
      FROM admin_roles ar
      LEFT JOIN admin_role_permissions arp ON ar.id = arp.role_id
      GROUP BY ar.role_name
      ORDER BY ar.role_name
    `);
    
    console.log('\n📊 Role Permission Mappings:');
    roleDetails.rows.forEach(row => {
      console.log(`   ${row.role_name}: ${row.permission_count} permissions`);
    });
    
    // Show default admin
    const admin = await client.query('SELECT username, full_name, email FROM admin_users LIMIT 1');
    if (admin.rows.length > 0) {
      console.log(`\n🔑 Default Admin Created:`);
      console.log(`   Username: ${admin.rows[0].username}`);
      console.log(`   Password: Admin@123 (CHANGE THIS!)`);
      console.log(`   Email: ${admin.rows[0].email}`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ SUCCESS! Sprint 5 is ready.');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nNext steps:');
    console.log('1. Run seeding (optional): node seed-sprint5-admin-system.js');
    console.log('2. Restart backend: cd ../backend && npm run dev');
    console.log('3. Test login with: superadmin / Admin@123');
    console.log('═══════════════════════════════════════════════════════\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanAndMigrate().catch(console.error);
