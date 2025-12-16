// scripts/database/add-kyc-fraud-tables.js
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Adding KYC and Fraud Detection tables...');

  try {
    // Check if tables already exist by trying to query them
    try {
      await prisma.$queryRaw`SELECT 1 FROM kyc_review_notes LIMIT 1`;
      console.log('✅ Tables already exist, skipping creation');
      return;
    } catch (error) {
      // Tables don't exist, continue with creation
    }

    // Create KYC Review Notes table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS kyc_review_notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        admin_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ Created kyc_review_notes table');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_kyc_note_user ON kyc_review_notes(user_id);
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_kyc_note_admin ON kyc_review_notes(admin_id);
    `;

    // Create KYC Action Log table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS kyc_action_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        admin_id INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL,
        reason TEXT,
        old_status VARCHAR(50),
        new_status VARCHAR(50),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ Created kyc_action_logs table');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_kyc_action_user ON kyc_action_logs(user_id);
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_kyc_action_admin ON kyc_action_logs(admin_id);
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_kyc_action_type ON kyc_action_logs(action);
    `;

    // Create Fraud Matches table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS fraud_matches (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        matched_user_id INTEGER NOT NULL REFERENCES users(id),
        match_type VARCHAR(50) NOT NULL,
        match_value VARCHAR(500),
        score INTEGER NOT NULL,
        is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
        resolved_by INTEGER,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ Created fraud_matches table');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_fraud_match_user ON fraud_matches(user_id);
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_fraud_match_matched ON fraud_matches(matched_user_id);
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_fraud_match_type ON fraud_matches(match_type);
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_fraud_match_resolved ON fraud_matches(is_resolved);
    `;

    console.log('✅ All KYC and Fraud Detection tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
