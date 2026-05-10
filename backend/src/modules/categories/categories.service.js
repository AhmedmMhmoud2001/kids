const prisma = require('../../config/db');
const { deleteFileFromUrl } = require('../../utils/fileUtils');
const { normalizeImageUrl } = require('../../utils/url');

// Create Category
exports.create = async (data) => {
    const payload = {
        ...data,
        image: normalizeImageUrl(data.image)
    };
    return prisma.category.create({ data: payload });
};

// Find All Categories (with optional audience filter)
exports.findAll = async (audience = null) => {
    const where = audience ? { audience } : {};
    const categories = await prisma.category.findMany({
        where,
        include: { _count: { select: { products: true } } },
        orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'desc' }
        ]
    });

    return categories.map(cat => ({
        ...cat,
        image: normalizeImageUrl(cat.image)
    }));
};

exports.findOne = async (idOrSlug) => {
    // UUID format check
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const result = isUuid 
        ? await prisma.category.findUnique({
            where: { id: idOrSlug },
            include: { products: true }
        })
        : await prisma.category.findFirst({
            where: { slug: idOrSlug },
            include: { products: true }
        });
    
    if (result) {
        result.image = normalizeImageUrl(result.image);
    }
    return result;
};

// Update
exports.update = async (id, data) => {
    const payload = {
        ...data,
        ...(data.image !== undefined ? { image: normalizeImageUrl(data.image) } : {})
    };

    // If image is being updated
    if (payload.image !== undefined) {
        const existingCategory = await prisma.category.findUnique({ where: { id } });
        if (existingCategory && existingCategory.image && existingCategory.image !== payload.image) {
            await deleteFileFromUrl(existingCategory.image);
        }
    }

    const updated = await prisma.category.update({
        where: { id },
        data: payload
    });
    return { ...updated, image: normalizeImageUrl(updated.image) };
};

// Delete (cascades to all products, their variants, color images, cart items, and favorites)
exports.delete = async (id) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return null;

    // Collect all product images for filesystem cleanup before transaction
    const products = await prisma.product.findMany({
        where: { categoryId: id },
        select: { id: true }
    });
    const productIds = products.map(p => p.id);

    const productImages = productIds.length
        ? await prisma.productColorImage.findMany({
            where: { productId: { in: productIds } },
            select: { imageUrl: true }
        })
        : [];

    // Delete category image and product images from filesystem
    if (category.image) {
        await deleteFileFromUrl(category.image);
    }
    for (const img of productImages) {
        await deleteFileFromUrl(img.imageUrl);
    }

    // Delete in a single transaction to keep DB consistent.
    // Order matters: favorites first (no cascade from product), then products
    // (variants, color images, and cart items cascade automatically), then category.
    return prisma.$transaction(async (tx) => {
        if (productIds.length) {
            await tx.favorite.deleteMany({ where: { productId: { in: productIds } } });
            await tx.cartItem.deleteMany({ where: { productId: { in: productIds } } });
            await tx.product.deleteMany({ where: { id: { in: productIds } } });
        }
        return tx.category.delete({ where: { id } });
    });
};
