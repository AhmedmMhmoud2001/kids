const prisma = require('./config/db');

async function debugIds() {
    const ids = [
        '0d04d4d8-1c08-428d-b529-6b7ca2e09d41',
        '762ad723-3567-4e4c-baf1-c27605e72cbf',
        'a8f580aa-ccb7-4f91-b650-5f8a44ebd344',
        'cbb68ace-6673-46de-bef5-8814bff6f9b8',
        'a68832c7-5ae3-4806-b736-0ef1a7ce425c',
        'e4ed4977-b067-4a21-bbbf-163d42313bd9'
    ];

    const categories = await prisma.category.findMany({
        where: { id: { in: ids } }
    });

    console.log('🔍 Debugging Specific IDS:');
    categories.forEach(cat => {
        console.log(`- ${cat.name} (${cat.id}): ${cat.image}`);
    });
}

debugIds()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
