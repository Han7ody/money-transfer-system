const http = require('http');

// First, let's list all admins to see what we have
const listAdmins = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin-management/admins',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE', // You'll need to replace this
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('📋 Current Admins in New System:');
        console.log(data);
        resolve(JSON.parse(data));
      });
    });

    req.on('error', reject);
    req.end();
  });
};

// Check what's in the database
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkAdmins() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking Admin Users in Database...\n');
    
    const admins = await client.query(`
      SELECT 
        au.id,
        au.username,
        au.full_name,
        au.email,
        au.status,
        ar.role_name
      FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      ORDER BY au.id
    `);
    
    console.log(`Found ${admins.rows.length} admins in admin_users table:\n`);
    
    admins.rows.forEach(admin => {
      console.log(`ID: ${admin.id}`);
      console.log(`  Username: ${admin.username}`);
      console.log(`  Name: ${admin.full_name}`);
      console.log(`  Email: ${admin.email}`);
      console.log(`  Role: ${admin.role_name}`);
      console.log(`  Status: ${admin.status}`);
      console.log('');
    });
    
    if (admins.rows.length === 0) {
      console.log('⚠️  No admins found in the new system!');
      console.log('Run: node seed-sprint5-admin-system.js');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAdmins();
