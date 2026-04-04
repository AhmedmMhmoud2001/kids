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

// Delete
exports.delete = async (id) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (category && category.image) {
        await deleteFileFromUrl(category.image);
    }

    return prisma.category.delete({
        where: { id }
    });
};
