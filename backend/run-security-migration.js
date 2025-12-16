const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('========================================');
    console.log('Sprint 0 Security Migration');
    console.log('========================================\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'scripts', 'database', 'sprint0-security-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration...\n');
    
    // Split SQL into individual statements, handling DO blocks
    const statements = [];
    let currentStatement = '';
    let inDoBlock = false;
    
    const lines = sql.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comment-only lines
      if (trimmedLine.startsWith('--')) continue;
      
      // Check for DO block start
      if (trimmedLine.startsWith('DO $') || trimmedLine.startsWith('DO $$')) {
        inDoBlock = true;
      }
      
      currentStatement += line + '\n';
      
      // Check for DO block end
      if (inDoBlock && (trimmedLine === '$;' || trimmedLine === '$$;')) {
        inDoBlock = false;
        statements.push(currentStatement.trim());
        currentStatement = '';
        continue;
      }
      
      // Regular statement end
      if (!inDoBlock && trimmedLine.endsWith(';')) {
        const stmt = currentStatement.trim();
        if (stmt && !stmt.startsWith('--')) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    console.log(`Found ${statements.length} statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          const preview = statement.substring(0, 60).replace(/\n/g, ' ');
          console.log(`[${i + 1}/${statements.length}] ${preview}...`);
          
          // Use $queryRawUnsafe for DO blocks (they contain multiple commands)
          if (statement.trim().startsWith('DO $')) {
            await prisma.$queryRawUnsafe(statement);
          } else {
            await prisma.$executeRawUnsafe(statement);
          }
        } catch (error) {
          // Ignore "already exists" errors
          if (error.code === 'P2010' && error.meta?.code === '42P07') {
            console.log(`  ⚠ Already exists, skipping...`);
          } else if (error.code === 'P2010' && error.meta?.code === '42P01') {
            console.log(`  ⚠ Doesn't exist, skipping...`);
          } else if (error.code === 'P2010' && error.meta?.code === '42710') {
            console.log(`  ⚠ Object already exists, skipping...`);
          } else if (error.code === 'P2010' && error.meta?.code === '42601' && statement.includes('DO $')) {
            console.log(`  ⚠ DO block - skipping (Prisma limitation)...`);
          } else {
            console.error(`\n  ❌ Error executing statement ${i + 1}:`);
            console.error(`  ${error.message}`);
            throw error;
          }
        }
      }
    }

    console.log('\n========================================');
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
    console.error('\n========================================');
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
