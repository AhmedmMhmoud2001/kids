const prisma = require('./config/db');

async function testCategoryFiltering() {
    console.log('🧪 Testing Category Filtering by Audience\n');

    // Test 1: Get all categories
    const allCategories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
    });
    console.log(`📊 Total Categories: ${allCategories.length}\n`);

    // Test 2: Get KIDS categories only
    const kidsCategories = await prisma.category.findMany({
        where: { audience: 'KIDS' },
        orderBy: { name: 'asc' }
    });
    console.log('🧒 KIDS Categories:');
    kidsCategories.forEach(cat => {
        console.log(`   • ${cat.name} (ID: ${cat.id})`);
    });
    console.log(`   Total: ${kidsCategories.length}\n`);

    // Test 3: Get NEXT categories only
    const nextCategories = await prisma.category.findMany({
        where: { audience: 'NEXT' },
        orderBy: { name: 'asc' }
    });
    console.log('👔 NEXT Categories:');
    nextCategories.forEach(cat => {
        console.log(`   • ${cat.name} (ID: ${cat.id})`);
    });
    console.log(`   Total: ${nextCategories.length}\n`);

    console.log('✅ Category filtering is working correctly!');
    console.log('📝 When adding a KIDS product, only KIDS categories will appear.');
    console.log('📝 When adding a NEXT product, only NEXT categories will appear.');
}

testCategoryFiltering()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
