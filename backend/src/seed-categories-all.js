const prisma = require('./config/db');

const categories = [
    { name: 'Boy', slug: 'boy', image: '/uploads/categories/boy.png' },
    { name: 'Girl', slug: 'girl', image: '/uploads/categories/girl.png' },
    { name: 'Baby Boy', slug: 'baby-boy', image: '/uploads/categories/baby-boy.png' },
    { name: 'Baby Girl', slug: 'baby-girl', image: '/uploads/categories/baby-girl.png' },
    { name: 'Accessories', slug: 'accessories', image: '/uploads/categories/accessories.png' },
    { name: 'Footwear', slug: 'footwear', image: '/uploads/categories/footwear.png' }
];

const audiences = ['KIDS', 'NEXT'];

async function seedCategories() {
    console.log('🌱 Seeding Categories for Kids and Next...\n');

    for (const audience of audiences) {
        console.log(`📦 Adding categories for ${audience}:`);

        for (const cat of categories) {
            try {
                const category = await prisma.category.upsert({
                    where: {
                        name_audience: {
                            name: cat.name,
                            audience: audience
                        }
                    },
                    update: {
                        image: cat.image,
                        slug: cat.slug,
                        isActive: true
                    },
                    create: {
                        name: cat.name,
                        image: cat.image,
                        slug: cat.slug,
                        audience: audience,
                        isActive: true
                    }
                });
                console.log(`   ✅ ${cat.name} (${audience})`);
            } catch (error) {
                console.error(`   ❌ Error adding ${cat.name} (${audience}):`, error.message);
            }
        }
        console.log('');
    }

    console.log('✨ Categories Seeded Successfully!');
}

seedCategories()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
