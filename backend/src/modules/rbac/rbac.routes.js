const express = require('express');
const router = express.Router();
const controller = require('./rbac.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');

router.get('/me/permissions', authenticate, controller.getMyPermissions);

router.get('/roles', authenticate, requirePermission('rbac.read'), controller.listRoles);
router.post('/roles', authenticate, requirePermission('rbac.create'), controller.createRole);
router.put('/roles/:id', authenticate, requirePermission('rbac.update'), controller.updateRole);
router.delete('/roles/:id', authenticate, requirePermission('rbac.delete'), controller.deleteRole);

router.get('/permissions', authenticate, requirePermission('rbac.read'), controller.listPermissions);

router.get('/users/:userId', authenticate, requirePermission('rbac.read'), controller.getUserRbacProfile);
router.put('/users/:userId/roles', authenticate, requirePermission('rbac.update'), controller.assignUserRoles);
router.put('/users/:userId/permissions', authenticate, requirePermission('rbac.update'), controller.assignUserPermissions);

// Example protected route usage:
router.get('/check/orders-read', authenticate, requirePermission('orders.read'), (req, res) => {
    res.json({ success: true, message: 'You can read orders.' });
});

module.exports = router;
