const express = require('express');
const router = express.Router();
const controller = require('./brands.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

// Public Read
router.get('/', controller.findAll);
router.get('/:id', controller.findOne);

// Protected Write (ONLY SYSTEM_ADMIN)
router.post('/', authenticate, authorize(['SYSTEM_ADMIN']), controller.create);
router.put('/:id', authenticate, authorize(['SYSTEM_ADMIN']), controller.update);
router.delete('/:id', authenticate, authorize(['SYSTEM_ADMIN']), controller.delete);

module.exports = router;
