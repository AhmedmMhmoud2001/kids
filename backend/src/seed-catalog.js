require('dotenv').config();
const prisma = require('./config/db');

const toLocalized = (en, ar) => JSON.stringify({ en, ar });

const PRODUCTS_PER_CATEGORY = 4;
const COLOR_NAMES = ['Red', 'Blue', 'Black'];
const SIZE_NAMES = ['S', 'M', 'L'];

const BRANDS = [
    {
        name: toLocalized('Nike', 'نايك'),
        slug: 'nike',
        image: 'https://placehold.co/240x120/FFFFFF/111827?text=NIKE',
        description: toLocalized('Sportswear and kids performance essentials', 'ملابس رياضية واحتياجات أداء أساسية للأطفال'),
        isActive: true
    },
    {
        name: toLocalized('Adidas', 'أديداس'),
        slug: 'adidas',
        image: 'https://placehold.co/240x120/FFFFFF/111827?text=ADIDAS',
        description: toLocalized('Comfort-first activewear for all ages', 'ملابس رياضية مريحة لجميع الأعمار'),
        isActive: true
    },
    {
        name: toLocalized('Zara Kids', 'زارا كيدز'),
        slug: 'zara-kids',
        image: 'https://placehold.co/240x120/FFFFFF/111827?text=ZARA+KIDS',
        description: toLocalized('Trendy styles for modern kids', 'ستايلات عصرية للأطفال'),
        isActive: true
    },
    {
        name: toLocalized('Next', 'نكست'),
        slug: 'next',
        image: 'https://placehold.co/240x120/FFFFFF/111827?text=NEXT',
        description: toLocalized('NEXT brand collection', 'مجموعة علامة نكست'),
        isActive: true
    }
];

const CATEGORIES = [
    { name: 'Boy', slug: 'boy', image: '/uploads/categories/boy.png' },
    { name: 'Girl', slug: 'girl', image: '/uploads/categories/girl.png' },
    { name: 'Baby Boy', slug: 'baby-boy', image: '/uploads/categories/baby-boy.png' },
    { name: 'Baby Girl', slug: 'baby-girl', image: '/uploads/categories/baby-girl.png' },
    { name: 'Accessories', slug: 'accessories', image: '/uploads/categories/accessories.png' },
    { name: 'Footwear', slug: 'footwear', image: '/uploads/categories/footwear.png' }
];

const PRODUCT_TEMPLATES = {
    Boy: ['Cotton T-Shirt', 'Denim Jeans', 'Polo Shirt', 'Cargo Shorts'],
    Girl: ['Floral Dress', 'Tutu Skirt', 'Casual Leggings', 'Cardigan'],
    'Baby Boy': ['Romper Set', 'Baby Onesie Pack', 'Sleepsuit', 'Baby Dungarees'],
    'Baby Girl': ['Dress Set', 'Baby Onesie Pack', 'Sleepsuit', 'Baby Romper'],
    Accessories: ['Kids Backpack', 'Cap', 'Socks Pack', 'Watch'],
    Footwear: ['Sneakers', 'Sandals', 'Boots', 'Slip-On']
};

const imageSeedUrl = (seed) => `https://picsum.photos/seed/${seed}/700/700`;

const productSku = (audience, categorySlug, index) =>
    `SEED-${audience}-${categorySlug.toUpperCase()}-${index + 1}`;

const variantSku = (baseSku, color, size) =>
    `${baseSku}-${color.toUpperCase().slice(0, 3)}-${size.toUpperCase()}`;

async function getOrCreateColor(name) {
    return prisma.color.upsert({
        where: { name },
        update: {},
        create: { name, family: name }
    });
}

async function getOrCreateSize(name) {
    return prisma.size.upsert({
        where: { name },
        update: {},
        create: { name }
    });
}

async function seedBrands() {
    console.log('🌱 Seeding brands...');
    const brandIds = {};

    for (const brand of BRANDS) {
        const saved = await prisma.brand.upsert({
            where: { slug: brand.slug },
            update: brand,
            create: brand
        });
        brandIds[saved.slug] = saved.id;
        console.log(`   ✅ ${saved.name}`);
    }

    return brandIds;
}

async function seedCategories() {
    console.log('\n🌱 Seeding categories...');
    const categoriesByAudience = { KIDS: [], NEXT: [] };

    for (const audience of ['KIDS', 'NEXT']) {
        for (const category of CATEGORIES) {
            const saved = await prisma.category.upsert({
                where: {
                    slug_audience: {
                        slug: category.slug,
                        audience
                    }
                },
                update: {
                    name: category.name,
                    slug: category.slug,
                    image: category.image,
                    isActive: true
                },
                create: {
                    ...category,
                    audience,
                    isActive: true
                }
            });
            categoriesByAudience[audience].push(saved);
            console.log(`   ✅ ${saved.name} (${audience})`);
        }
    }

    return categoriesByAudience;
}

async function seedProducts(categoriesByAudience, brandIds) {
    console.log('\n🌱 Seeding products (with variants and images)...');

    const colors = {};
    const sizes = {};

    for (const name of COLOR_NAMES) colors[name] = await getOrCreateColor(name);
    for (const name of SIZE_NAMES) sizes[name] = await getOrCreateSize(name);

    const kidsBrands = Object.keys(brandIds).filter((slug) => slug !== 'next');
    let createdOrUpdated = 0;

    for (const audience of ['KIDS', 'NEXT']) {
        const audienceCategories = categoriesByAudience[audience] || [];
        for (const category of audienceCategories) {
            const templates = PRODUCT_TEMPLATES[category.name] || PRODUCT_TEMPLATES.Boy;

            for (let i = 0; i < PRODUCTS_PER_CATEGORY; i++) {
                const template = templates[i % templates.length];
                const sku = productSku(audience, category.slug, i);
                const brandId =
                    audience === 'NEXT'
                        ? brandIds.next
                        : brandIds[kidsBrands[i % kidsBrands.length]];

                const basePrice = 99 + i * 15 + (audience === 'NEXT' ? 20 : 0);
                const name = `${audience === 'NEXT' ? 'Next ' : ''}${category.name} ${template}`;
                const description = `Seeded ${audience} product for ${category.name} category.`;

                const product = await prisma.product.upsert({
                    where: { sku },
                    update: {
                        name,
                        description,
                        basePrice,
                        audience,
                        categoryId: category.id,
                        brandId,
                        isActive: true,
                        isBestSeller: i % 3 === 0
                    },
                    create: {
                        name,
                        description,
                        sku,
                        basePrice,
                        audience,
                        categoryId: category.id,
                        brandId,
                        isActive: true,
                        isBestSeller: i % 3 === 0
                    }
                });

                for (const colorName of COLOR_NAMES) {
                    for (const sizeName of SIZE_NAMES) {
                        const vSku = variantSku(sku, colorName, sizeName);
                        const price = basePrice + (COLOR_NAMES.indexOf(colorName) + SIZE_NAMES.indexOf(sizeName)) * 5;

                        await prisma.productVariant.upsert({
                            where: { sku: vSku },
                            update: {
                                productId: product.id,
                                colorId: colors[colorName].id,
                                sizeId: sizes[sizeName].id,
                                price,
                                stock: 25 + i * 3,
                                lowStockThreshold: 5
                            },
                            create: {
                                productId: product.id,
                                colorId: colors[colorName].id,
                                sizeId: sizes[sizeName].id,
                                sku: vSku,
                                price,
                                stock: 25 + i * 3,
                                lowStockThreshold: 5
                            }
                        });
                    }

                    for (let order = 1; order <= 3; order++) {
                        const seed = `${audience}-${category.slug}-${i}-${colorName}-${order}`.toLowerCase();
                        await prisma.productColorImage.upsert({
                            where: {
                                productId_colorId_order: {
                                    productId: product.id,
                                    colorId: colors[colorName].id,
                                    order
                                }
                            },
                            update: {
                                imageUrl: imageSeedUrl(seed)
                            },
                            create: {
                                productId: product.id,
                                colorId: colors[colorName].id,
                                order,
                                imageUrl: imageSeedUrl(seed)
                            }
                        });
                    }
                }

                createdOrUpdated++;
                console.log(`   ✅ ${product.name} (${audience})`);
            }
        }
    }

    return createdOrUpdated;
}

async function main() {
    console.log('🚀 Start seeding brands, categories, and products...\n');
    const brandIds = await seedBrands();
    const categoriesByAudience = await seedCategories();
    const totalProducts = await seedProducts(categoriesByAudience, brandIds);

    console.log('\n🎉 Seed completed successfully.');
    console.log(`Brands: ${Object.keys(brandIds).length}`);
    console.log(
        `Categories: ${(categoriesByAudience.KIDS?.length || 0) + (categoriesByAudience.NEXT?.length || 0)}`
    );
    console.log(`Products upserted: ${totalProducts}`);
}

main()
    .catch((error) => {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
