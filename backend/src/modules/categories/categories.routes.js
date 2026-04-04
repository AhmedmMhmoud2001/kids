const express = require('express');
const router = express.Router();
const controller = require('./categories.controller');
const { authenticate, authenticateOptional } = require('../../middlewares/auth.middleware');
const { requireCrudPermission } = require('../../middlewares/permission.middleware');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: audience
 *         schema:
 *           type: string
 *           enum: [KIDS, NEXT]
 *         description: Filter categories by audience
 *     responses:
 *       200:
 *         description: List of categories
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug, audience]
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               image:
 *                 type: string
 *               audience:
 *                 type: string
 *                 enum: [KIDS, NEXT]
 *               currencyCode:
 *                 type: string
 *                 enum: [EGP, USD, AED, EUR, QAR]
 *                 default: EGP
 *               exchangeRateToEgp:
 *                 type: number
 *                 format: float
 *                 description: Conversion rate for 1 unit of selected currency to EGP. Keep 1 for EGP.
 *                 example: 50
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Created category
 */
router.get('/', authenticateOptional, controller.findAll);
router.get('/:id', authenticateOptional, controller.findOne);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated category
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted category
 */
router.post('/', authenticate, requireCrudPermission('categories', 'create'), controller.create);
router.put('/:id', authenticate, requireCrudPermission('categories', 'update'), controller.update);
router.delete('/:id', authenticate, requireCrudPermission('categories', 'delete'), controller.delete);

module.exports = router;
