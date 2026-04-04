const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ordersCount = await prisma.order.count();
    const latestOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: true }
    });
    console.log('Total Orders:', ordersCount);
    console.log('Latest Orders:', JSON.stringify(latestOrders, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
