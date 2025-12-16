// scripts/test-kyc-setup.js
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Testing KYC setup...\n');

  try {
    // Test 1: Check if KYC tables exist
    console.log('1. Checking KYC tables...');
    
    try {
      const noteCount = await prisma.$queryRaw`SELECT COUNT(*) FROM kyc_review_notes`;
      console.log('   ✅ kyc_review_notes table exists');
    } catch (e) {
      console.log('   ❌ kyc_review_notes table missing');
    }

    try {
      const logCount = await prisma.$queryRaw`SELECT COUNT(*) FROM kyc_action_logs`;
      console.log('   ✅ kyc_action_logs table exists');
    } catch (e) {
      console.log('   ❌ kyc_action_logs table missing');
    }

    try {
      const matchCount = await prisma.$queryRaw`SELECT COUNT(*) FROM fraud_matches`;
      console.log('   ✅ fraud_matches table exists');
    } catch (e) {
      console.log('   ❌ fraud_matches table missing');
    }

    // Test 2: Check users with KYC status
    console.log('\n2. Checking users with KYC submissions...');
    const pendingKyc = await prisma.user.count({
      where: { kycStatus: 'PENDING' }
    });
    console.log(`   Found ${pendingKyc} users with PENDING KYC status`);

    const approvedKyc = await prisma.user.count({
      where: { kycStatus: 'APPROVED' }
    });
    console.log(`   Found ${approvedKyc} users with APPROVED KYC status`);

    // Test 3: Check KYC documents
    console.log('\n3. Checking KYC documents...');
    const docCount = await prisma.kycDocument.count();
    console.log(`   Found ${docCount} KYC documents in database`);

    console.log('\n✅ KYC setup test completed!');
  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
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
