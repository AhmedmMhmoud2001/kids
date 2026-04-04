const prisma = require('../../config/db');

exports.add = async (userId, productId) => {
    return prisma.favorite.create({
        data: {
            userId,
            productId
        },
        include: { product: productIncludeFull }
    });
};

exports.remove = async (userId, productId) => {
    // Delete by composite unique could be tricky if Prisma doesn't expose it directly in delete
    // But we have @@unique([userId, productId]).
    // Prisma `delete` requires `where` unique.

    return prisma.favorite.delete({
        where: {
            userId_productId: {
                userId,
                productId
            }
        }
    });
};

const productIncludeFull = {
    include: {
        category: true,
        brandRel: true,
        variants: { include: { color: true, size: true } },
        colorImages: { include: { color: true }, orderBy: { order: 'asc' } }
    }
};

exports.getAll = async (userId) => {
    return prisma.favorite.findMany({
        where: { userId },
        include: { product: productIncludeFull }
    });
};
