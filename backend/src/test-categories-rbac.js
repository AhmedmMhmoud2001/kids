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
                'Authorization': token ? `Bearer ${token}` : '', // Allow no token for public
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
    console.log('--- Testing Categories RBAC ---\n');

    // 1. Public Access
    console.log('1. Public Access (GET /categories)');
    const publicRes = await makeRequest('/api/categories', 'GET');
    console.log(`   Status: ${publicRes.status} (Expected 200)`);
    console.log(`   Count: ${publicRes.body.data ? publicRes.body.data.length : 0}`);

    // 2. Login
    const adminKids = await login('admin.kids@example.com', 'password123');
    const systemAdmin = await login('system@example.com', 'password123');

    // 3. Unauthorized Create (Admin Kids)
    console.log('\n2. Admin Kids Create (POST /categories)');
    const failRes = await makeRequest('/api/categories', 'POST', adminKids.data.token, { name: 'FailCat', slug: 'fail-cat' });
    console.log(`   Status: ${failRes.status} (Expected 403)`);
    if (failRes.status === 403) console.log('✅ Correctly Blocked');
    else console.log('❌ Failed to Block');

    // 4. Authorized Create (System Admin)
    console.log('\n3. System Admin Create (POST /categories)');
    const successRes = await makeRequest('/api/categories', 'POST', systemAdmin.data.token, { name: 'SystemCat', slug: 'system-cat', image: 'test.png' });
    console.log(`   Status: ${successRes.status} (Expected 201)`);
    if (successRes.status === 201) console.log('✅ Created Successfully');
    else console.log('❌ Creation Failed', successRes.body);

    // Clean up
    if (successRes.status === 201) {
        const id = successRes.body.data.id;
        await makeRequest(`/api/categories/${id}`, 'DELETE', systemAdmin.data.token);
    }
}

runTests();
