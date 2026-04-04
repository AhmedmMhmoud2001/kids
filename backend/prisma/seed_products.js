const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Categories...');
    const catShoes = await prisma.category.upsert({
        where: { slug_audience: { slug: 'shoes', audience: 'NEXT' } },
        update: {},
        create: { name: 'Shoes', slug: 'shoes', audience: 'NEXT' }
    });

    const catAccessories = await prisma.category.upsert({
        where: { slug_audience: { slug: 'accessories', audience: 'KIDS' } },
        update: {},
        create: { name: 'Accessories', slug: 'accessories', audience: 'KIDS' }
    });

    console.log('Seeding Products...');

    // Kids Product
    await prisma.product.create({
        data: {
            name: 'Kids Backpack',
            description: 'A practical kids backpack',
            basePrice: 49.99,
            audience: 'KIDS',
            categoryId: catAccessories.id
        }
    });

    // Next Product
    await prisma.product.create({
        data: {
            name: 'Next Sneakers',
            description: 'Stylish sneakers for teens',
            basePrice: 29.99,
            audience: 'NEXT',
            categoryId: catShoes.id
        }
    });

    console.log('Seed Completed');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
