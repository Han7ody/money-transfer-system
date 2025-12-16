const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('========================================');
    console.log('Sprint 2: AML Tables Migration');
    console.log('========================================\n');

    const sqlPath = path.join(__dirname, '..', 'scripts', 'database', 'sprint2-aml-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration...\n');
    
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          const preview = statement.substring(0, 50).replace(/\n/g, ' ');
          console.log(`[${i + 1}/${statements.length}] ${preview}...`);
          await prisma.$executeRawUnsafe(statement);
        } catch (error) {
          if (error.code === 'P2010' && error.meta?.code === '42P07') {
            console.log(`  ⚠ Already exists, skipping...`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('\n========================================');
    console.log('Migration completed successfully!');
    console.log('========================================\n');
    console.log('New table created:');
    console.log('- aml_alerts\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('Migration failed!');
    console.error('========================================');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
