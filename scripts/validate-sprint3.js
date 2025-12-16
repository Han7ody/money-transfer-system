// scripts/validate-sprint3.js
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Sprint 3 Implementation...\n');

const requiredFiles = {
  backend: [
    'backend/src/services/kycService.ts',
    'backend/src/services/fraudDetectionService.ts',
    'backend/src/controllers/kycController.ts',
    'backend/src/routes/kycRoutes.ts'
  ],
  frontend: [
    'frontend/src/app/admin/users/kyc-queue/page.tsx',
    'frontend/src/app/admin/users/kyc-review/[id]/page.tsx',
    'frontend/src/components/admin/kyc/KycActionModal.tsx',
    'frontend/src/components/admin/kyc/DocumentViewer.tsx',
    'frontend/src/components/admin/kyc/NotesPanel.tsx',
    'frontend/src/components/admin/kyc/FraudMatchesPanel.tsx'
  ],
  scripts: [
    'scripts/database/add-kyc-fraud-tables.js',
    'scripts/test-kyc-setup.js'
  ],
  docs: [
    'docs/features/KYC_FRAUD_ENGINE.md',
    'docs/SPRINT3_SETUP.md',
    'SPRINT3_IMPLEMENTATION_SUMMARY.md'
  ]
};

let allFilesExist = true;
let totalFiles = 0;
let existingFiles = 0;

console.log('📁 Checking Backend Files...');
requiredFiles.backend.forEach(file => {
  totalFiles++;
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
    existingFiles++;
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📁 Checking Frontend Files...');
requiredFiles.frontend.forEach(file => {
  totalFiles++;
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
    existingFiles++;
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📁 Checking Scripts...');
requiredFiles.scripts.forEach(file => {
  totalFiles++;
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
    existingFiles++;
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📁 Checking Documentation...');
requiredFiles.docs.forEach(file => {
  totalFiles++;
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
    existingFiles++;
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📊 Validation Summary');
console.log('═══════════════════════════════════════');
console.log(`Total Files Expected: ${totalFiles}`);
console.log(`Files Found: ${existingFiles}`);
console.log(`Files Missing: ${totalFiles - existingFiles}`);

if (allFilesExist) {
  console.log('\n✅ All Sprint 3 files are present!');
  console.log('\n📋 Next Steps:');
  console.log('1. Run: node scripts/database/add-kyc-fraud-tables.js');
  console.log('2. Run: cd backend && npx prisma generate');
  console.log('3. Run: node scripts/test-kyc-setup.js');
  console.log('4. Start backend: cd backend && npm run dev');
  console.log('5. Start frontend: cd frontend && npm run dev');
  console.log('6. Access: http://localhost:3000/admin/users/kyc-queue');
  process.exit(0);
} else {
  console.log('\n❌ Some files are missing. Please check the implementation.');
  process.exit(1);
}
