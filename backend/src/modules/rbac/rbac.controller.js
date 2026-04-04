const rbacService = require('./rbac.service');

exports.listRoles = async (req, res) => {
    try {
        const data = await rbacService.listRoles();
        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.listPermissions = async (req, res) => {
    try {
        const data = await rbacService.listPermissions();
        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.createRole = async (req, res) => {
    try {
        const data = await rbacService.createRole(req.body || {});
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateRole = async (req, res) => {
    try {
        const data = await rbacService.updateRole(req.params.id, req.body || {});
        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteRole = async (req, res) => {
    try {
        const data = await rbacService.deleteRole(req.params.id);
        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.assignUserRoles = async (req, res) => {
    try {
        const roleIds = Array.isArray(req.body?.roleIds) ? req.body.roleIds : [];
        const data = await rbacService.assignRolesToUser(req.params.userId, roleIds, req.user?.id || null);
        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.assignUserPermissions = async (req, res) => {
    try {
        const permissionKeys = Array.isArray(req.body?.permissionKeys) ? req.body.permissionKeys : [];
        const data = await rbacService.assignPermissionsToUser(req.params.userId, permissionKeys);
        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getUserRbacProfile = async (req, res) => {
    try {
        const data = await rbacService.getUserRbacProfile(req.params.userId);
        res.json({ success: true, data });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

exports.getMyPermissions = async (req, res) => {
    try {
        const data = await rbacService.getUserRbacProfile(req.user.id);
        res.json({ success: true, data: { effectivePermissions: data.effectivePermissions } });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};
