const prisma = require('./config/db');
const bcrypt = require('bcrypt');

const users = [
    {
        email: 'system@example.com',
        password: 'password123',
        name: 'System Administrator',
        role: 'SYSTEM_ADMIN'
    },
    {
        email: 'admin.kids@example.com',
        password: 'password123',
        name: 'Kids Admin',
        role: 'ADMIN_KIDS'
    },
    {
        email: 'admin.next@example.com',
        password: 'password123',
        name: 'Next Admin',
        role: 'ADMIN_NEXT'
    },
    {
        email: 'customer@example.com',
        password: 'password123',
        name: 'John Doe',
        role: 'CUSTOMER'
    }
];

async function seedUsers() {
    console.log('Seeding Users...');

    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        await prisma.user.upsert({
            where: { email: user.email },
            update: {
                password: hashedPassword,
                firstName: user.name,
                role: user.role
            },
            create: {
                email: user.email,
                password: hashedPassword,
                firstName: user.name,
                role: user.role
            }
        });
        console.log(`Synced User: ${user.email} (${user.role})`);
    }
    console.log('Users Seeded Successfully.');
}

seedUsers()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
