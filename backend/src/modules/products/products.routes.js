const express = require('express');
const router = express.Router();
const controller = require('./products.controller');
const { authenticate, authenticateOptional } = require('../../middlewares/auth.middleware');
const { requireCrudPermission } = require('../../middlewares/permission.middleware');
const { uploadExcel } = require('../../middlewares/upload.middleware');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: audience
 *         schema:
 *           type: string
 *           enum: [KIDS, NEXT]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category ID or slug
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', authenticateOptional, controller.findAll);
router.get('/colors', controller.getColors);

// Excel: export / template / import (must be before /:id)
router.get('/export/:audience', authenticate, requireCrudPermission('products', 'read'), controller.exportExcel);
router.get('/template/:audience', authenticate, requireCrudPermission('products', 'read'), controller.templateExcel);
router.post('/import/:audience', authenticate, requireCrudPermission('products', 'create'), uploadExcel.single('file'), controller.importExcel);

router.get('/:id', authenticateOptional, controller.findOne);

// Protected Write
router.post('/', authenticate, requireCrudPermission('products', 'create'), controller.create);
router.put('/:id', authenticate, requireCrudPermission('products', 'update'), controller.update);
router.delete('/:id', authenticate, requireCrudPermission('products', 'delete'), controller.delete);

module.exports = router;
