const favoritesService = require('./favorites.service');
const prisma = require('../../config/db');

exports.add = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        // Verify Check
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product || !product.isActive) return res.status(400).json({ message: 'Invalid product' });

        const fav = await favoritesService.add(userId, productId);
        res.status(201).json({ success: true, data: fav });
    } catch (error) {
        // Handle duplicate
        if (error.code === 'P2002') {
            return res.status(200).json({ message: 'Already favorited' }); // Idempotent-ish
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        await favoritesService.remove(userId, productId);
        res.json({ success: true, message: 'Removed from favorites' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Not found in favorites' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const userId = req.user.id;
        const favs = await favoritesService.getAll(userId);
        res.json({ success: true, data: favs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
