/**
 * Seed Products: KIDS (10 per category, all brands except Next) + NEXT (10 per category, brand Next only)
 * Each product has Variants (color + size) and ColorImages (working picsum photos)
 */
require('dotenv').config();
const prisma = require('./config/db');

const PRODUCTS_PER_CATEGORY = 10;

const COLOR_NAMES = ['Red', 'Blue', 'Green', 'Pink', 'Black', 'White'];
const SIZE_NAMES = ['XS', 'S', 'M', 'L', 'XL'];

const productTemplates = {
    'Boy': [
        { name: 'Boys Cotton T-Shirt', price: 89.99 },
        { name: 'Boys Denim Jeans', price: 149.99 },
        { name: 'Boys Polo Shirt', price: 99.99 },
        { name: 'Boys Cargo Shorts', price: 119.99 },
        { name: 'Boys Hoodie', price: 179.99 },
        { name: 'Boys Track Pants', price: 129.99 },
        { name: 'Boys Graphic Tee', price: 79.99 },
        { name: 'Boys Chino Pants', price: 139.99 },
        { name: 'Boys Sweater', price: 169.99 },
        { name: 'Boys Button-Up Shirt', price: 129.99 },
    ],
    'Girl': [
        { name: 'Girls Floral Dress', price: 179.99 },
        { name: 'Girls Denim Skirt', price: 129.99 },
        { name: 'Girls Leggings', price: 79.99 },
        { name: 'Girls Tutu Skirt', price: 99.99 },
        { name: 'Girls Cardigan', price: 139.99 },
        { name: 'Girls T-Shirt Dress', price: 109.99 },
        { name: 'Girls Blouse', price: 119.99 },
        { name: 'Girls Jumpsuit', price: 189.99 },
        { name: 'Girls Shorts Set', price: 139.99 },
        { name: 'Girls Party Dress', price: 229.99 },
    ],
    'Baby Boy': [
        { name: 'Baby Boy Romper', price: 94.99 },
        { name: 'Baby Boy Onesie Pack', price: 124.99 },
        { name: 'Baby Boy Sleepsuit', price: 84.99 },
        { name: 'Baby Boy Dungarees', price: 114.99 },
        { name: 'Baby Boy Bodysuit', price: 64.99 },
        { name: 'Baby Boy Jacket', price: 149.99 },
        { name: 'Baby Boy Pants', price: 79.99 },
        { name: 'Baby Boy Shirt', price: 74.99 },
        { name: 'Baby Boy Sweater', price: 109.99 },
        { name: 'Baby Boy Overall', price: 134.99 },
    ],
    'Baby Girl': [
        { name: 'Baby Girl Dress', price: 124.99 },
        { name: 'Baby Girl Onesie Pack', price: 124.99 },
        { name: 'Baby Girl Sleepsuit', price: 84.99 },
        { name: 'Baby Girl Romper', price: 94.99 },
        { name: 'Baby Girl Bodysuit', price: 64.99 },
        { name: 'Baby Girl Tutu Set', price: 144.99 },
        { name: 'Baby Girl Cardigan', price: 114.99 },
        { name: 'Baby Girl Leggings', price: 69.99 },
        { name: 'Baby Girl Jacket', price: 149.99 },
        { name: 'Baby Girl Overall', price: 134.99 },
    ],
    'Accessories': [
        { name: 'Kids Backpack', price: 124.99 },
        { name: 'Kids Baseball Cap', price: 64.99 },
        { name: 'Kids Sunglasses', price: 49.99 },
        { name: 'Kids Belt', price: 59.99 },
        { name: 'Kids Beanie Hat', price: 74.99 },
        { name: 'Kids Scarf', price: 84.99 },
        { name: 'Kids Gloves', price: 69.99 },
        { name: 'Kids Hair Accessories', price: 44.99 },
        { name: 'Kids Watch', price: 94.99 },
        { name: 'Kids Socks Pack', price: 79.99 },
    ],
    'Footwear': [
        { name: 'Kids Sneakers', price: 179.99 },
        { name: 'Kids Sandals', price: 124.99 },
        { name: 'Kids Boots', price: 199.99 },
        { name: 'Kids Slip-On Shoes', price: 144.99 },
        { name: 'Kids Rain Boots', price: 114.99 },
        { name: 'Kids Dress Shoes', price: 164.99 },
        { name: 'Kids Slippers', price: 84.99 },
        { name: 'Kids Running Shoes', price: 184.99 },
        { name: 'Kids Winter Boots', price: 224.99 },
        { name: 'Kids Flip Flops', price: 64.99 },
    ],
};

/** Product images from picsum.photos */
function getProductImageUrl(seed, index = 0) {
    const id = (seed + index) % 1000;
    return `https://picsum.photos/seed/${id}/600/600`;
}

async function getOrCreateColor(name) {
    let c = await prisma.color.findFirst({ where: { name } });
    if (!c) c = await prisma.color.create({ data: { name } });
    return c.id;
}

async function getOrCreateSize(name) {
    let s = await prisma.size.findFirst({ where: { name } });
    if (!s) s = await prisma.size.create({ data: { name } });
    return s.id;
}

function generateSKU(audience, productId, catSlug, colorIndex, sizeIndex) {
    const prefix = audience === 'NEXT' ? 'NX' : 'KD';
    return `${prefix}-${catSlug.toUpperCase().slice(0, 3)}-${productId}-${colorIndex}-${sizeIndex}`;
}

async function ensureNextBrand() {
    let brand = await prisma.brand.findFirst({ where: { slug: 'next' } });
    if (!brand) {
        brand = await prisma.brand.create({
            data: {
                name: 'Next',
                slug: 'next',
                description: 'Next brand for NEXT audience products',
                isActive: true,
            },
        });
        console.log('   ✅ Brand "Next" created.');
    }
    return brand;
}

async function createProductWithVariantsAndImages(options) {
    const {
        productName,
        description,
        basePrice,
        audience,
        categoryId,
        brandId,
        isBestSeller,
        colorIds,
        sizeIds,
        categorySlug,
        categoryName,
        colorsForProduct,
        sizesForProduct,
        imageSeedOffset = 0,
    } = options;

    const product = await prisma.product.create({
        data: {
            name: productName,
            description,
            basePrice,
            audience,
            categoryId,
            brandId,
            isActive: true,
            isBestSeller: !!isBestSeller,
        },
    });

    let minPrice = basePrice;
    const imageSeed = categoryId * 1000 + product.id + imageSeedOffset;

    for (let cIdx = 0; cIdx < colorsForProduct.length; cIdx++) {
        const colorName = colorsForProduct[cIdx];
        const colorId = colorIds[colorName];

        for (let sIdx = 0; sIdx < sizesForProduct.length; sIdx++) {
            const sizeId = sizeIds[sizesForProduct[sIdx]];
            const price = basePrice + (cIdx + sIdx) * 5;
            if (price < minPrice) minPrice = price;
            const sku = generateSKU(audience, product.id, categorySlug, cIdx, sIdx);

            await prisma.productVariant.create({
                data: {
                    productId: product.id,
                    colorId,
                    sizeId,
                    price,
                    stock: Math.floor(Math.random() * 80) + 20,
                    sku,
                },
            });
        }

        for (let imgOrder = 1; imgOrder <= 3; imgOrder++) {
            await prisma.productColorImage.create({
                data: {
                    productId: product.id,
                    colorId,
                    imageUrl: getProductImageUrl(imageSeed + cIdx * 10 + imgOrder),
                    order: imgOrder,
                },
            });
        }
    }

    await prisma.product.update({
        where: { id: product.id },
        data: { basePrice: minPrice },
    });

    return product;
}

async function seedKidsProducts() {
    console.log('🌱 Seeding Kids Products (10 per category, variants + color images)...\n');

    const kidsCategories = await prisma.category.findMany({
        where: { audience: 'KIDS' },
        orderBy: { name: 'asc' },
    });
    if (kidsCategories.length === 0) {
        console.error('No KIDS categories found. Run seed-categories-all.js first.');
        process.exit(1);
    }

    const allBrands = await prisma.brand.findMany({ where: { isActive: true } });
    const brands = allBrands.filter(
        (b) => b.slug?.toLowerCase() !== 'next' && !b.name?.toLowerCase().includes('next')
    );
    if (brands.length === 0) {
        console.error('No brands found (excluding Next). Run seed-brands.js first.');
        process.exit(1);
    }

    for (const name of COLOR_NAMES) await getOrCreateColor(name);
    for (const name of SIZE_NAMES) await getOrCreateSize(name);

    const colorIds = {};
    const sizeIds = {};
    for (const name of COLOR_NAMES) colorIds[name] = await getOrCreateColor(name);
    for (const name of SIZE_NAMES) sizeIds[name] = await getOrCreateSize(name);

    let totalCreated = 0;

    for (const category of kidsCategories) {
        const templates = productTemplates[category.name] || productTemplates['Boy'];
        const toCreate = templates.slice(0, PRODUCTS_PER_CATEGORY);
        console.log(`📦 ${category.name} (${category.audience}): ${toCreate.length} products`);

        for (let pIdx = 0; pIdx < toCreate.length; pIdx++) {
            const template = toCreate[pIdx];
            const brand = brands[pIdx % brands.length];
            const productName = template.name;
            const basePrice = template.price;
            const colorsForProduct = COLOR_NAMES.slice(0, 3);
            const sizesForProduct = SIZE_NAMES.slice(0, 3);

            try {
                const product = await prisma.product.create({
                    data: {
                        name: productName,
                        description: `High quality product from ${category.name}. Comfortable and stylish.`,
                        basePrice,
                        audience: 'KIDS',
                        categoryId: category.id,
                        brandId: brand.id,
                        isActive: true,
                        isBestSeller: pIdx % 4 === 0,
                    },
                });

                let minPrice = basePrice;
                const imageSeed = category.id * 1000 + product.id;

                for (let cIdx = 0; cIdx < colorsForProduct.length; cIdx++) {
                    const colorName = colorsForProduct[cIdx];
                    const colorId = colorIds[colorName];

                    for (let sIdx = 0; sIdx < sizesForProduct.length; sIdx++) {
                        const sizeName = sizesForProduct[sIdx];
                        const sizeId = sizeIds[sizeName];
                        const price = basePrice + (cIdx + sIdx) * 5;
                        if (price < minPrice) minPrice = price;
                        const sku = generateSKU('KIDS', product.id, category.slug, cIdx, sIdx);

                        await prisma.productVariant.create({
                            data: {
                                productId: product.id,
                                colorId,
                                sizeId,
                                price,
                                stock: Math.floor(Math.random() * 80) + 20,
                                sku,
                            },
                        });
                    }

                    for (let imgOrder = 1; imgOrder <= 3; imgOrder++) {
                        await prisma.productColorImage.create({
                            data: {
                                productId: product.id,
                                colorId,
                                imageUrl: getProductImageUrl(imageSeed + cIdx * 10 + imgOrder),
                                order: imgOrder,
                            },
                        });
                    }
                }

                await prisma.product.update({
                    where: { id: product.id },
                    data: { basePrice: minPrice },
                });

                totalCreated++;
                console.log(`   ✅ ${productName} (${colorsForProduct.length} colors × ${sizesForProduct.length} sizes)`);
            } catch (err) {
                console.error(`   ❌ ${productName}:`, err.message);
            }
        }
        console.log('');
    }

    console.log(`✨ Kids: Created ${totalCreated} products with variants and color images.\n`);
    return totalCreated;
}

async function seedNextProducts() {
    console.log('🌱 Seeding NEXT Products (10 per category, brand Next)...\n');

    const nextCategories = await prisma.category.findMany({
        where: { audience: 'NEXT' },
        orderBy: { name: 'asc' },
    });
    if (nextCategories.length === 0) {
        console.error('No NEXT categories found. Run seed-categories-all.js first.');
        return 0;
    }

    const nextBrand = await ensureNextBrand();

    const colorIds = {};
    const sizeIds = {};
    for (const name of COLOR_NAMES) colorIds[name] = await getOrCreateColor(name);
    for (const name of SIZE_NAMES) sizeIds[name] = await getOrCreateSize(name);

    const colorsForProduct = COLOR_NAMES.slice(0, 3);
    const sizesForProduct = SIZE_NAMES.slice(0, 3);
    let totalCreated = 0;

    for (const category of nextCategories) {
        const templates = productTemplates[category.name] || productTemplates['Boy'];
        const toCreate = templates.slice(0, PRODUCTS_PER_CATEGORY);
        console.log(`📦 ${category.name} (NEXT): ${toCreate.length} products`);

        for (let pIdx = 0; pIdx < toCreate.length; pIdx++) {
            const template = toCreate[pIdx];
            const productName = `Next ${template.name}`;
            const basePrice = template.price * 1.1;

            try {
                await createProductWithVariantsAndImages({
                    productName,
                    description: `Next – High quality ${category.name} product. Comfortable and stylish.`,
                    basePrice,
                    audience: 'NEXT',
                    categoryId: category.id,
                    brandId: nextBrand.id,
                    isBestSeller: pIdx % 4 === 0,
                    colorIds,
                    sizeIds,
                    categorySlug: category.slug,
                    categoryName: category.name,
                    colorsForProduct,
                    sizesForProduct,
                    imageSeedOffset: 50000,
                });
                totalCreated++;
                console.log(`   ✅ ${productName} (3 colors × 3 sizes)`);
            } catch (err) {
                console.error(`   ❌ ${productName}:`, err.message);
            }
        }
        console.log('');
    }

    console.log(`✨ NEXT: Created ${totalCreated} products with variants and color images.`);
    return totalCreated;
}

async function main() {
    const kidsTotal = await seedKidsProducts();
    const nextTotal = await seedNextProducts();
    console.log(`\n🎉 Total: ${kidsTotal} Kids + ${nextTotal} Next = ${kidsTotal + nextTotal} products.`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
