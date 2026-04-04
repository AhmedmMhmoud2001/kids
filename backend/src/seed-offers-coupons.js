require('dotenv').config();
const prisma = require('./config/db');

const DAYS = (n) => n * 24 * 60 * 60 * 1000;

const COUPONS = [
    {
        code: 'KIDS10',
        type: 'PERCENT',
        value: 10,
        minOrderAmount: 500,
        maxDiscount: 300,
        usageLimit: 500,
        usageCount: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + DAYS(90))
    },
    {
        code: 'NEXT15',
        type: 'PERCENT',
        value: 15,
        minOrderAmount: 1200,
        maxDiscount: 600,
        usageLimit: 300,
        usageCount: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + DAYS(60))
    },
    {
        code: 'SAVE200',
        type: 'FIXED',
        value: 200,
        minOrderAmount: 1800,
        maxDiscount: null,
        usageLimit: 200,
        usageCount: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + DAYS(45))
    },
    {
        code: 'WELCOME',
        type: 'PERCENT',
        value: 20,
        minOrderAmount: 0,
        maxDiscount: 250,
        usageLimit: 1000,
        usageCount: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + DAYS(120))
    }
];

async function getProductsByFilter({ audience, categorySlug, brandSlug, take = 20 }) {
    return prisma.product.findMany({
        where: {
            ...(audience ? { audience } : {}),
            ...(categorySlug ? { category: { slug: categorySlug, ...(audience ? { audience } : {}) } } : {}),
            ...(brandSlug ? { brandRel: { slug: brandSlug } } : {})
        },
        select: { id: true },
        take
    });
}

async function buildOffers() {
    const [kidsAccessories, nextFootwear, nextNike, kidsBoy] = await Promise.all([
        getProductsByFilter({ audience: 'KIDS', categorySlug: 'accessories' }),
        getProductsByFilter({ audience: 'NEXT', categorySlug: 'footwear' }),
        getProductsByFilter({ audience: 'NEXT', brandSlug: 'nike' }),
        getProductsByFilter({ audience: 'KIDS', categorySlug: 'boy' })
    ]);

    return [
        // Category-level offer
        {
            id: 'offer-kids-accessories',
            titleEn: 'Accessories sale',
            titleAr: 'خصم على الإكسسوارات',
            discountPercent: 20,
            url: '/shop',
            categorySlug: 'accessories',
            brandSlug: '',
            productIds: kidsAccessories.map((p) => p.id),
            isActive: true
        },
        // Category-level offer
        {
            id: 'offer-next-shoes',
            titleEn: 'Shoes mega offer',
            titleAr: 'عرض كبير على الأحذية',
            discountPercent: 35,
            url: '/shop',
            categorySlug: 'footwear',
            brandSlug: '',
            productIds: nextFootwear.map((p) => p.id),
            isActive: true
        },
        // Brand-level offer
        {
            id: 'offer-next-nike',
            titleEn: 'Nike picks',
            titleAr: 'عروض نايك',
            discountPercent: 15,
            url: '/shop',
            categorySlug: '',
            brandSlug: 'nike',
            productIds: nextNike.map((p) => p.id),
            isActive: true
        },
        // Product-level offer (highest priority by value on overlapping items)
        {
            id: 'offer-kids-boy-special-products',
            titleEn: 'Boy special picks',
            titleAr: 'اختيارات أولاد المميزة',
            discountPercent: 50,
            url: '/shop',
            categorySlug: '',
            brandSlug: '',
            productIds: kidsBoy.slice(0, 8).map((p) => p.id),
            isActive: true
        },
        // Mixed offer: category + brand + some explicit products
        {
            id: 'offer-next-shoes-nike-vip',
            titleEn: 'Nike shoes VIP',
            titleAr: 'عرض VIP لأحذية نايك',
            discountPercent: 40,
            url: '/shop',
            categorySlug: 'footwear',
            brandSlug: 'nike',
            productIds: nextNike.slice(0, 6).map((p) => p.id),
            isActive: true
        },
        {
            id: 'offer-kids-boy-category',
            titleEn: 'Boy category offer',
            titleAr: 'خصم فئة الأولاد',
            discountPercent: 10,
            url: '/shop',
            categorySlug: 'boy',
            brandSlug: '',
            productIds: [],
            isActive: true
        },
        {
            id: 'offer-kids-adidas-brand',
            titleEn: 'Adidas brand offer',
            titleAr: 'خصم علامة أديداس',
            discountPercent: 25,
            url: '/shop',
            categorySlug: '',
            brandSlug: 'adidas',
            productIds: [],
            isActive: true
        }
    ];
}

async function seedCoupons() {
    console.log('🌱 Seeding coupons...');
    for (const coupon of COUPONS) {
        await prisma.coupon.upsert({
            where: { code: coupon.code.toUpperCase() },
            update: {
                code: coupon.code.toUpperCase(),
                type: coupon.type,
                value: coupon.value,
                minOrderAmount: coupon.minOrderAmount,
                maxDiscount: coupon.maxDiscount,
                usageLimit: coupon.usageLimit,
                usageCount: coupon.usageCount,
                isActive: coupon.isActive,
                expiresAt: coupon.expiresAt
            },
            create: {
                code: coupon.code.toUpperCase(),
                type: coupon.type,
                value: coupon.value,
                minOrderAmount: coupon.minOrderAmount,
                maxDiscount: coupon.maxDiscount,
                usageLimit: coupon.usageLimit,
                usageCount: coupon.usageCount,
                isActive: coupon.isActive,
                expiresAt: coupon.expiresAt
            }
        });
        console.log(`   ✅ ${coupon.code}`);
    }
}

async function seedOffers() {
    console.log('\n🌱 Seeding top header offers...');
    const offers = await buildOffers();

    // Ensure all fields exist in each offer object
    const normalized = offers.map((offer) => ({
        id: String(offer.id),
        titleEn: String(offer.titleEn || '').trim(),
        titleAr: String(offer.titleAr || '').trim(),
        discountPercent: Math.max(0, Number(offer.discountPercent || 0)),
        url: '/shop',
        categorySlug: String(offer.categorySlug || '').trim(),
        brandSlug: String(offer.brandSlug || '').trim(),
        productIds: Array.isArray(offer.productIds) ? offer.productIds.map((id) => String(id)) : [],
        isActive: offer.isActive !== false
    }));

    await prisma.setting.upsert({
        where: { key: 'top_header_offers' },
        update: { value: JSON.stringify(normalized) },
        create: { key: 'top_header_offers', value: JSON.stringify(normalized) }
    });

    normalized.forEach((offer) => {
        console.log(`   ✅ ${offer.id} | products: ${offer.productIds.length}`);
    });
}

async function main() {
    console.log('🚀 Start seeding offers + coupons');
    await seedCoupons();
    await seedOffers();
    console.log('\n🎉 Done: offers + coupons seeded successfully');
}

main()
    .catch((err) => {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

