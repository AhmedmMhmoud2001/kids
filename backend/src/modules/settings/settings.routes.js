const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

// Public or Customer can get settings (like shipping fee)
router.get('/', settingsController.getAllSettings);
router.get('/social', settingsController.getSocialLinks);
router.get('/currency', settingsController.getCurrencySettings);
router.get('/:key', settingsController.getSettingByKey);

// Admins can update key/value settings
router.post('/', authenticate, authorize(['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT']), settingsController.updateSetting);
router.put('/social', authenticate, authorize(['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT']), settingsController.updateSocialLinks);
router.put('/currency', authenticate, authorize(['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT']), settingsController.updateCurrencySettings);

module.exports = router;
