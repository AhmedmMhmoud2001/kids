const express = require('express');
const router = express.Router();
const notificationsController = require('./notifications.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

// Only Admins can access notifications
router.get('/', authenticate, authorize(['ADMIN_KIDS', 'ADMIN_NEXT']), notificationsController.getNotifications);
router.patch('/:id/read', authenticate, authorize(['ADMIN_KIDS', 'ADMIN_NEXT']), notificationsController.markAsRead);
router.post('/read-all', authenticate, authorize(['ADMIN_KIDS', 'ADMIN_NEXT']), notificationsController.markAllRead);
router.delete('/:id', authenticate, authorize(['ADMIN_KIDS', 'ADMIN_NEXT']), notificationsController.deleteNotification);

module.exports = router;
