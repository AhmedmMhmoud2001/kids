const prisma = require('../../config/db');

// Bridge between legacy users.role enum and RBAC app roles.
const USER_ROLE_TO_APP_ROLE_KEY = {
    SYSTEM_ADMIN: 'admin',
    ADMIN_KIDS: 'manager',
    ADMIN_NEXT: 'manager',
    SELLER: 'employee'
    // CUSTOMER intentionally not mapped by default
};

const getMappedAppRoleKey = (userRole) => USER_ROLE_TO_APP_ROLE_KEY[String(userRole || '').trim()] || null;

const syncUserRoleToRbac = async (userId, userRole, assignedBy = null) => {
    if (!userId) return null;
    const mappedRoleKey = getMappedAppRoleKey(userRole);

    if (!mappedRoleKey) {
        await prisma.userRole.deleteMany({ where: { userId } });
        return null;
    }

    const role = await prisma.appRole.findUnique({ where: { key: mappedRoleKey } });
    if (!role) return null;

    await prisma.$transaction(async (tx) => {
        await tx.userRole.deleteMany({ where: { userId } });
        await tx.userRole.create({
            data: {
                userId,
                roleId: role.id,
                assignedBy: assignedBy || userId
            }
        });
    });

    return role;
};

const syncAllUsersRolesToRbac = async () => {
    const users = await prisma.user.findMany({
        select: { id: true, role: true }
    });
    for (const user of users) {
        // eslint-disable-next-line no-await-in-loop
        await syncUserRoleToRbac(user.id, user.role, user.id);
    }
};

module.exports = {
    USER_ROLE_TO_APP_ROLE_KEY,
    getMappedAppRoleKey,
    syncUserRoleToRbac,
    syncAllUsersRolesToRbac
};
