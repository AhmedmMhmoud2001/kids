const express = require('express');
const router = express.Router();
const upload = require('../../middlewares/upload.middleware');
const { convertToWebP, convertMultipleToWebP } = require('../../middlewares/upload.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const fs = require('fs');
const path = require('path');
const { processImage } = require('../../middlewares/upload.middleware');
const { deleteFileFromUrl } = require('../../utils/fileUtils');

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: File upload operations
 */

/**
 * @swagger
 * /upload/category:
 *   post:
 *     summary: Upload a category image
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 */
router.post('/', authenticate, upload.single('image'), convertToWebP, (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const baseUrl = (process.env.BACKEND_URL || 'http://tovo-b.developteam.site/kids').replace(/\/$/, '');
        const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

        res.json({
            success: true,
            data: {
                url: fileUrl,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype,
                originalSize: req.file.originalSize,
                convertedSize: req.file.convertedSize,
                savings: `${req.file.savings}%`
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Upload USER image (saves to /uploads/users)
 * POST /api/upload/user-pfp
 */
router.post('/user-image', authenticate, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const uploadDir = path.join(__dirname, '../../../uploads/users');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const base = (process.env.BACKEND_URL || 'http://tovo-b.developteam.site/kids').replace(/\/$/, '');
        const baseUrl = `${base}/uploads/users`;

        const { data: buffer, info } = await processImage(req.file.buffer, {
            maxWidth: 500,
            maxHeight: 500,
            quality: 80
        });

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `user-${req.user.id}-${uniqueSuffix}.webp`;
        const filepath = path.join(uploadDir, filename);

        await fs.promises.writeFile(filepath, buffer);
        const newImageUrl = `${baseUrl}/${filename}`;

        res.json({
            success: true,
            data: {
                url: newImageUrl,
                filename,
                size: info.size,
                mimetype: 'image/webp'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Upload BRAND image (saves to /uploads/brands)
 * POST /api/upload/brand
 */
router.post('/brand', authenticate, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const uploadDir = path.join(__dirname, '../../../uploads/brands');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const base = (process.env.BACKEND_URL || 'http://tovo-b.developteam.site/kids').replace(/\/$/, '');
        const baseUrl = `${base}/uploads/brands`;

        const { data: buffer, info } = await processImage(req.file.buffer, {
            maxWidth: 800,
            maxHeight: 800,
            quality: 85
        });

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `brand-${uniqueSuffix}.webp`;
        const filepath = path.join(uploadDir, filename);

        await fs.promises.writeFile(filepath, buffer);

        res.json({
            success: true,
            data: {
                url: `${baseUrl}/${filename}`,
                filename,
                size: info.size,
                mimetype: 'image/webp'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Upload CATEGORY image (saves to /uploads/categories)
 * POST /api/upload/category
 */
router.post('/category', authenticate, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const uploadDir = path.join(__dirname, '../../../uploads/categories');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const base = (process.env.BACKEND_URL || 'http://tovo-b.developteam.site/kids').replace(/\/$/, '');
        const baseUrl = `${base}/uploads/categories`;

        const { data: buffer, info } = await processImage(req.file.buffer, {
            maxWidth: 1000,
            maxHeight: 1000,
            quality: 85
        });

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `category-${uniqueSuffix}.webp`;
        const filepath = path.join(uploadDir, filename);

        await fs.promises.writeFile(filepath, buffer);

        res.json({
            success: true,
            data: {
                url: `${baseUrl}/${filename}`,
                filename,
                size: info.size,
                mimetype: 'image/webp'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Upload product images (saves to /uploads/products)
 * POST /api/upload/product
 */
router.post('/product', authenticate, upload.array('images', 8), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const uploadDir = path.join(__dirname, '../../../uploads/products');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const base = (process.env.BACKEND_URL || 'http://tovo-b.developteam.site/kids').replace(/\/$/, '');
        const baseUrl = `${base}/uploads/products`;

        const files = await Promise.all(req.files.map(async (file) => {
            const { data: buffer, info } = await processImage(file.buffer, {
                maxWidth: 1600,
                maxHeight: 1600,
                quality: 85
            });

            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = `product-${uniqueSuffix}.webp`;
            const filepath = path.join(uploadDir, filename);

            await fs.promises.writeFile(filepath, buffer);

            return {
                url: `${baseUrl}/${filename}`,
                filename,
                size: info.size,
                originalSize: file.buffer.length,
                savings: `${Math.round((1 - info.size / file.buffer.length) * 100)}%`
            };
        }));

        res.json({
            success: true,
            data: { files }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Upload multiple images (auto-converts to WebP) - General purpose
 * POST /api/upload/multiple
 */
router.post('/multiple', authenticate, upload.array('images', 20), convertMultipleToWebP, (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const base = (process.env.BACKEND_URL || 'http://tovo-b.developteam.site/kids').replace(/\/$/, '');
        const baseUrl = `${base}/uploads`;

        const files = req.files.map(file => ({
            url: `${baseUrl}/${file.filename}`,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            savings: `${file.savings}%`
        }));

        res.json({
            success: true,
            data: { files, count: files.length }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
