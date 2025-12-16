const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function addLocalhostIPs() {
  try {
    console.log('Adding localhost IPs to whitelist...\n');
    
    // Add IPv6 localhost
    await prisma.$executeRaw`
      INSERT INTO ip_whitelist (ip_address, description, is_active)
      VALUES ('::1', 'IPv6 Localhost', true)
      ON CONFLICT (ip_address) DO UPDATE
      SET is_active = true, description = 'IPv6 Localhost'
    `;
    console.log('✅ Added ::1 (IPv6 localhost)');
    
    // Add IPv4 localhost
    await prisma.$executeRaw`
      INSERT INTO ip_whitelist (ip_address, description, is_active)
      VALUES ('127.0.0.1', 'IPv4 Localhost', true)
      ON CONFLICT (ip_address) DO UPDATE
      SET is_active = true, description = 'IPv4 Localhost'
    `;
    console.log('✅ Added 127.0.0.1 (IPv4 localhost)');
    
    console.log('\n✅ Localhost IPs added successfully!');
    console.log('You can now access the admin panel from localhost.\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addLocalhostIPs();
