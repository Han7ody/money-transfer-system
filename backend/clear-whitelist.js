const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function clearWhitelist() {
  try {
    console.log('Clearing IP whitelist...\n');
    
    await prisma.$executeRaw`DELETE FROM ip_whitelist`;
    
    console.log('✅ IP whitelist cleared successfully!');
    console.log('All IPs are now allowed to access the admin panel.\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearWhitelist();
