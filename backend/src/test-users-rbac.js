const http = require('http');

// Helper
function makeRequest(path, method, token, bodyData) {
    return new Promise((resolve) => {
        const body = bodyData ? JSON.stringify(bodyData) : '';
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Length': body.length
            }
        };

        const req = http.request(options, (res) => {
            let resBody = '';
            res.on('data', (chunk) => resBody += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(resBody || '{}') }));
        });

        if (body) req.write(body);
        req.end();
    });
}

function login(email, password) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ email, password });
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
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
    console.log('--- Testing Users Management RBAC ---\n');

    const adminKids = await login('admin.kids@example.com', 'password123');
    const systemAdmin = await login('system@example.com', 'password123');

    // 1. UnAuthorized Access (Admin Kids trying to list users)
    console.log('1. Admin Kids List Users (GET /users)');
    const failRes = await makeRequest('/api/users', 'GET', adminKids.data.token);
    console.log(`   Status: ${failRes.status} (Expected 403)`);
    if (failRes.status === 403) console.log('✅ Correctly Blocked');
    else console.log('❌ Failed to Block');

    // 2. Authorized Create (System Admin)
    console.log('\n2. System Admin Create User (POST /users)');
    const userData = {
        email: 'testuser@example.com',
        password: 'password123',
        name: 'Test Role User',
        role: 'ADMIN_NEXT'
    };

    const createRes = await makeRequest('/api/users', 'POST', systemAdmin.data.token, userData);
    console.log(`   Status: ${createRes.status} (Expected 201)`);

    if (createRes.status === 201) {
        console.log('✅ Created Successfully');
        const userId = createRes.body.data.id;

        // 3. Update Role
        console.log('\n3. System Admin Update Role (PUT /users/:id)');
        const updateRes = await makeRequest(`/api/users/${userId}`, 'PUT', systemAdmin.data.token, { role: 'CUSTOMER' });
        console.log(`   Status: ${updateRes.status} (Expected 200)`);
        console.log(`   New Role: ${updateRes.body.data.role} (Expected CUSTOMER)`);

        // 4. Delete
        console.log('\n4. System Admin Delete User (DELETE /users/:id)');
        const delRes = await makeRequest(`/api/users/${userId}`, 'DELETE', systemAdmin.data.token);
        console.log(`   Status: ${delRes.status} (Expected 200)`);
    } else {
        console.log('❌ Creation Failed:', createRes.body);
    }
}

runTests();
