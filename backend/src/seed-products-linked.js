require('dotenv').config();
const prisma = require('./config/db');

const PRODUCTS_PER_CATEGORY = 8;
const COLOR_NAMES = ['Red', 'Blue', 'Black', 'Pink'];
const SIZE_NAMES = ['S', 'M', 'L'];

const TEMPLATES_BY_SLUG = {
    boy: ['Cotton T-Shirt', 'Denim Jeans', 'Polo Shirt', 'Cargo Shorts', 'Hoodie', 'Track Pants', 'Sweater', 'Shirt'],
    girl: ['Floral Dress', 'Denim Skirt', 'Leggings', 'Cardigan', 'Blouse', 'Jumpsuit', 'Party Dress', 'T-Shirt Dress'],
    'baby-boy': ['Romper', 'Onesie Pack', 'Sleepsuit', 'Dungarees', 'Bodysuit', 'Jacket', 'Pants', 'Overall'],
    'baby-girl': ['Dress Set', 'Onesie Pack', 'Sleepsuit', 'Romper', 'Bodysuit', 'Tutu Set', 'Cardigan', 'Overall'],
    accessories: ['Backpack', 'Baseball Cap', 'Sunglasses', 'Belt', 'Beanie', 'Scarf', 'Gloves', 'Socks Pack'],
    footwear: ['Sneakers', 'Sandals', 'Boots', 'Slip-On', 'Rain Boots', 'Dress Shoes', 'Slippers', 'Running Shoes'],
    shoes: ['Sneakers', 'Sandals', 'Boots', 'Slip-On', 'Rain Boots', 'Dress Shoes', 'Slippers', 'Running Shoes']
};

const imageSeedUrl = (seed) => `https://picsum.photos/seed/${seed}/700/700`;

const productSku = (audience, categorySlug, index) =>
    `LINK-${audience}-${String(categorySlug || 'cat').toUpperCase()}-${String(index + 1).padStart(2, '0')}`;

const variantSku = (baseSku, color, size) =>
    `${baseSku}-${color.toUpperCase().slice(0, 3)}-${size.toUpperCase()}`;

const getOrCreateColor = async (name) =>
    prisma.color.upsert({
        where: { name },
        update: {},
        create: { name, family: name }
    });

const getOrCreateSize = async (name) =>
    prisma.size.upsert({
        where: { name },
        update: {},
        create: { name }
    });

function parseLocalizedName(nameValue) {
    if (typeof nameValue !== 'string') return '';
    const trimmed = nameValue.trim();
    if (!trimmed.startsWith('{')) return trimmed;
    try {
        const parsed = JSON.parse(trimmed);
        return parsed.en || parsed.ar || trimmed;
    } catch {
        return trimmed;
    }
}

async function main() {
    console.log('🚀 Seeding products linked to existing categories + brands...');

    const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ audience: 'asc' }, { sortOrder: 'asc' }]
    });
    if (!categories.length) {
        throw new Error('No categories found. Seed categories first.');
    }

    const brands = await prisma.brand.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    });
    if (!brands.length) {
        throw new Error('No active brands found. Seed brands first.');
    }

    const brandBySlug = new Map(brands.map((b) => [String(b.slug || '').toLowerCase(), b]));
    const defaultNextBrand = brandBySlug.get('next') || brands[0];

    const colors = {};
    const sizes = {};
    for (const name of COLOR_NAMES) colors[name] = await getOrCreateColor(name);
    for (const name of SIZE_NAMES) sizes[name] = await getOrCreateSize(name);

    let upsertedProducts = 0;

    for (const category of categories) {
        const audience = category.audience;
        const categorySlug = String(category.slug || '').toLowerCase();
        const categoryName = parseLocalizedName(category.name) || categorySlug || 'Category';
        const templates = TEMPLATES_BY_SLUG[categorySlug] || TEMPLATES_BY_SLUG.boy;

        const brandPool = audience === 'NEXT'
            ? [defaultNextBrand, ...brands.filter((b) => b.id !== defaultNextBrand.id)]
            : brands.filter((b) => String(b.slug || '').toLowerCase() !== 'next').concat(defaultNextBrand);

        console.log(`\n📦 ${categoryName} (${audience})`);

        for (let i = 0; i < PRODUCTS_PER_CATEGORY; i += 1) {
            const baseTitle = templates[i % templates.length];
            const sku = productSku(audience, categorySlug, i);
            const brand = brandPool[i % brandPool.length];
            const basePrice = 120 + i * 20 + (audience === 'NEXT' ? 40 : 0);
            const productName = `${audience === 'NEXT' ? 'Next ' : ''}${categoryName} ${baseTitle}`;

            const product = await prisma.product.upsert({
                where: { sku },
                update: {
                    name: productName,
                    description: `Seeded product for ${categoryName} (${audience}) linked to ${brand.name}.`,
                    basePrice,
                    audience,
                    categoryId: category.id,
                    brandId: brand.id,
                    isActive: true,
                    isBestSeller: i % 3 === 0
                },
                create: {
                    name: productName,
                    description: `Seeded product for ${categoryName} (${audience}) linked to ${brand.name}.`,
                    sku,
                    basePrice,
                    audience,
                    categoryId: category.id,
                    brandId: brand.id,
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
                            stock: 25 + i * 2,
                            lowStockThreshold: 5
                        },
                        create: {
                            productId: product.id,
                            colorId: colors[colorName].id,
                            sizeId: sizes[sizeName].id,
                            sku: vSku,
                            price,
                            stock: 25 + i * 2,
                            lowStockThreshold: 5
                        }
                    });
                }

                for (let order = 1; order <= 3; order += 1) {
                    const seed = `${audience}-${categorySlug}-${i}-${colorName}-${order}`.toLowerCase();
                    await prisma.productColorImage.upsert({
                        where: {
                            productId_colorId_order: {
                                productId: product.id,
                                colorId: colors[colorName].id,
                                order
                            }
                        },
                        update: { imageUrl: imageSeedUrl(seed) },
                        create: {
                            productId: product.id,
                            colorId: colors[colorName].id,
                            order,
                            imageUrl: imageSeedUrl(seed)
                        }
                    });
                }
            }

            upsertedProducts += 1;
            console.log(`   ✅ ${productName} | ${brand.name}`);
        }
    }

    console.log(`\n🎉 Done. Products upserted: ${upsertedProducts}`);
}

main()
    .catch((err) => {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
