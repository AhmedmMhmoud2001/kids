require('dotenv').config();
const prisma = require('./config/db');

const OLD_PROD_HOST = 'tovo-b.developteam.site';
const OLD_LOCAL_HOST = 'localhost:5000';

async function fixImageUrls() {
    console.log('🔧 Fixing image URLs...\n');

    const baseUrl = process.env.BACKEND_URL || `http://localhost:5000`;
    console.log(`   Using BACKEND_URL: ${baseUrl}\n`);

    // Fix Categories
    console.log('📂 Updating Categories...');
    const categories = await prisma.category.findMany({
        where: {
            image: {
                not: null
            }
        }
    });

    for (const cat of categories) {
        let newImage = cat.image;
        
        // Replace old production host
        if (newImage && newImage.includes(OLD_PROD_HOST)) {
            newImage = newImage.replace(`http://${OLD_PROD_HOST}`, baseUrl);
            newImage = newImage.replace(`https://${OLD_PROD_HOST}`, baseUrl);
        }
        
        // Replace old localhost
        if (newImage && newImage.includes(OLD_LOCAL_HOST)) {
            newImage = newImage.replace(`http://${OLD_LOCAL_HOST}`, baseUrl);
        }
        
        // Add baseUrl to relative paths
        if (newImage && newImage.startsWith('/uploads/')) {
            newImage = `${baseUrl}${newImage}`;
        }

        // Fix /kids/ prefix issue (should be removed)
        if (newImage && newImage.includes('/kids/uploads/')) {
            newImage = newImage.replace('/kids/uploads/', '/uploads/');
        }

        if (newImage !== cat.image) {
            await prisma.category.update({
                where: { id: cat.id },
                data: { image: newImage }
            });
            console.log(`   ✅ ${cat.name}: ${cat.image} → ${newImage}`);
        }
    }

    // Fix Brands
    console.log('\n🏷️ Updating Brands...');
    const brands = await prisma.brand.findMany({
        where: {
            image: {
                not: null
            }
        }
    });

    for (const brand of brands) {
        let newImage = brand.image;
        
        if (newImage && newImage.includes(OLD_PROD_HOST)) {
            newImage = newImage.replace(`http://${OLD_PROD_HOST}`, baseUrl);
            newImage = newImage.replace(`https://${OLD_PROD_HOST}`, baseUrl);
        }
        
        if (newImage && newImage.includes(OLD_LOCAL_HOST)) {
            newImage = newImage.replace(`http://${OLD_LOCAL_HOST}`, baseUrl);
        }
        
        if (newImage && newImage.startsWith('/uploads/')) {
            newImage = `${baseUrl}${newImage}`;
        }

        if (newImage !== brand.image) {
            await prisma.brand.update({
                where: { id: brand.id },
                data: { image: newImage }
            });
            console.log(`   ✅ ${brand.name}: ${brand.image} → ${newImage}`);
        }
    }

    // Fix Products (color images)
    console.log('\n📦 Updating Product Images...');
    const products = await prisma.product.findMany({
        include: {
            colorImages: true
        }
    });

    for (const product of products) {
        for (const img of product.colorImages) {
            let newImageUrl = img.imageUrl;
            
            if (newImageUrl && newImageUrl.includes(OLD_PROD_HOST)) {
                newImageUrl = newImageUrl.replace(`http://${OLD_PROD_HOST}`, baseUrl);
                newImageUrl = newImageUrl.replace(`https://${OLD_PROD_HOST}`, baseUrl);
            }
            
            if (newImageUrl && newImageUrl.includes(OLD_LOCAL_HOST)) {
                newImageUrl = newImageUrl.replace(`http://${OLD_LOCAL_HOST}`, baseUrl);
            }
            
            if (newImageUrl && newImageUrl.startsWith('/uploads/')) {
                newImageUrl = `${baseUrl}${newImageUrl}`;
            }

            if (newImageUrl !== img.imageUrl) {
                await prisma.productColorImage.update({
                    where: { id: img.id },
                    data: { imageUrl: newImageUrl }
                });
            }
        }
    }

    console.log('\n✅ Image URLs fixed successfully!\n');
}

fixImageUrls()
    .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());