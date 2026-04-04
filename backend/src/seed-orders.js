require('dotenv').config();
const prisma = require('./config/db');

const DAYS = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const DAYS_AGO = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function seedOrders() {
    console.log('🛒 Seeding Orders...\n');

    // Get existing products and users
    const products = await prisma.product.findMany({ take: 10 });
    const users = await prisma.user.findMany({ where: { role: 'CUSTOMER' } });

    if (products.length === 0) {
        console.log('❌ No products found. Run product seed first.');
        return;
    }
    if (users.length === 0) {
        console.log('❌ No customers found. Run user seed first.');
        return;
    }

    console.log(`   Found ${products.length} products and ${users.length} customers\n`);

    // Create sample orders with various statuses
    const ordersData = [
        // DELIVERED orders (count as revenue for COD)
        {
            userId: users[0].id,
            status: 'DELIVERED',
            subtotal: 1299,
            shippingFee: 50,
            discount: 0,
            totalAmount: 1349,
            paymentMethod: 'COD',
            createdAt: DAYS_AGO(5),
            deliveredAt: DAYS_AGO(2)
        },
        {
            userId: users[0].id,
            status: 'DELIVERED',
            subtotal: 899,
            shippingFee: 0,
            discount: 100,
            totalAmount: 799,
            paymentMethod: 'COD',
            createdAt: DAYS_AGO(10),
            deliveredAt: DAYS_AGO(7)
        },
        // COMPLETED orders (count as revenue)
        {
            userId: users[1]?.id || users[0].id,
            status: 'COMPLETED',
            subtotal: 2499,
            shippingFee: 0,
            discount: 250,
            totalAmount: 2249,
            paymentMethod: 'CARD',
            createdAt: DAYS_AGO(15),
            deliveredAt: DAYS_AGO(12)
        },
        {
            userId: users[1]?.id || users[0].id,
            status: 'COMPLETED',
            subtotal: 699,
            shippingFee: 30,
            discount: 0,
            totalAmount: 729,
            paymentMethod: 'CARD',
            createdAt: DAYS_AGO(20),
            deliveredAt: DAYS_AGO(17)
        },
        // SHIPPED orders (COD - no revenue yet)
        {
            userId: users[2]?.id || users[0].id,
            status: 'SHIPPED',
            subtotal: 1599,
            shippingFee: 50,
            discount: 0,
            totalAmount: 1649,
            paymentMethod: 'COD',
            createdAt: DAYS_AGO(3)
        },
        // PROCESSING orders
        {
            userId: users[2]?.id || users[0].id,
            status: 'PROCESSING',
            subtotal: 899,
            shippingFee: 0,
            discount: 50,
            totalAmount: 849,
            paymentMethod: 'CARD',
            createdAt: DAYS_AGO(1)
        },
        // CONFIRMED orders
        {
            userId: users[3]?.id || users[0].id,
            status: 'CONFIRMED',
            subtotal: 2199,
            shippingFee: 0,
            discount: 200,
            totalAmount: 1999,
            paymentMethod: 'CARD',
            createdAt: DAYS_AGO(0.5)
        },
        // PENDING orders
        {
            userId: users[3]?.id || users[0].id,
            status: 'PENDING',
            subtotal: 599,
            shippingFee: 40,
            discount: 0,
            totalAmount: 639,
            paymentMethod: 'COD',
            createdAt: new Date()
        },
        // More delivered orders for revenue
        {
            userId: users[4]?.id || users[0].id,
            status: 'DELIVERED',
            subtotal: 1799,
            shippingFee: 0,
            discount: 0,
            totalAmount: 1799,
            paymentMethod: 'COD',
            createdAt: DAYS_AGO(25),
            deliveredAt: DAYS_AGO(22)
        },
        {
            userId: users[4]?.id || users[0].id,
            status: 'COMPLETED',
            subtotal: 3499,
            shippingFee: 50,
            discount: 500,
            totalAmount: 3049,
            paymentMethod: 'CARD',
            createdAt: DAYS_AGO(30),
            deliveredAt: DAYS_AGO(27)
        },
        // Recent orders for chart
        {
            userId: users[0].id,
            status: 'DELIVERED',
            subtotal: 799,
            shippingFee: 0,
            discount: 0,
            totalAmount: 799,
            paymentMethod: 'COD',
            createdAt: DAYS_AGO(45),
            deliveredAt: DAYS_AGO(42)
        },
        {
            userId: users[1]?.id || users[0].id,
            status: 'COMPLETED',
            subtotal: 1199,
            shippingFee: 30,
            discount: 100,
            totalAmount: 1129,
            paymentMethod: 'CARD',
            createdAt: DAYS_AGO(60),
            deliveredAt: DAYS_AGO(57)
        }
    ];

    for (const orderData of ordersData) {
        // Pick random products for the order
        const numItems = Math.floor(Math.random() * 3) + 1;
        const selectedProducts = products.slice(0, numItems);

        const order = await prisma.order.create({
            data: {
                userId: orderData.userId,
                status: orderData.status,
                subtotal: orderData.subtotal,
                shippingFee: orderData.shippingFee,
                discount: orderData.discount,
                totalAmount: orderData.totalAmount,
                totalAmountEgp: orderData.totalAmount,
                totalAmountUsd: orderData.totalAmount / 50,
                paymentMethod: orderData.paymentMethod,
                createdAt: orderData.createdAt,
                deliveredAt: orderData.deliveredAt || null,
                items: {
                    create: selectedProducts.map(product => ({
                        productId: product.id,
                        productName: product.name,
                        quantity: Math.floor(Math.random() * 2) + 1,
                        priceAtPurchase: product.basePrice || 500,
                        color: 'Default',
                        size: 'M'
                    }))
                }
            }
        });
        console.log(`   ✅ Order #${order.id.slice(0, 8)} - ${orderData.status} - ${orderData.totalAmount} EGP`);
    }

    // Calculate expected revenue
    const revenueQuery = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
            OR: [
                { paymentMethod: 'CARD', status: { in: ['CONFIRMED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'RETURNED'] } },
                { paymentMethod: 'COD', status: { in: ['DELIVERED', 'COMPLETED', 'RETURNED'] } }
            ]
        }
    });

    console.log(`\n   💰 Total Revenue (calculated): ${revenueQuery._sum.totalAmount || 0} EGP`);
    console.log('\n🛒 Orders seeded successfully!\n');
}

seedOrders()
    .catch(e => { console.error('❌ Seed Error:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());