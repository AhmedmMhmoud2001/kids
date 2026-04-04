const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching products without SKU...');
    const products = await prisma.product.findMany({
        where: {
            OR: [
                { sku: null },
                { sku: '' }
            ]
        }
    });

    console.log(`Found ${products.length} products to update.`);

    for (const product of products) {
        // Generate a simple unique SKU: PRD-{id}-{audience}-{random}
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const newSku = `PRD-${product.id}-${product.audience}-${randomStr}`;

        console.log(`Updating Product ID ${product.id} ("${product.name}") with SKU: ${newSku}`);

        await prisma.product.update({
            where: { id: product.id },
            data: { sku: newSku }
        });
    }

    console.log('Successfully updated all products.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
