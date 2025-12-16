// Reset admin password
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔄 Resetting admin password...\n');
    
    const newPassword = 'Admin@123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    const updatedAdmin = await prisma.user.update({
      where: {
        email: 'superadmin@moneytransfer.com'
      },
      data: {
        passwordHash: hashedPassword
      }
    });

    console.log('✅ Admin password reset successfully!');
    console.log('📧 Email: superadmin@moneytransfer.com');
    console.log('🔑 Password: Admin@123');
    
    // Test the new password
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log('✅ Password verification test:', isValid);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();