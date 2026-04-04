/**
 * Seed NEXT Products: 10 products per NEXT category
 * - Brand: Next only
 * - Each product has Variants (color + size) and ColorImages (picsum photos)
 */
require('dotenv').config();
const prisma = require('./config/db');

const PRODUCTS_PER_CATEGORY = 10;

const COLOR_NAMES = ['Red', 'Blue', 'Green', 'Pink', 'Black', 'White'];
const SIZE_NAMES = ['XS', 'S', 'M', 'L', 'XL'];

const productTemplates = {
    'Boy': [
        { name: 'Next Boys Cotton T-Shirt', price: 99.99 },
        { name: 'Next Boys Denim Jeans', price: 169.99 },
        { name: 'Next Boys Polo Shirt', price: 109.99 },
        { name: 'Next Boys Cargo Shorts', price: 129.99 },
        { name: 'Next Boys Hoodie', price: 189.99 },
        { name: 'Next Boys Track Pants', price: 139.99 },
        { name: 'Next Boys Graphic Tee', price: 89.99 },
        { name: 'Next Boys Chino Pants', price: 149.99 },
        { name: 'Next Boys Sweater', price: 179.99 },
        { name: 'Next Boys Button-Up Shirt', price: 139.99 },
    ],
    'Girl': [
        { name: 'Next Girls Floral Dress', price: 199.99 },
        { name: 'Next Girls Denim Skirt', price: 139.99 },
        { name: 'Next Girls Leggings', price: 89.99 },
        { name: 'Next Girls Tutu Skirt', price: 109.99 },
        { name: 'Next Girls Cardigan', price: 149.99 },
        { name: 'Next Girls T-Shirt Dress', price: 119.99 },
        { name: 'Next Girls Blouse', price: 129.99 },
        { name: 'Next Girls Jumpsuit', price: 199.99 },
        { name: 'Next Girls Shorts Set', price: 149.99 },
        { name: 'Next Girls Party Dress', price: 249.99 },
    ],
    'Baby Boy': [
        { name: 'Next Baby Boy Romper', price: 104.99 },
        { name: 'Next Baby Boy Onesie Pack', price: 134.99 },
        { name: 'Next Baby Boy Sleepsuit', price: 94.99 },
        { name: 'Next Baby Boy Dungarees', price: 124.99 },
        { name: 'Next Baby Boy Bodysuit', price: 74.99 },
        { name: 'Next Baby Boy Jacket', price: 159.99 },
        { name: 'Next Baby Boy Pants', price: 89.99 },
        { name: 'Next Baby Boy Shirt', price: 84.99 },
        { name: 'Next Baby Boy Sweater', price: 119.99 },
        { name: 'Next Baby Boy Overall', price: 144.99 },
    ],
    'Baby Girl': [
        { name: 'Next Baby Girl Dress', price: 134.99 },
        { name: 'Next Baby Girl Onesie Pack', price: 134.99 },
        { name: 'Next Baby Girl Sleepsuit', price: 94.99 },
        { name: 'Next Baby Girl Romper', price: 104.99 },
        { name: 'Next Baby Girl Bodysuit', price: 74.99 },
        { name: 'Next Baby Girl Tutu Set', price: 154.99 },
        { name: 'Next Baby Girl Cardigan', price: 124.99 },
        { name: 'Next Baby Girl Leggings', price: 79.99 },
        { name: 'Next Baby Girl Jacket', price: 159.99 },
        { name: 'Next Baby Girl Overall', price: 144.99 },
    ],
    'Accessories': [
        { name: 'Next Kids Backpack', price: 134.99 },
        { name: 'Next Kids Baseball Cap', price: 74.99 },
        { name: 'Next Kids Sunglasses', price: 59.99 },
        { name: 'Next Kids Belt', price: 69.99 },
        { name: 'Next Kids Beanie Hat', price: 84.99 },
        { name: 'Next Kids Scarf', price: 94.99 },
        { name: 'Next Kids Gloves', price: 79.99 },
        { name: 'Next Kids Hair Accessories', price: 54.99 },
        { name: 'Next Kids Watch', price: 104.99 },
        { name: 'Next Kids Socks Pack', price: 89.99 },
    ],
    'Footwear': [
        { name: 'Next Kids Sneakers', price: 199.99 },
        { name: 'Next Kids Sandals', price: 134.99 },
        { name: 'Next Kids Boots', price: 219.99 },
        { name: 'Next Kids Slip-On Shoes', price: 154.99 },
        { name: 'Next Kids Rain Boots', price: 124.99 },
        { name: 'Next Kids Dress Shoes', price: 174.99 },
        { name: 'Next Kids Slippers', price: 94.99 },
        { name: 'Next Kids Running Shoes', price: 204.99 },
        { name: 'Next Kids Winter Boots', price: 244.99 },
        { name: 'Next Kids Flip Flops', price: 74.99 },
    ],
};

function getProductImageUrl(seed, index = 0) {
    const id = (seed + index + 5000) % 10000;
    return `https://picsum.photos/seed/next${id}/600/600`;
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

function generateSKU(productId, catSlug, colorIndex, sizeIndex) {
    return `NX-${catSlug.toUpperCase().slice(0, 3)}-${productId}-${colorIndex}-${sizeIndex}`;
}

async function getOrCreateNextBrand() {
    let brand = await prisma.brand.findUnique({ where: { slug: 'next' } });
    if (!brand) {
        brand = await prisma.brand.create({
            data: {
                name: 'Next',
                slug: 'next',
                description: 'Next brand – fashion and quality for the whole family.',
                isActive: true,
            },
        });
        console.log('   ✅ Brand "Next" created.');
    }
    return brand;
}

async function seedNextProducts() {
    console.log('🌱 Seeding NEXT Products (10 per category, brand: Next, variants + color images)...\n');

    const nextCategories = await prisma.category.findMany({
        where: { audience: 'NEXT' },
        orderBy: { name: 'asc' },
    });
    if (nextCategories.length === 0) {
        console.error('No NEXT categories found. Run seed-categories-all.js first.');
        process.exit(1);
    }

    const brand = await getOrCreateNextBrand();

    for (const name of COLOR_NAMES) await getOrCreateColor(name);
    for (const name of SIZE_NAMES) await getOrCreateSize(name);

    const colorIds = {};
    const sizeIds = {};
    for (const name of COLOR_NAMES) colorIds[name] = await getOrCreateColor(name);
    for (const name of SIZE_NAMES) sizeIds[name] = await getOrCreateSize(name);

    let totalCreated = 0;

    for (const category of nextCategories) {
        const templates = productTemplates[category.name] || productTemplates['Boy'];
        const toCreate = templates.slice(0, PRODUCTS_PER_CATEGORY);
        console.log(`📦 ${category.name} (NEXT): ${toCreate.length} products`);

        for (let pIdx = 0; pIdx < toCreate.length; pIdx++) {
            const template = toCreate[pIdx];
            const productName = template.name;
            const basePrice = template.price;
            const colorsForProduct = COLOR_NAMES.slice(0, 3);
            const sizesForProduct = SIZE_NAMES.slice(0, 3);

            try {
                const product = await prisma.product.create({
                    data: {
                        name: productName,
                        description: `Next – High quality ${category.name} product. Stylish and comfortable.`,
                        basePrice,
                        audience: 'NEXT',
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
                        const sku = generateSKU(product.id, category.slug, cIdx, sIdx);

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
                console.log(`   ✅ ${productName} (3 colors × 3 sizes)`);
            } catch (err) {
                console.error(`   ❌ ${productName}:`, err.message);
            }
        }
        console.log('');
    }

    console.log(`✨ Done. Created ${totalCreated} NEXT products (brand: Next) with variants and color images.`);
}

seedNextProducts()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
