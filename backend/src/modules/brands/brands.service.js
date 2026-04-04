const prisma = require('../../config/db');
const { deleteFileFromUrl } = require('../../utils/fileUtils');
const { normalizeImageUrl } = require('../../utils/url');

// Create Brand
exports.create = async (data) => {
    const payload = {
        ...data,
        image: normalizeImageUrl(data.image)
    };
    return prisma.brand.create({ data: payload });
};

// Find All Brands
exports.findAll = async () => {
    const brands = await prisma.brand.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { createdAt: 'desc' }
    });
    return brands.map(b => ({ ...b, image: normalizeImageUrl(b.image) }));
};

// Find One
exports.findOne = async (id) => {
    const brand = await prisma.brand.findUnique({
        where: { id },
        include: { products: true }
    });
    if (brand) brand.image = normalizeImageUrl(brand.image);
    return brand;
};

// Update
exports.update = async (id, data) => {
    const payload = {
        ...data,
        ...(data.image !== undefined ? { image: normalizeImageUrl(data.image) } : {})
    };

    const oldBrand = await prisma.brand.findUnique({
        where: { id },
        select: { image: true }
    });

    const updatedBrand = await prisma.brand.update({
        where: { id },
        data: payload
    });

    // Cleanup old image if changed
    if (oldBrand?.image && payload.image && oldBrand.image !== payload.image) {
        await deleteFileFromUrl(oldBrand.image);
    }

    return { ...updatedBrand, image: normalizeImageUrl(updatedBrand.image) };
};

// Delete
exports.delete = async (id) => {
    const brand = await prisma.brand.findUnique({
        where: { id },
        select: { image: true }
    });

    if (brand?.image) {
        await deleteFileFromUrl(brand.image);
    }

    return prisma.brand.delete({
        where: { id }
    });
};
