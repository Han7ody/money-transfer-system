const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:han7ody@localhost:5432/money_transfer_db?schema=public'
    }
  }
});

async function runMigration() {
  try {
    console.log('========================================');
    console.log('Running Sprint 3 Enhanced Migration');
    console.log('========================================\n');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'database', 'sprint3-enhanced-tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split by semicolons and filter out comments and empty lines
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      try {
        await prisma.$executeRawUnsafe(statement);
        successCount++;
        console.log(`✓ [${i + 1}/${statements.length}] Success`);
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate')) {
          console.log(`⊙ [${i + 1}/${statements.length}] Already exists (skipped)`);
          successCount++;
        } else {
          console.log(`✗ [${i + 1}/${statements.length}] Error: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log('\n========================================');
    console.log('Migration Summary');
    console.log('========================================');
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log('========================================\n');

    // Verify the columns were added
    console.log('Verifying users table columns...');
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('fraud_score', 'risk_level')
      ORDER BY column_name
    `;
    
    console.log('Found columns:', result);

    if (result.length === 2) {
      console.log('\n✓ Migration completed successfully!');
      console.log('  - fraud_score column added');
      console.log('  - risk_level column added');
    } else {
      console.log('\n⚠ Warning: Some columns may not have been added');
    }

  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
