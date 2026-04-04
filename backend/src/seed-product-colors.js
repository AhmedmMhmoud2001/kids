const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const availableColors = ["Red", "Blue", "Green", "White", "Black", "Pink", "Yellow"];

async function main() {
    console.log('--- Updating Products with Colors ---');
    const products = await prisma.product.findMany();

    for (const p of products) {
        // Assign 1-3 random colors to each product
        const count = Math.floor(Math.random() * 3) + 1;
        const shuffled = [...availableColors].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);

        try {
            await prisma.product.update({
                where: { id: p.id },
                data: {
                    colors: JSON.stringify(selected)
                }
            });
            console.log(`Updated product ${p.name} with colors: ${selected.join(', ')}`);
        } catch (err) {
            console.error(`Error updating ${p.name}:`, err.message);
        }
    }
    console.log('--- Colors Update Completed ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
