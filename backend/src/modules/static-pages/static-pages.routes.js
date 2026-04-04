const express = require('express');
const router = express.Router();
const staticPageController = require('./static-pages.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

// Public access to view pages
router.get('/', staticPageController.findAll);
router.get('/:idOrSlug', staticPageController.findOne);

// Admin only access to manage pages
router.post('/', authenticate, authorize('SYSTEM_ADMIN'), staticPageController.create);
router.put('/:id', authenticate, authorize('SYSTEM_ADMIN'), staticPageController.update);
router.delete('/:id', authenticate, authorize('SYSTEM_ADMIN'), staticPageController.delete);

module.exports = router;
