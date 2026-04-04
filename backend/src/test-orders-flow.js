const http = require('http');

// Helper to make requests
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
                'Authorization': `Bearer ${token}`,
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
    console.log('--- Testing Orders Flow ---\n');

    // 1. Logins
    const customer = await login('customer@example.com', 'password123');
    const adminKids = await login('admin.kids@example.com', 'password123');
    const adminNext = await login('admin.next@example.com', 'password123');

    if (!customer.success || !adminKids.success || !adminNext.success) {
        console.error('Login failed for one or more users');
        return;
    }

    console.log('✅ Logins successful');

    // 2. Fetch Products to use
    // Assuming we have products. Check /api/products
    // We need at least one KIDS and one NEXT product.
    // Let's assume some exist or created by seed.

    // We can use a simple hack: create them via admin if needed? 
    // Or just try to list them.
    // For now, let's try creating an order with IDs 1 and 2 (assuming seed created them).
    // Better: Fetch products first using System Admin or just public endpoint?
    // Public endpoint /api/products/ should list them.

    const productsRes = await makeRequest('/api/products', 'GET', customer.data.token);
    const products = productsRes.body.data;

    if (!products || products.length === 0) {
        console.error('No products found to order');
        return;
    }

    const kidsProduct = products.find(p => p.audience === 'KIDS');
    const nextProduct = products.find(p => p.audience === 'NEXT');

    if (!kidsProduct || !nextProduct) {
        console.error('Missing products for test (need both KIDS and NEXT)');
        return;
    }

    console.log(`Using Kids Product: ${kidsProduct.id} (${kidsProduct.title})`);
    console.log(`Using Next Product: ${nextProduct.id} (${nextProduct.title})`);

    // 3. Create Mixed Order
    console.log('\n--- Creating Mixed Order (Customer) ---');
    const orderData = {
        items: [
            { productId: kidsProduct.id, quantity: 2 },
            { productId: nextProduct.id, quantity: 1 }
        ]
    };

    const createRes = await makeRequest('/api/orders', 'POST', customer.data.token, orderData);
    console.log('Create Status:', createRes.status);
    console.log('Order ID:', createRes.body.data ? createRes.body.data.id : 'N/A');

    if (createRes.status !== 201) return;
    const orderId = createRes.body.data.id;

    // 4. Admin Kids View
    console.log('\n--- Checking Admin Kids View ---');
    const kidsView = await makeRequest(`/api/orders/${orderId}`, 'GET', adminKids.data.token);
    console.log('Status:', kidsView.status);
    const kidsItems = kidsView.body.data.items;
    console.log('Items Visible:', kidsItems.length);
    console.log('Audiences:', kidsItems.map(i => i.audience));

    if (kidsItems.every(i => i.audience === 'KIDS')) {
        console.log('✅ PASS: Only KIDS items seen');
    } else {
        console.log('❌ FAIL: Saw non-KIDS items');
    }

    // 5. Admin Next View
    console.log('\n--- Checking Admin Next View ---');
    const nextView = await makeRequest(`/api/orders/${orderId}`, 'GET', adminNext.data.token);
    console.log('Status:', nextView.status);
    const nextItems = nextView.body.data.items;
    console.log('Items Visible:', nextItems.length);
    console.log('Audiences:', nextItems.map(i => i.audience));

    if (nextItems.every(i => i.audience === 'NEXT')) {
        console.log('✅ PASS: Only NEXT items seen');
    } else {
        console.log('❌ FAIL: Saw non-NEXT items');
    }

    // 6. Complete Order Logic Check (Change status)
    console.log('\n--- Updating Order Status ---');
    // Admin Kids updates their item status
    const kidsItemId = kidsItems[0].id; // Assuming one exists
    const updateRes = await makeRequest(`/api/orders/items/${kidsItemId}/status`, 'PATCH', adminKids.data.token, { status: 'SHIPPED' });
    console.log('Update Item Status:', updateRes.status);
    console.log('New Status:', updateRes.body.data.status);

    // 7. Check Dashboard Stats
    console.log('\n--- Checking Dashboard Stats ---');

    const kidsStats = await makeRequest('/api/dashboard/kids', 'GET', adminKids.data.token);
    console.log('Kids Stats:', kidsStats.body.stats);

    // We expect activeOrderItems to be non-zero (1 pending item from previous step if we didn't complete it? 
    // Wait, we updated ONE item to SHIPPED. Total items were 2?
    // Mixed order: 2 quantity of Kids, 1 quantity of Next.
    // OrderItems: 
    // 1. Kids Product (QTY 2). Status: PENDING -> SHIPPED.
    // 2. Next Product (QTY 1). Status: PENDING.

    // Kids Stats: Active Orders (PENDING)? 
    // If we count PENDING items. The kids item is SHIPPED. So activeOrders might be 0?
    // Let's see what dashboard returned.

    const nextStats = await makeRequest('/api/dashboard/next', 'GET', adminNext.data.token);
    console.log('Next Stats:', nextStats.body.stats);
    // Next item is still PENDING. Should show 1 active order?
}

runTests();
