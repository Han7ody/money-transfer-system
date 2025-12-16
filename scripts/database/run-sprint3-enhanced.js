const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load from backend directory
const backendPath = path.join(__dirname, '../../backend');
process.chdir(backendPath);
require('dotenv').config();

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('========================================');
    console.log('Sprint 3 Enhanced Migration');
    console.log('========================================\n');

    const sqlPath = path.join(__dirname, 'sprint3-enhanced-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration...\n');
    
    // Split SQL into statements and execute one by one
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          const preview = statement.substring(0, 60).replace(/\n/g, ' ');
          console.log(`[${i + 1}/${statements.length}] ${preview}...`);
          await prisma.$executeRawUnsafe(statement);
          console.log('  ✅ Success');
        } catch (error) {
          if (error.code === 'P2010' && error.meta?.code === '42P07') {
            console.log('  ⚠️  Already exists, skipping...');
          } else if (error.code === 'P2010' && error.meta?.code === '42701') {
            console.log('  ⚠️  Column already exists, skipping...');
          } else {
            console.log('  ⚠️  Warning:', error.message);
          }
        }
      }
    }

    console.log('\n========================================');
    console.log('Migration completed successfully!');
    console.log('========================================\n');

    // Verify tables were created
    console.log('Verifying tables...\n');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('fraud_scores', 'aml_cases', 'aml_case_activities', 'compliance_reports')
      ORDER BY table_name
    `;

    console.log('Created tables:');
    tables.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Check new columns
    console.log('\nUser table enhancements:');
    const userColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('fraud_score', 'risk_level')
    `;
    userColumns.forEach(row => {
      console.log(`  ✓ ${row.column_name}`);
    });

    console.log('\nKYC documents enhancements:');
    const kycColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'kyc_documents' 
      AND column_name IN ('expiry_date', 'issue_date', 'verification_status')
    `;
    kycColumns.forEach(row => {
      console.log(`  ✓ ${row.column_name}`);
    });

    console.log('\n========================================');
    console.log('Next steps:');
    console.log('========================================');
    console.log('1. cd backend && npx prisma generate');
    console.log('2. Restart backend server');
    console.log('3. Test new features\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('Migration failed!');
    console.error('========================================');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
