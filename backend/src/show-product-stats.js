const prisma = require('./config/db');

async function showProductStats() {
    console.log('📊 Product Statistics by Category:\n');

    const categories = await prisma.category.findMany({
        include: {
            _count: {
                select: { products: true }
            }
        },
        orderBy: [
            { audience: 'asc' },
            { name: 'asc' }
        ]
    });

    const kidsCategories = categories.filter(c => c.audience === 'KIDS');
    const nextCategories = categories.filter(c => c.audience === 'NEXT');

    console.log('🧒 KIDS Categories:');
    let kidsTotal = 0;
    kidsCategories.forEach(cat => {
        console.log(`   📦 ${cat.name.padEnd(15)} - ${cat._count.products} products`);
        kidsTotal += cat._count.products;
    });
    console.log(`   ✅ Total: ${kidsTotal} products\n`);

    console.log('👔 NEXT Categories:');
    let nextTotal = 0;
    nextCategories.forEach(cat => {
        console.log(`   📦 ${cat.name.padEnd(15)} - ${cat._count.products} products`);
        nextTotal += cat._count.products;
    });
    console.log(`   ✅ Total: ${nextTotal} products\n`);

    console.log(`🎯 Grand Total: ${kidsTotal + nextTotal} products across ${categories.length} categories`);

    // Show sample products from each audience
    console.log('\n📝 Sample Products:');

    const sampleKids = await prisma.product.findMany({
        where: { audience: 'KIDS' },
        take: 3,
        include: { category: true }
    });

    console.log('\n🧒 KIDS Sample:');
    sampleKids.forEach(p => {
        console.log(`   • ${p.name} - $${p.price} (${p.category.name}) [${p.sku}]`);
    });

    const sampleNext = await prisma.product.findMany({
        where: { audience: 'NEXT' },
        take: 3,
        include: { category: true }
    });

    console.log('\n👔 NEXT Sample:');
    sampleNext.forEach(p => {
        console.log(`   • ${p.name} - $${p.price} (${p.category.name}) [${p.sku}]`);
    });
}

showProductStats()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
