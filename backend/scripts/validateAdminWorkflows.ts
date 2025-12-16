/**
 * Admin Workflow Validation Script
 * Tests state machine transitions, maker-checker, and audit logging
 */

import { transactionStateMachine } from '../src/services/stateMachine/TransactionStateMachine';
import { kycStateMachine } from '../src/services/stateMachine/KYCStateMachine';
import { TransactionStatus, KycStatus } from '@prisma/client';

console.log('========================================');
console.log('Admin Workflow Validation');
console.log('========================================\n');

let passedTests = 0;
let failedTests = 0;

function test(name: string, fn: () => Promise<boolean>) {
  return fn()
    .then(result => {
      if (result) {
        console.log(`✅ PASS: ${name}`);
        passedTests++;
      } else {
        console.log(`❌ FAIL: ${name}`);
        failedTests++;
      }
    })
    .catch(error => {
      console.log(`❌ ERROR: ${name} - ${error.message}`);
      failedTests++;
    });
}

async function runTests() {
  console.log('--- Transaction State Machine Tests ---\n');

  // Test 1: Valid transition PENDING -> UNDER_REVIEW
  await test('PENDING -> UNDER_REVIEW (valid)', async () => {
    const result = await transactionStateMachine.validateTransition(
      TransactionStatus.PENDING,
      TransactionStatus.UNDER_REVIEW,
      { userId: '1', reason: 'Moving to review' }
    );
    return result.valid === true;
  });

  // Test 2: Invalid transition PENDING -> COMPLETED
  await test('PENDING -> COMPLETED (invalid)', async () => {
    const result = await transactionStateMachine.validateTransition(
      TransactionStatus.PENDING,
      TransactionStatus.COMPLETED,
      { userId: '1', reason: 'Test' }
    );
    return result.valid === false;
  });

  // Test 3: Invalid transition PENDING -> APPROVED (must go through UNDER_REVIEW)
  await test('PENDING -> APPROVED (invalid - must go through UNDER_REVIEW)', async () => {
    const result = await transactionStateMachine.validateTransition(
      TransactionStatus.PENDING,
      TransactionStatus.APPROVED,
      { userId: '1', reason: 'Test' }
    );
    return result.valid === false;
  });

  // Test 4: Rejection requires reason
  await test('PENDING -> REJECTED without reason (invalid)', async () => {
    const result = await transactionStateMachine.validateTransition(
      TransactionStatus.PENDING,
      TransactionStatus.REJECTED,
      { userId: '1', reason: '' }
    );
    return result.valid === false;
  });

  // Test 5: Rejection with reason
  await test('PENDING -> REJECTED with reason (valid)', async () => {
    const result = await transactionStateMachine.validateTransition(
      TransactionStatus.PENDING,
      TransactionStatus.REJECTED,
      { userId: '1', reason: 'Suspicious activity detected' }
    );
    return result.valid === true;
  });

  // Test 6: Valid flow UNDER_REVIEW -> APPROVED
  await test('UNDER_REVIEW -> APPROVED (valid)', async () => {
    const result = await transactionStateMachine.validateTransition(
      TransactionStatus.UNDER_REVIEW,
      TransactionStatus.APPROVED,
      { userId: '1', reason: 'Approved after review' }
    );
    return result.valid === true;
  });

  // Test 7: COMPLETED is terminal
  await test('COMPLETED -> PENDING (invalid - terminal state)', async () => {
    const result = await transactionStateMachine.validateTransition(
      TransactionStatus.COMPLETED,
      TransactionStatus.PENDING,
      { userId: '1', reason: 'Test' }
    );
    return result.valid === false;
  });

  console.log('\n--- KYC State Machine Tests ---\n');

  // Test 8: Valid KYC transition PENDING -> APPROVED
  await test('KYC: PENDING -> APPROVED with reason (valid)', async () => {
    const result = await kycStateMachine.validateTransition(
      KycStatus.PENDING,
      KycStatus.APPROVED,
      { userId: '1', reason: 'All documents verified' }
    );
    return result.valid === true;
  });

  // Test 9: KYC approval requires reason
  await test('KYC: PENDING -> APPROVED without reason (invalid)', async () => {
    const result = await kycStateMachine.validateTransition(
      KycStatus.PENDING,
      KycStatus.APPROVED,
      { userId: '1', reason: '' }
    );
    return result.valid === false;
  });

  // Test 10: KYC rejection with reason
  await test('KYC: PENDING -> REJECTED with reason (valid)', async () => {
    const result = await kycStateMachine.validateTransition(
      KycStatus.PENDING,
      KycStatus.REJECTED,
      { userId: '1', reason: 'Documents not clear' }
    );
    return result.valid === true;
  });

  // Test 11: KYC rejection requires reason
  await test('KYC: PENDING -> REJECTED without reason (invalid)', async () => {
    const result = await kycStateMachine.validateTransition(
      KycStatus.PENDING,
      KycStatus.REJECTED,
      { userId: '1', reason: '' }
    );
    return result.valid === false;
  });

  // Test 12: KYC resubmission allowed
  await test('KYC: REJECTED -> PENDING (valid - resubmission)', async () => {
    const result = await kycStateMachine.validateTransition(
      KycStatus.REJECTED,
      KycStatus.PENDING,
      { userId: '1', reason: 'User resubmitted documents' }
    );
    return result.valid === true;
  });

  // Test 13: Invalid KYC transition NOT_SUBMITTED -> APPROVED
  await test('KYC: NOT_SUBMITTED -> APPROVED (invalid)', async () => {
    const result = await kycStateMachine.validateTransition(
      KycStatus.NOT_SUBMITTED,
      KycStatus.APPROVED,
      { userId: '1', reason: 'Test' }
    );
    return result.valid === false;
  });

  console.log('\n========================================');
  console.log('Test Results');
  console.log('========================================');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Total: ${passedTests + failedTests}`);
  console.log('========================================\n');

  if (failedTests > 0) {
    console.log('⚠️  Some tests failed. Please review the state machine configuration.');
    process.exit(1);
  } else {
    console.log('✅ All tests passed! State machines are working correctly.');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
