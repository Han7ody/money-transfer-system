const { execSync } = require('child_process');
const path = require('path');

// Change to backend directory and run prisma db push
const backendDir = path.join(__dirname, '../../backend');

try {
  console.log('Updating database schema...');
  execSync('npx prisma db push', {
    cwd: backendDir,
    stdio: 'inherit'
  });
  console.log('✅ Schema updated successfully!');
} catch (error) {
  console.error('❌ Error updating schema:', error.message);
  process.exit(1);
}
