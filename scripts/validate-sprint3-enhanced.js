const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function validateSprint3Enhanced() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Validating Sprint 3 Enhanced Implementation...\n');
    await client.connect();

    let passed = 0;
    let failed = 0;

    // Test 1: Check new tables exist
    console.log('📋 Test 1: Checking new tables...');
    const tables = ['fraud_scores', 'aml_cases', 'aml_case_activities', 'compliance_reports'];
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`  ✅ Table '${table}' exists`);
        passed++;
      } else {
        console.log(`  ❌ Table '${table}' missing`);
        failed++;
      }
    }

    // Test 2: Check user table enhancements
    console.log('\n📋 Test 2: Checking user table enhancements...');
    const userColumns = ['fraud_score', 'risk_level'];
    for (const column of userColumns) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name = $1
        )
      `, [column]);
      
      if (result.rows[0].exists) {
        console.log(`  ✅ Column 'users.${column}' exists`);
        passed++;
      } else {
        console.log(`  ❌ Column 'users.${column}' missing`);
        failed++;
      }
    }

    // Test 3: Check kyc_documents enhancements
    console.log('\n📋 Test 3: Checking kyc_documents enhancements...');
    const kycColumns = ['expiry_date', 'issue_date', 'verification_status'];
    for (const column of kycColumns) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'kyc_documents' 
          AND column_name = $1
        )
      `, [column]);
      
      if (result.rows[0].exists) {
        console.log(`  ✅ Column 'kyc_documents.${column}' exists`);
        passed++;
      } else {
        console.log(`  ❌ Column 'kyc_documents.${column}' missing`);
        failed++;
      }
    }

    // Test 4: Check indexes
    console.log('\n📋 Test 4: Checking indexes...');
    const indexes = [
      'idx_fraud_scores_user',
      'idx_aml_cases_user',
      'idx_aml_cases_status',
      'idx_case_activities_case'
    ];
    for (const index of indexes) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE indexname = $1
        )
      `, [index]);
      
      if (result.rows[0].exists) {
        console.log(`  ✅ Index '${index}' exists`);
        passed++;
      } else {
        console.log(`  ⚠️  Index '${index}' missing (optional)`);
      }
    }

    // Test 5: Check aml_alerts case_id column
    console.log('\n📋 Test 5: Checking aml_alerts enhancements...');
    const amlAlertsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'aml_alerts'
      )
    `);
    
    if (amlAlertsCheck.rows[0].exists) {
      const caseIdColumn = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'aml_alerts' 
          AND column_name = 'case_id'
        )
      `);
      
      if (caseIdColumn.rows[0].exists) {
        console.log('  ✅ Column aml_alerts.case_id exists');
        passed++;
      } else {
        console.log('  ❌ Column aml_alerts.case_id missing');
        failed++;
      }
    } else {
      console.log('  ⚠️  Table aml_alerts not found (Sprint 2 not run)');
    }

    // Test 6: Check function exists
    console.log('\n📋 Test 6: Checking helper functions...');
    const functionCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'generate_case_number'
      )
    `);
    
    if (functionCheck.rows[0].exists) {
      console.log('  ✅ Function generate_case_number() exists');
      passed++;
    } else {
      console.log('  ⚠️  Function generate_case_number() missing (will use fallback)');
    }

    // Test 7: Test data insertion
    console.log('\n📋 Test 7: Testing data insertion...');
    try {
      // Try to insert a test fraud score
      await client.query(`
        INSERT INTO fraud_scores (user_id, score, risk_level, factors)
        SELECT id, 0, 'LOW', '{}'::jsonb 
        FROM users 
        LIMIT 1
        ON CONFLICT DO NOTHING
      `);
      console.log('  ✅ Can insert into fraud_scores');
      passed++;
    } catch (error) {
      console.log('  ❌ Cannot insert into fraud_scores:', error.message);
      failed++;
    }

    // Test 8: Check table counts
    console.log('\n📋 Test 8: Checking table structure...');
    const tableChecks = [
      { table: 'fraud_scores', minColumns: 6 },
      { table: 'aml_cases', minColumns: 12 },
      { table: 'aml_case_activities', minColumns: 7 },
      { table: 'compliance_reports', minColumns: 8 }
    ];

    for (const check of tableChecks) {
      const result = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.columns
        WHERE table_name = $1
      `, [check.table]);
      
      const count = parseInt(result.rows[0].count);
      if (count >= check.minColumns) {
        console.log(`  ✅ Table '${check.table}' has ${count} columns (expected >= ${check.minColumns})`);
        passed++;
      } else {
        console.log(`  ❌ Table '${check.table}' has ${count} columns (expected >= ${check.minColumns})`);
        failed++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Validation Summary');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    console.log('='.repeat(50));

    if (failed === 0) {
      console.log('\n🎉 All tests passed! Sprint 3 Enhanced is ready to use.');
      console.log('\n📝 Next steps:');
      console.log('  1. Restart backend server');
      console.log('  2. Access /admin/compliance/dashboard');
      console.log('  3. Test report generation');
      console.log('  4. Create test AML cases\n');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
      console.log('   Run the migration script again if needed:\n');
      console.log('   node scripts/database/run-sprint3-enhanced.js\n');
    }

  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

validateSprint3Enhanced();
