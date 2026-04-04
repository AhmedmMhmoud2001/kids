require('dotenv').config();
const prisma = require('./config/db');

const toLocalized = (en, ar) => JSON.stringify({ en, ar });

const CATEGORY_IMAGE_BASE = 'https://placehold.co/600x600/F3F4F6/111827?text=';

const KIDS_CATEGORIES = [
    { en: 'Boy', ar: 'أولاد', slug: 'boy', imageText: 'Kids+Boy' },
    { en: 'Girl', ar: 'بنات', slug: 'girl', imageText: 'Kids+Girl' },
    { en: 'Baby Boy', ar: 'بيبي أولاد', slug: 'baby-boy', imageText: 'Kids+Baby+Boy' },
    { en: 'Baby Girl', ar: 'بيبي بنات', slug: 'baby-girl', imageText: 'Kids+Baby+Girl' },
    { en: 'Accessories', ar: 'إكسسوارات', slug: 'accessories', imageText: 'Kids+Accessories' },
    { en: 'Footwear', ar: 'أحذية', slug: 'footwear', imageText: 'Kids+Footwear' }
];

const NEXT_CATEGORIES = [
    { en: 'Boy', ar: 'أولاد', slug: 'boy', imageText: 'Next+Boy' },
    { en: 'Girl', ar: 'بنات', slug: 'girl', imageText: 'Next+Girl' },
    { en: 'Baby Boy', ar: 'بيبي أولاد', slug: 'baby-boy', imageText: 'Next+Baby+Boy' },
    { en: 'Footwear', ar: 'أحذية', slug: 'footwear', imageText: 'Next+Footwear' },
    { en: 'Baby Girl', ar: 'بيبي بنات', slug: 'baby-girl', imageText: 'Next+Baby+Girl' }
];

async function upsertAudienceCategories(audience, categories) {
    console.log(`\n🌱 Seeding ${audience} categories...`);

    for (let idx = 0; idx < categories.length; idx += 1) {
        const cat = categories[idx];
        const localizedName = toLocalized(cat.en, cat.ar);
        const image = `${CATEGORY_IMAGE_BASE}${cat.imageText}`;

        await prisma.category.upsert({
            where: {
                slug_audience: {
                    slug: cat.slug,
                    audience
                }
            },
            update: {
                name: localizedName,
                image,
                sortOrder: idx,
                isActive: true,
                currencyCode: 'EGP',
                exchangeRateToEgp: 1
            },
            create: {
                name: localizedName,
                slug: cat.slug,
                image,
                audience,
                sortOrder: idx,
                isActive: true,
                currencyCode: 'EGP',
                exchangeRateToEgp: 1
            }
        });

        console.log(`   ✅ ${cat.en} (${audience})`);
    }
}

async function main() {
    console.log('🚀 Start seeding Kids & Next categories (localized + images + full fields)');

    await upsertAudienceCategories('KIDS', KIDS_CATEGORIES);
    await upsertAudienceCategories('NEXT', NEXT_CATEGORIES);

    console.log('\n🎉 Categories seeded successfully.');
}

main()
    .catch((err) => {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

