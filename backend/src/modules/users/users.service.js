const prisma = require('../../config/db');
const bcrypt = require('bcrypt');
const { normalizeImageUrl } = require('../../utils/url');
const { syncUserRoleToRbac } = require('../rbac/rbac-sync.service');

// Create User
exports.create = async (data) => {
    const payload = {
        ...data,
        ...(data.image !== undefined ? { image: normalizeImageUrl(data.image) } : {})
    };
    // Hash password
    if (payload.password) {
        payload.password = await bcrypt.hash(payload.password, 10);
    }
    const created = await prisma.user.create({
        data: payload,
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            phone: true,
            address: true,
            city: true,
            country: true,
            image: true,
            createdAt: true,
            updatedAt: true
        } // Exclude password
    });
    await syncUserRoleToRbac(created.id, created.role, created.id);
    return created;
};

// Find All
exports.findAll = async () => {
    return prisma.user.findMany({
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            phone: true,
            address: true,
            city: true,
            country: true,
            image: true,
            createdAt: true,
            updatedAt: true
        }
    });
};

// Find One
exports.findOne = async (id) => {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            phone: true,
            address: true,
            city: true,
            country: true,
            image: true,
            createdAt: true,
            updatedAt: true
        }
    });
};

const { deleteFileFromUrl } = require('../../utils/fileUtils');

// Update
exports.update = async (id, data) => {
    const payload = {
        ...data,
        ...(data.image !== undefined ? { image: normalizeImageUrl(data.image) } : {})
    };
    // Hash password if updating
    if (payload.password) {
        payload.password = await bcrypt.hash(payload.password, 10);
    }

    // Get old user data to check for image changes
    const oldUser = await prisma.user.findUnique({ where: { id }, select: { image: true } });

    const updatedUser = await prisma.user.update({
        where: { id },
        data: payload,
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            phone: true,
            address: true,
            city: true,
            country: true,
            image: true,
            createdAt: true,
            updatedAt: true
        }
    });

    // If image was changed and old image was local, delete it
    if (oldUser?.image && payload.image && oldUser.image !== payload.image) {
        await deleteFileFromUrl(oldUser.image);
    }

    if (payload.role !== undefined) {
        await syncUserRoleToRbac(updatedUser.id, updatedUser.role, updatedUser.id);
    }

    return updatedUser;
};

// Delete
exports.delete = async (id) => {
    const user = await prisma.user.findUnique({ where: { id }, select: { image: true } });

    // Delete file if exists
    if (user?.image) {
        await deleteFileFromUrl(user.image);
    }

    return prisma.user.delete({
        where: { id }
    });
};
