// scripts/add-profile-picture.js
const path = require('path');
const { PrismaClient } = require('../backend/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function addProfilePictureColumn() {
  try {
    console.log('Adding profile_picture column to users table...');
    
    await prisma.$executeRaw`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255);
    `;
    
    console.log('✅ Successfully added profile_picture column');
  } catch (error) {
    console.error('❌ Error adding profile_picture column:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addProfilePictureColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
