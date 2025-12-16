require('dotenv').config({ path: './backend/.env' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('========================================');
    console.log('Sprint 4: Support System Migration');
    console.log('========================================\n');

    const sqlFile = path.join(__dirname, 'database', 'sprint4-support-system.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✓ [${i + 1}/${statements.length}] Success`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⊙ [${i + 1}/${statements.length}] Already exists (skipped)`);
        } else {
          console.log(`✗ [${i + 1}/${statements.length}] Error: ${error.message}`);
        }
      }
    }

    // Verify tables
    console.log('\nVerifying tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('support_requests', 'support_notes')
      ORDER BY table_name
    `;

    console.log('Created tables:', tables);

    if (tables.length === 2) {
      console.log('\n✓ Sprint 4 migration completed successfully!');
    } else {
      console.log('\n⚠ Warning: Some tables may not have been created');
    }

  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
