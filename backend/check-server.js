/**
 * Quick script to check if backend server is running
 * Usage: node check-server.js
 */

const http = require('http');

const checkServer = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/health',
    method: 'GET',
    timeout: 2000
  };

  const req = http.request(options, (res) => {
    console.log('✅ Backend server is running!');
    console.log(`Status: ${res.statusCode}`);
    res.on('data', (data) => {
      console.log('Response:', data.toString());
    });
    process.exit(0);
  });

  req.on('error', (error) => {
    console.log('❌ Backend server is NOT running');
    console.log('Error:', error.message);
    console.log('\n💡 To start the server, run:');
    console.log('   cd backend');
    console.log('   npm run dev');
    process.exit(1);
  });

  req.on('timeout', () => {
    console.log('⏱️  Request timeout - server might be slow or not responding');
    req.destroy();
    process.exit(1);
  });

  req.end();
};

checkServer();
