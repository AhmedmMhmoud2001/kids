const prisma = require('../../config/db');

exports.findAll = async () => {
    return prisma.staticPage.findMany({
        orderBy: { title: 'asc' }
    });
};

exports.findOne = async (idOrSlug) => {
    // UUID format check (36 chars with dashes)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    if (isUuid) {
        return prisma.staticPage.findUnique({
            where: { id: idOrSlug }
        });
    }
    return prisma.staticPage.findUnique({
        where: { slug: idOrSlug }
    });
};

exports.update = async (id, data) => {
    const updateData = {};
    
    if (data.contentEn !== undefined) {
        updateData.contentEn = data.contentEn;
    }
    if (data.contentAr !== undefined) {
        updateData.contentAr = data.contentAr;
    }
    // Legacy: if only content is provided, set it as English content
    if (data.content !== undefined && data.contentEn === undefined) {
        updateData.contentEn = data.content;
    }
    
    return prisma.staticPage.update({
        where: { id },
        data: updateData
    });
};

exports.create = async (data) => {
    return prisma.staticPage.create({ data });
};

exports.delete = async (id) => {
    return prisma.staticPage.delete({
        where: { id }
    });
};
