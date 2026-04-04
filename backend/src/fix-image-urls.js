const prisma = require('./config/db');

async function fixImageUrls() {
    const oldBase = 'http://localhost:5000';
    const newBase = 'https://tovo-b.developteam.site/kids';

    console.log('🛠️ Fixing Category Images...');
    const categories = await prisma.category.findMany({
        where: { image: { startsWith: oldBase } }
    });
    for (const cat of categories) {
        const newImage = cat.image.replace(oldBase, newBase);
        await prisma.category.update({
            where: { id: cat.id },
            data: { image: newImage }
        });
        console.log(`   ✅ Category: ${cat.name}`);
    }

    console.log('\n🛠️ Fixing Brand Images...');
    const brands = await prisma.brand.findMany({
        where: { image: { startsWith: oldBase } }
    });
    for (const brand of brands) {
        const newImage = brand.image.replace(oldBase, newBase);
        await prisma.brand.update({
            where: { id: brand.id },
            data: { image: newImage }
        });
        console.log(`   ✅ Brand: ${brand.name}`);
    }

    console.log('\n🛠️ Fixing Product Color Images...');
    const colorImages = await prisma.productColorImage.findMany({
        where: { imageUrl: { startsWith: oldBase } }
    });
    for (const ci of colorImages) {
        const newImage = ci.imageUrl.replace(oldBase, newBase);
        await prisma.productColorImage.update({
            where: { id: ci.id },
            data: { imageUrl: newImage }
        });
        console.log(`   ✅ Product Image (ID: ${ci.id})`);
    }

    console.log('\n✨ All URLs updated successfully!');
}

fixImageUrls()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
