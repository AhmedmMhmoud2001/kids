const prisma = require('./config/db');

// Generate multiple placeholder images for a product
function generateProductImages(productName, count = 6) {
    const images = [];
    const colors = ['4F46E5', 'EC4899', '10B981', 'F59E0B', '8B5CF6', 'EF4444'];

    for (let i = 0; i < count; i++) {
        const color = colors[i % colors.length];
        const imageUrl = `https://placehold.co/600x600/${color}/FFFFFF?text=${encodeURIComponent(productName)}+${i + 1}`;
        images.push(imageUrl);
    }

    return images;
}

async function updateProductImages() {
    console.log('🖼️  Updating product images to include multiple photos...\n');

    const products = await prisma.product.findMany();

    console.log(`Found ${products.length} products to update\n`);

    let updated = 0;

    for (const product of products) {
        try {
            // Generate 4-6 images per product (random)
            const imageCount = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6 images
            const images = generateProductImages(product.name, imageCount);

            await prisma.product.update({
                where: { id: product.id },
                data: {
                    thumbnails: JSON.stringify(images)
                }
            });

            updated++;
            if (updated % 10 === 0) {
                console.log(`✅ Updated ${updated}/${products.length} products...`);
            }
        } catch (error) {
            console.error(`❌ Error updating product ${product.id}:`, error.message);
        }
    }

    console.log(`\n✨ Successfully updated ${updated} products with multiple images!`);
    console.log(`📊 Each product now has 4-6 images`);
}

updateProductImages()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
