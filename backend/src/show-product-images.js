const prisma = require('./config/db');

async function showProductWithImages() {
    console.log('🖼️  Sample Products with Multiple Images:\n');

    const products = await prisma.product.findMany({
        take: 3,
        include: { category: true }
    });

    products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   SKU: ${product.sku}`);
        console.log(`   Category: ${product.category.name} (${product.audience})`);
        console.log(`   Price: $${product.price}`);

        const images = JSON.parse(product.thumbnails);
        console.log(`   📸 Images (${images.length}):`);
        images.forEach((img, i) => {
            console.log(`      ${i + 1}. ${img.substring(0, 80)}...`);
        });
        console.log('');
    });

    // Get statistics
    const allProducts = await prisma.product.findMany();
    const imageCounts = allProducts.map(p => JSON.parse(p.thumbnails).length);
    const avgImages = (imageCounts.reduce((a, b) => a + b, 0) / imageCounts.length).toFixed(1);
    const minImages = Math.min(...imageCounts);
    const maxImages = Math.max(...imageCounts);

    console.log('📊 Image Statistics:');
    console.log(`   Total Products: ${allProducts.length}`);
    console.log(`   Average Images per Product: ${avgImages}`);
    console.log(`   Min Images: ${minImages}`);
    console.log(`   Max Images: ${maxImages}`);
}

showProductWithImages()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
