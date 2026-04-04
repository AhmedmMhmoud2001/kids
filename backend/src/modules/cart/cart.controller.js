const cartService = require('./cart.service');

exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productVariantId, productId, selectedSize, selectedColor, quantity } = req.body;

        if (!productVariantId && !productId) {
            return res.status(400).json({ message: 'Product ID or variant ID is required' });
        }
        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be >= 1' });
        }

        const item = await cartService.addToCart(userId, {
            productVariantId: productVariantId || undefined,
            productId: productId || undefined,
            selectedSize: selectedSize || undefined,
            selectedColor: selectedColor || undefined,
            quantity: parseInt(quantity)
        });
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;
        const quantity = parseInt(req.body.quantity);

        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be >= 1' });
        }

        const item = await cartService.updateItem(userId, itemId, quantity);
        res.json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.removeItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;

        await cartService.removeItem(userId, itemId);
        res.json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await cartService.getCart(userId);
        res.json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
