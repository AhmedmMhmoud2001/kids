require('dotenv').config();
const prisma = require('./config/db');
const { syncAllUsersRolesToRbac } = require('./modules/rbac/rbac-sync.service');

const MODULES = ['users', 'products', 'categories', 'orders', 'brands', 'coupons', 'dashboard', 'settings', 'rbac'];
const CRUD_ACTIONS = ['create', 'read', 'update', 'delete'];

const ROLE_DEFINITIONS = [
    { key: 'admin', name: 'Admin', description: 'Full access to all modules and actions.' },
    { key: 'manager', name: 'Manager', description: 'Operational access with limited destructive actions.' },
    { key: 'employee', name: 'Employee', description: 'Read-focused access with limited updates.' }
];

const permissionKey = (moduleName, action) => `${moduleName}.${action}`;

const buildPermissions = () => {
    const list = [];
    for (const moduleName of MODULES) {
        for (const action of CRUD_ACTIONS) {
            list.push({
                key: permissionKey(moduleName, action),
                module: moduleName,
                action,
                description: `${action.toUpperCase()} on ${moduleName}`
            });
        }
    }
    return list;
};

const ADMIN_RULE = () => true;
const MANAGER_RULE = (moduleName, action) => {
    if (moduleName === 'rbac') return false;
    if (action === 'delete' && ['users', 'settings'].includes(moduleName)) return false;
    if (moduleName === 'settings' && action !== 'read') return false;
    return true;
};
const EMPLOYEE_RULE = (moduleName, action) => {
    if (action === 'read' && ['products', 'categories', 'orders', 'brands', 'dashboard'].includes(moduleName)) return true;
    if (action === 'update' && moduleName === 'orders') return true;
    return false;
};

async function upsertPermissions() {
    const permissions = buildPermissions();
    const idsByKey = new Map();

    for (const p of permissions) {
        const row = await prisma.appPermission.upsert({
            where: { key: p.key },
            update: {
                module: p.module,
                action: p.action,
                description: p.description,
                isActive: true
            },
            create: {
                key: p.key,
                module: p.module,
                action: p.action,
                description: p.description,
                isActive: true
            }
        });
        idsByKey.set(row.key, row.id);
    }
    return idsByKey;
}

async function upsertRoles() {
    const roleByKey = new Map();
    for (const role of ROLE_DEFINITIONS) {
        const row = await prisma.appRole.upsert({
            where: { key: role.key },
            update: { name: role.name, description: role.description, isActive: true },
            create: { key: role.key, name: role.name, description: role.description, isActive: true }
        });
        roleByKey.set(role.key, row);
    }
    return roleByKey;
}

async function syncRolePermissions(roleByKey, permissionIdByKey) {
    const rules = {
        admin: ADMIN_RULE,
        manager: MANAGER_RULE,
        employee: EMPLOYEE_RULE
    };

    for (const [roleKey, role] of roleByKey.entries()) {
        const allow = rules[roleKey];
        const permissionIds = [];

        for (const [key, id] of permissionIdByKey.entries()) {
            const [moduleName, action] = key.split('.');
            if (allow(moduleName, action)) permissionIds.push(id);
        }

        await prisma.$transaction(async (tx) => {
            await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
            if (permissionIds.length > 0) {
                await tx.rolePermission.createMany({
                    data: permissionIds.map((permissionId) => ({
                        roleId: role.id,
                        permissionId
                    }))
                });
            }
        });
    }
}

async function main() {
    console.log('🚀 Seeding RBAC roles and permissions...');
    const permissionIdByKey = await upsertPermissions();
    const roleByKey = await upsertRoles();
    await syncRolePermissions(roleByKey, permissionIdByKey);
    await syncAllUsersRolesToRbac();
    console.log(`✅ Permissions: ${permissionIdByKey.size}`);
    console.log(`✅ Roles: ${roleByKey.size}`);
    console.log('🎉 RBAC seed completed.');
}

main()
    .catch((err) => {
        console.error('❌ RBAC seed failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
