const express = require('express');
const router = express.Router();
const controller = require('./users.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireCrudPermission } = require('../../middlewares/permission.middleware');

router.post('/', authenticate, requireCrudPermission('users', 'create'), controller.create);
router.get('/', authenticate, requireCrudPermission('users', 'read'), controller.findAll);
router.get('/:id', authenticate, requireCrudPermission('users', 'read'), controller.findOne);
router.put('/:id', authenticate, requireCrudPermission('users', 'update'), controller.update);
router.delete('/:id', authenticate, requireCrudPermission('users', 'delete'), controller.delete);

module.exports = router;
