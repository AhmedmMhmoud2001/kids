const prisma = require('./config/db');

const PRODUCTS_PER_AUDIENCE = 5; // 5 Kids + 5 Next = 10 per category

async function seedProducts() {
    console.log('Fetching Categories...');
    const categories = await prisma.category.findMany();

    if (categories.length === 0) {
        console.error('No categories found. Please run categories seed first.');
        process.exit(1);
    }

    console.log(`Found ${categories.length} categories. Starting product seed...`);

    const audiences = ['KIDS', 'NEXT'];

    for (const category of categories) {
        console.log(`Processing Category: ${category.name}`);

        for (const audience of audiences) {
            for (let i = 1; i <= PRODUCTS_PER_AUDIENCE; i++) {
                const sku = `${category.slug}-${audience.toLowerCase()}-${i}-${Date.now()}`;
                const name = `${category.name} ${audience} Item ${i}`;

                // Random Price between 50 and 500
                const price = (Math.random() * (500 - 50) + 50).toFixed(2);

                await prisma.product.create({
                    data: {
                        name: name,
                        description: `High quality ${audience} product for ${category.name}. Comfortable and stylish.`,
                        price: price,
                        sku: sku,
                        brand: i % 2 === 0 ? 'Brand A' : 'Brand B',
                        audience: audience,
                        categoryId: category.id,
                        isActive: true,
                        thumbnails: [
                            `/uploads/products/${category.slug}_1.jpg`,
                            `/uploads/products/${category.slug}_2.jpg`
                        ],
                        colors: ['Red', 'Blue', 'Black', 'White'],
                        sizes: ['S', 'M', 'L', 'XL'],
                        additionalInfo: 'Machine washable. 100% Cotton.'
                    }
                });
            }
        }
    }

    console.log('All products seeded successfully.');
}

seedProducts()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
