const { execSync } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, '../backend');

try {
  console.log('Pushing Sprint-2 schema changes to database...');
  execSync('npx prisma db push', {
    cwd: backendDir,
    stdio: 'inherit'
  });
  console.log('✅ Schema updated successfully!');
} catch (error) {
  console.error('❌ Error updating schema:', error.message);
  process.exit(1);
}
