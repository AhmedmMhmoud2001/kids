const prisma = require('../../config/db');

const normalizePermissionKey = (module, action) =>
    `${String(module || '').trim().toLowerCase()}.${String(action || '').trim().toLowerCase()}`;

const getUserWithRbac = async (userId) => prisma.user.findUnique({
    where: { id: userId },
    include: {
        userRoles: {
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: true }
                        }
                    }
                }
            }
        },
        userPermissions: {
            include: { permission: true }
        }
    }
});

const getEffectivePermissionSet = (user) => {
    const set = new Set();
    if (!user) return set;

    for (const ur of user.userRoles || []) {
        for (const rp of ur.role?.permissions || []) {
            if (rp.permission?.isActive) set.add(rp.permission.key);
        }
    }
    for (const up of user.userPermissions || []) {
        if (up.permission?.isActive) set.add(up.permission.key);
    }
    return set;
};

exports.normalizePermissionKey = normalizePermissionKey;
exports.getUserWithRbac = getUserWithRbac;
exports.getEffectivePermissionSet = getEffectivePermissionSet;

exports.listRoles = async () => prisma.appRole.findMany({
    orderBy: { name: 'asc' },
    include: {
        permissions: { include: { permission: true } },
        users: {
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                }
            }
        }
    }
});

exports.listPermissions = async () => prisma.appPermission.findMany({
    orderBy: [{ module: 'asc' }, { action: 'asc' }]
});

exports.createRole = async (payload) => {
    const { key, name, description, permissionKeys = [] } = payload;
    const normalizedKey = String(key || '').trim().toLowerCase();
    if (!normalizedKey || !name) throw new Error('Role key and name are required');

    const permissions = await prisma.appPermission.findMany({
        where: { key: { in: permissionKeys.map((k) => String(k).trim().toLowerCase()) } }
    });

    return prisma.appRole.create({
        data: {
            key: normalizedKey,
            name,
            description: description || null,
            permissions: {
                create: permissions.map((p) => ({ permissionId: p.id }))
            }
        },
        include: {
            permissions: { include: { permission: true } }
        }
    });
};

exports.updateRole = async (id, payload) => {
    const { name, description, isActive, permissionKeys } = payload;
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description || null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    if (!Array.isArray(permissionKeys)) {
        return prisma.appRole.update({
            where: { id },
            data,
            include: { permissions: { include: { permission: true } } }
        });
    }

    const permissions = await prisma.appPermission.findMany({
        where: { key: { in: permissionKeys.map((k) => String(k).trim().toLowerCase()) } }
    });

    return prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        return tx.appRole.update({
            where: { id },
            data: {
                ...data,
                permissions: {
                    create: permissions.map((p) => ({ permissionId: p.id }))
                }
            },
            include: { permissions: { include: { permission: true } } }
        });
    });
};

exports.deleteRole = async (id) => {
    const role = await prisma.appRole.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    users: true
                }
            }
        }
    });

    if (!role) throw new Error('Role not found');
    if (role._count.users > 0) {
        throw new Error('Cannot delete role that is assigned to users');
    }

    return prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        return tx.appRole.delete({ where: { id } });
    });
};

exports.assignRolesToUser = async (userId, roleIds = [], assignedBy = null) => prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId } });
    if (roleIds.length > 0) {
        await tx.userRole.createMany({
            data: roleIds.map((roleId) => ({
                userId,
                roleId,
                assignedBy
            }))
        });
    }
    return getUserWithRbac(userId);
});

exports.assignPermissionsToUser = async (userId, permissionKeys = []) => prisma.$transaction(async (tx) => {
    await tx.userPermission.deleteMany({ where: { userId } });
    if (permissionKeys.length > 0) {
        const permissions = await tx.appPermission.findMany({
            where: { key: { in: permissionKeys.map((k) => String(k).trim().toLowerCase()) } }
        });
        if (permissions.length > 0) {
            await tx.userPermission.createMany({
                data: permissions.map((p) => ({
                    userId,
                    permissionId: p.id
                }))
            });
        }
    }
    return getUserWithRbac(userId);
});

exports.getUserRbacProfile = async (userId) => {
    const user = await getUserWithRbac(userId);
    if (!user) throw new Error('User not found');
    const effectivePermissions = Array.from(getEffectivePermissionSet(user));
    return { user, effectivePermissions };
};
