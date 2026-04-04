const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const total = await prisma.product.count();
        const kidsCount = await prisma.product.count({ where: { audience: 'KIDS' } });
        const nextCount = await prisma.product.count({ where: { audience: 'NEXT' } });

        // console.log('--- Product Counts ---');
        // console.log(`Total Products: ${total}`);
        // console.log(`KIDS Products: ${kidsCount}`);
        // console.log(`NEXT Products: ${nextCount}`);

    } catch (error) {
        console.error('Error counting products:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
