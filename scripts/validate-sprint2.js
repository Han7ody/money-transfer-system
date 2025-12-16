const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function validateSprint2() {
  console.log('🔍 Validating Sprint-2 Implementation...\n');

  try {
    // Check SmtpConfig table
    console.log('1. Checking SmtpConfig table...');
    const smtpCount = await prisma.smtpConfig.count();
    console.log(`   ✓ SmtpConfig table exists (${smtpCount} records)\n`);

    // Check EmailTemplate table
    console.log('2. Checking EmailTemplate table...');
    const templateCount = await prisma.emailTemplate.count();
    console.log(`   ✓ EmailTemplate table exists (${templateCount} records)`);
    
    if (templateCount > 0) {
      const templates = await prisma.emailTemplate.findMany({ select: { name: true, displayName: true } });
      templates.forEach(t => console.log(`      - ${t.displayName} (${t.name})`));
    }
    console.log('');

    // Check Policy table
    console.log('3. Checking Policy table...');
    const policyCount = await prisma.policy.count();
    console.log(`   ✓ Policy table exists (${policyCount} records)`);
    
    if (policyCount > 0) {
      const policies = await prisma.policy.findMany({ select: { type: true, title: true, isPublished: true } });
      policies.forEach(p => console.log(`      - ${p.title} (${p.type}) ${p.isPublished ? '✓ Published' : '✗ Draft'}`));
    }
    console.log('');

    // Check Currency table
    console.log('4. Checking Currency table...');
    const currencyCount = await prisma.currency.count();
    console.log(`   ✓ Currency table exists (${currencyCount} records)`);
    
    if (currencyCount > 0) {
      const currencies = await prisma.currency.findMany({ 
        select: { code: true, name: true, isActive: true },
        take: 5
      });
      currencies.forEach(c => console.log(`      - ${c.code}: ${c.name} ${c.isActive ? '✓' : '✗'}`));
      if (currencyCount > 5) console.log(`      ... and ${currencyCount - 5} more`);
    }
    console.log('');

    console.log('✅ All Sprint-2 database tables validated successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - SMTP Configs: ${smtpCount}`);
    console.log(`   - Email Templates: ${templateCount}`);
    console.log(`   - Policies: ${policyCount}`);
    console.log(`   - Currencies: ${currencyCount}`);
    console.log('\n🚀 Sprint-2 backend is ready to use!');

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    console.error('\nPlease ensure:');
    console.error('1. Database schema has been pushed (npm run prisma:push)');
    console.error('2. Seed scripts have been run');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

validateSprint2();
