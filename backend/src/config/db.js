const { PrismaClient } = require('@prisma/client');

// Prisma Client Configuration
const prismaOptions = {
    // Only log errors in production, more verbose in development
    log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
};

// Singleton pattern for Prisma Client
let prisma;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient(prismaOptions);
} else {
    // In development, use a global variable to preserve the connection across HMR
    if (!global.prisma) {
        global.prisma = new PrismaClient(prismaOptions);
    }
    prisma = global.prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

module.exports = prisma;
