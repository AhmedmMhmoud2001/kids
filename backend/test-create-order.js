const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testOrder() {
    try {
        const userId = 1; // Assuming user 1 exists
        const res = await prisma.order.create({
            data: {
                userId,
                subtotal: 100,
                totalAmount: 100,
                status: 'PENDING',
                paymentMethod: 'COD',
                shippingAddress: { address: 'Test Street' },
                items: {
                    create: [
                        {
                            productId: 1, // Assuming product 1 exists
                            productName: 'Test Product',
                            priceAtPurchase: 100,
                            quantity: 1
                        }
                    ]
                }
            }
        });
        console.log('Order created successfully:', res);
    } catch (err) {
        console.error('Order creation failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

testOrder();
