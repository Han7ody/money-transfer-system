const fs = require('fs');
const path = require('path');

// Use the backend's Prisma client which has the correct DATABASE_URL
const prisma = require('../backend/src/lib/prisma').default;

async function runMigration() {
  try {
    console.log('========================================');
    console.log('Sprint 0 Security Migration');
    console.log('========================================\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'database', 'sprint0-security-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration...\n');
    
    // Execute SQL using Prisma's raw query
    await prisma.$executeRawUnsafe(sql);

    console.log('========================================');
    console.log('Migration completed successfully!');
    console.log('========================================\n');
    console.log('New tables created:');
    console.log('- admin_sessions');
    console.log('- ip_whitelist');
    console.log('- failed_login_attempts');
    console.log('- transaction_state_transitions');
    console.log('- kyc_state_transitions');
    console.log('- transaction_approvals\n');
    console.log('New columns added to audit_logs:');
    console.log('- session_id');
    console.log('- geolocation');
    console.log('- checksum\n');
    console.log('Audit logs are now immutable (triggers added)\n');

  } catch (error) {
    console.error('========================================');
    console.error('Migration failed!');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
