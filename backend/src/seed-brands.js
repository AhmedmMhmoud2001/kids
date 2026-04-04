const prisma = require('./config/db');

const toLocalized = (en, ar) => JSON.stringify({ en, ar });

const brands = [
    {
        name: toLocalized('Nike', 'نايك'),
        slug: 'nike',
        image: 'https://placehold.co/200x100/FFFFFF/000000?text=NIKE',
        description: toLocalized('Leading sports brand offering premium athletic wear for kids', 'علامة رياضية رائدة تقدم ملابس رياضية مميزة للأطفال'),
        isActive: true
    },
    {
        name: toLocalized('Adidas', 'أديداس'),
        slug: 'adidas',
        image: 'https://placehold.co/200x100/FFFFFF/000000?text=ADIDAS',
        description: toLocalized('Quality sportswear and casual clothing for active children', 'ملابس رياضية وكاجوال عالية الجودة للأطفال النشطين'),
        isActive: true
    },
    {
        name: toLocalized('Zara Kids', 'زارا كيدز'),
        slug: 'zara-kids',
        image: 'https://placehold.co/200x100/FFFFFF/000000?text=ZARA+KIDS',
        description: toLocalized('Trendy and fashionable clothing for modern kids', 'ملابس عصرية وأنيقة للأطفال'),
        isActive: true
    },
    {
        name: toLocalized('H&M Kids', 'اتش اند ام كيدز'),
        slug: 'hm-kids',
        image: 'https://placehold.co/200x100/FFFFFF/000000?text=H%26M+KIDS',
        description: toLocalized('Affordable and stylish everyday wear for children', 'ملابس يومية أنيقة وبأسعار مناسبة للأطفال'),
        isActive: true
    },
    {
        name: toLocalized('Gap Kids', 'جاب كيدز'),
        slug: 'gap-kids',
        image: 'https://placehold.co/200x100/FFFFFF/000000?text=GAP+KIDS',
        description: toLocalized('Classic American style for kids of all ages', 'ستايل أمريكي كلاسيكي للأطفال من كل الأعمار'),
        isActive: true
    },
    {
        name: toLocalized("Carter's", 'كارترز'),
        slug: 'carters',
        image: 'https://placehold.co/200x100/FFFFFF/000000?text=CARTERS',
        description: toLocalized('Trusted brand for baby and toddler clothing', 'علامة موثوقة لملابس الرضع والأطفال الصغار'),
        isActive: true
    }
];

async function seedBrands() {
    console.log('🌱 Seeding Brands...\n');

    for (const brand of brands) {
        try {
            await prisma.brand.upsert({
                where: { slug: brand.slug },
                update: brand,
                create: brand
            });
            const parsedName = JSON.parse(brand.name);
            console.log(`   ✅ ${parsedName.en}`);
        } catch (error) {
            const parsedName = JSON.parse(brand.name);
            console.error(`   ❌ Error adding ${parsedName.en}:`, error.message);
        }
    }

    console.log('\n✨ Brands Seeded Successfully!');
}

seedBrands()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

