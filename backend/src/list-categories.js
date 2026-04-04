const prisma = require('./config/db');

async function listCategories() {
    console.log('📋 Listing all categories:\n');

    const categories = await prisma.category.findMany({
        orderBy: [
            { audience: 'asc' },
            { name: 'asc' }
        ]
    });

    const kidsCategories = categories.filter(c => c.audience === 'KIDS');
    const nextCategories = categories.filter(c => c.audience === 'NEXT');

    console.log('🧒 KIDS Categories:');
    kidsCategories.forEach(cat => {
        console.log(`   ✅ ${cat.name} (${cat.slug}) - ${cat.isActive ? 'Active' : 'Inactive'}`);
    });

    console.log('\n👔 NEXT Categories:');
    nextCategories.forEach(cat => {
        console.log(`   ✅ ${cat.name} (${cat.slug}) - ${cat.isActive ? 'Active' : 'Inactive'}`);
    });

    console.log(`\n📊 Total: ${categories.length} categories (${kidsCategories.length} Kids, ${nextCategories.length} Next)`);
}

listCategories()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
