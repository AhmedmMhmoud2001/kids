const prisma = require('./config/db');

const categories = [
    { name: 'Boy', image: '/uploads/categories/boy.png' },
    { name: 'Girl', image: '/uploads/categories/girl.png' },
    { name: 'Baby Boy', image: '/uploads/categories/baby_boy.png' },
    { name: 'Baby Girl', image: '/uploads/categories/baby_girl.png' },
    { name: 'Accessories', image: '/uploads/categories/accessories.png' },
    { name: 'Footwear', image: '/uploads/categories/footwear.png' }
];

async function seedCategories() {
    console.log('Seeding Categories...');
    for (const cat of categories) {
        // Upsert based on name
        const slug = cat.name.toLowerCase().replace(/ /g, '-');
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {
                image: cat.image,
                slug: slug,
                isActive: true
            },
            create: {
                name: cat.name,
                image: cat.image,
                slug: slug,
                isActive: true
            }
        });
        console.log(`Synced Category: ${cat.name}`);
    }
    console.log('Categories Seeded.');
}

seedCategories()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
