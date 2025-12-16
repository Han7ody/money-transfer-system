const http = require('http');

const data = JSON.stringify({
  username: 'superadmin',
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

console.log('🧪 Testing Sprint 5 Admin Login...\n');

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}\n`);
    
    try {
      const parsed = JSON.parse(responseData);
      console.log('Response:');
      console.log(JSON.stringify(parsed, null, 2));
      
      if (parsed.success) {
        console.log('\n✅ LOGIN SUCCESSFUL!');
        console.log(`\nAdmin: ${parsed.data.admin.username}`);
        console.log(`Role: ${parsed.data.admin.roleName}`);
        console.log(`Permissions: ${parsed.data.admin.permissions.length} permissions`);
        console.log(`\nToken: ${parsed.data.token.substring(0, 50)}...`);
      } else {
        console.log('\n❌ LOGIN FAILED');
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
