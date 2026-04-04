/**
 * One-off script: Delete all KIDS products that belong to the brand "Next".
 * Run from backend folder: node src/delete-kids-products-next-brand.js
 */
require('dotenv').config();
const prisma = require('./config/db');
const productService = require('./modules/products/products.service');

async function main() {
    const brand = await prisma.brand.findFirst({
        where: {
            OR: [
                { name: 'Next' },
                { slug: 'next' }
            ]
        }
    });

    if (!brand) {
        console.log('No brand named "Next" found.');
        process.exit(0);
        return;
    }

    const products = await prisma.product.findMany({
        where: { audience: 'KIDS', brandId: brand.id },
        select: { id: true, name: true }
    });

    if (products.length === 0) {
        console.log('No KIDS products found for brand "Next".');
        process.exit(0);
        return;
    }

    console.log(`Found ${products.length} KIDS product(s) for brand "Next". Deleting...`);

    let deleted = 0;
    let failed = 0;
    for (const p of products) {
        try {
            await productService.delete(String(p.id));
            deleted++;
            console.log(`  Deleted: ${p.name} (id ${p.id})`);
        } catch (err) {
            failed++;
            console.error(`  Failed to delete ${p.name} (id ${p.id}):`, err.message);
        }
    }

    console.log(`Done. Deleted: ${deleted}, Failed: ${failed}.`);
    process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
