const prisma = require('../../config/db');

// Create Coupon
exports.create = async (data) => {
    return prisma.coupon.create({ data });
};

// Get All Coupons
exports.findAll = async () => {
    return prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
    });
};

// Get Single Coupon
exports.findOne = async (id) => {
    return prisma.coupon.findUnique({
        where: { id },
    });
};

// Update Coupon
exports.update = async (id, data) => {
    return prisma.coupon.update({
        where: { id },
        data,
    });
};

// Delete Coupon
exports.delete = async (id) => {
    return prisma.coupon.delete({
        where: { id },
    });
};

// Find by Code
exports.findByCode = async (code) => {
    return prisma.coupon.findUnique({
        where: { code: String(code).toUpperCase() },
    });
};

exports.incrementUsage = async (code) => {
    return prisma.coupon.update({
        where: { code: String(code).toUpperCase() },
        data: {
            usageCount: {
                increment: 1
            }
        }
    });
};


