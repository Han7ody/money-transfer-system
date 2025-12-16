const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkWhitelist() {
  try {
    console.log('Checking IP whitelist entries...\n');
    
    const entries = await prisma.$queryRaw`
      SELECT id, ip_address, description, is_active, created_at
      FROM ip_whitelist
      ORDER BY created_at DESC
    `;

    console.log(`Found ${entries.length} entries:\n`);
    entries.forEach(entry => {
      console.log(`ID: ${entry.id}`);
      console.log(`IP: ${entry.ip_address}`);
      console.log(`Description: ${entry.description || 'N/A'}`);
      console.log(`Active: ${entry.is_active}`);
      console.log(`Created: ${entry.created_at}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkWhitelist();
