const prisma = require('./config/db');

// Mark some random products as best sellers (10 products)
async function updateBestSellers() {
    console.log('🌟 Marking some products as Best Sellers...\n');

    try {
        // Get all products
        const allProducts = await prisma.product.findMany({
            where: { isActive: true }
        });

        if (allProducts.length === 0) {
            console.log('❌ No products found in database');
            return;
        }

        // Shuffle and take 15 random products (5 KIDS + 5 NEXT approximately)
        const shuffled = allProducts.sort(() => 0.5 - Math.random());
        const bestSellers = shuffled.slice(0, Math.min(15, allProducts.length));

        let count = 0;
        for (const product of bestSellers) {
            await prisma.product.update({
                where: { id: product.id },
                data: { isBestSeller: true }
            });
            console.log(`   ⭐ ${product.name} (${product.audience})`);
            count++;
        }

        console.log(`\n✨ Successfully marked ${count} products as Best Sellers!`);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

updateBestSellers()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

