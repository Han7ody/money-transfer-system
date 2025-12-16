require('dotenv').config({ path: './backend/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addColumns() {
  try {
    console.log('Adding fraud_score and risk_level columns to users table...\n');
    console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'));

    // Add fraud_score column
    try {
      await prisma.$executeRaw`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0
      `;
      console.log('✓ Added fraud_score column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⊙ fraud_score column already exists');
      } else {
        throw error;
      }
    }

    // Add risk_level column
    try {
      await prisma.$executeRaw`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) DEFAULT 'LOW'
      `;
      console.log('✓ Added risk_level column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⊙ risk_level column already exists');
      } else {
        throw error;
      }
    }

    // Verify columns
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('fraud_score', 'risk_level')
      ORDER BY column_name
    `;

    console.log('\nVerification:');
    console.log(result);

    if (result.length === 2) {
      console.log('\n✓ Migration completed successfully!');
    } else {
      console.log('\n⚠ Warning: Expected 2 columns, found', result.length);
    }

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addColumns();
