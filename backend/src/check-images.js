const prisma = require('./config/db');

async function checkCategoryImages() {
    const categories = await prisma.category.findMany({
        select: {
            name: true,
            image: true,
            audience: true
        }
    });

    console.log('🖼️ Category Images Check:');
    categories.forEach(cat => {
        console.log(`- [${cat.audience}] ${cat.name}: ${cat.image}`);
    });
}

checkCategoryImages()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
