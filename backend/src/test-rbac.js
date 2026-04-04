const http = require('http');

// Helper to make requests
function makeRequest(path, token) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.end();
    });
}

// Helper to login
function login(email, password) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ email, password });
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log('--- Testing Security Access ---\n');

    // 1. Test Login & Access for ADMIN_KIDS
    console.log('1. Testing ADMIN_KIDS (Should access Kids, Fail Next)');
    const kidsAdmin = await login('admin.kids@example.com', 'password123');
    console.log('   Logged in:', kidsAdmin.success);

    if (kidsAdmin.success) {
        const kidsToken = kidsAdmin.data.token;

        const kidsAccess = await makeRequest('/api/dashboard/kids', kidsToken);
        console.log('   Access Kids Dashboard:', kidsAccess.status === 200 ? '✅ Allowed' : '❌ Denied', `(${kidsAccess.status})`);

        const nextAccess = await makeRequest('/api/dashboard/next', kidsToken);
        console.log('   Access Next Dashboard:', nextAccess.status === 403 ? '✅ Correctly Denied' : '❌ Wrongly Allowed', `(${nextAccess.status})`);
    }

    console.log('\n2. Testing SYSTEM_ADMIN (Should access ALL)');
    const sysAdmin = await login('system@example.com', 'password123');
    console.log('   Logged in:', sysAdmin.success);

    if (sysAdmin.success) {
        const sysToken = sysAdmin.data.token;

        const kidsAccess = await makeRequest('/api/dashboard/kids', sysToken);
        console.log('   Access Kids Dashboard:', kidsAccess.status === 200 ? '✅ Allowed' : '❌ Denied', `(${kidsAccess.status})`);

        const nextAccess = await makeRequest('/api/dashboard/next', sysToken);
        console.log('   Access Next Dashboard:', nextAccess.status === 200 ? '✅ Allowed' : '❌ Denied', `(${nextAccess.status})`);

        const sysAccess = await makeRequest('/api/dashboard/system', sysToken);
        console.log('   Access System Dashboard:', sysAccess.status === 200 ? '✅ Allowed' : '❌ Denied', `(${sysAccess.status})`);
    }
}

runTests();
