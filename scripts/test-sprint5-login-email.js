const http = require('http');

// Test with EMAIL instead of username
const data = JSON.stringify({
  email: 'admin@rasid.com',  // Using email field
  password: 'Admin@123'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin-management/admins/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Testing Sprint 5 Admin Login with EMAIL...\n');

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}\n`);
    
    try {
      const parsed = JSON.parse(responseData);
      
      if (parsed.success) {
        console.log('✅ LOGIN SUCCESSFUL WITH EMAIL!');
        console.log(`\nAdmin: ${parsed.data.admin.username}`);
        console.log(`Email: ${parsed.data.admin.email}`);
        console.log(`Role: ${parsed.data.admin.roleName}`);
        console.log(`Permissions: ${parsed.data.admin.permissions.length} permissions`);
      } else {
        console.log('❌ LOGIN FAILED');
        console.log('Message:', parsed.message);
      }
    } catch (e) {
      console.log('Raw Response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(data);
req.end();
