const prisma = require('../../config/db');

// Add Item – supports productVariantId (price/stock per color+size) or legacy productId+selectedSize+selectedColor
exports.addToCart = async (userId, data) => {
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) cart = await prisma.cart.create({ data: { userId } });

    const quantity = Math.max(1, parseInt(data.quantity) || 1);

    if (data.productVariantId) {
        const variantId = data.productVariantId;
        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            include: { product: true, color: true, size: true }
        });
        if (!variant) throw new Error('Variant not found');
        if (!variant.product.isActive) throw new Error('Product is not active');
        if (variant.stock < quantity) throw new Error(`Only ${variant.stock} in stock`);

        let existing = await prisma.cartItem.findFirst({
            where: { cartId: cart.id, productVariantId: variantId }
        });
        if (existing) {
            const newQty = existing.quantity + quantity;
            if (variant.stock < newQty) throw new Error(`Only ${variant.stock} in stock`);
            return prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: newQty },
                include: { productVariant: { include: { product: true, color: true, size: true } }, product: true }
            });
        }
        return prisma.cartItem.create({
            data: { cartId: cart.id, productVariantId: variantId, quantity },
            include: { productVariant: { include: { product: true, color: true, size: true } }, product: true }
        });
    }

    // Legacy: productId + selectedSize + selectedColor – resolve variant by color/size so price is correct
    const productId = data.productId;
    if (!productId) throw new Error('Product ID or variant ID is required');
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');
    if (!product.isActive) throw new Error('Product is not active');

    const colorName = (data.selectedColor || '').toString().trim();
    const sizeName = (data.selectedSize || '').toString().trim();
    const variant = colorName && sizeName
        ? await prisma.productVariant.findFirst({
            where: {
                productId,
                color: { name: colorName },
                size: { name: sizeName }
            },
            include: { product: true, color: true, size: true }
        })
        : null;

    if (variant) {
        let existing = await prisma.cartItem.findFirst({
            where: { cartId: cart.id, productVariantId: variant.id }
        });
        if (existing) {
            const newQty = existing.quantity + quantity;
            if (variant.stock < newQty) throw new Error(`Only ${variant.stock} in stock`);
            return prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: newQty },
                include: { productVariant: { include: { product: true, color: true, size: true } }, product: true }
            });
        }
        if (variant.stock < quantity) throw new Error(`Only ${variant.stock} in stock`);
        return prisma.cartItem.create({
            data: { cartId: cart.id, productVariantId: variant.id, quantity },
            include: { productVariant: { include: { product: true, color: true, size: true } }, product: true }
        });
    }

    const stock = product.stock ?? 0;
    if (stock < quantity) throw new Error(`Only ${stock} in stock`);
    const existingItem = await prisma.cartItem.findFirst({
        where: {
            cartId: cart.id,
            productId,
            selectedSize: data.selectedSize || null,
            selectedColor: data.selectedColor || null
        }
    });
    if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        if (stock < newQty) throw new Error(`Only ${stock} in stock`);
        return prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQty },
            include: { product: true }
        });
    }
    return prisma.cartItem.create({
        data: {
            cartId: cart.id,
            productId,
            quantity,
            selectedSize: data.selectedSize || null,
            selectedColor: data.selectedColor || null
        },
        include: { product: true }
    });
};

// Update Item Quantity (quantity must not exceed variant stock)
exports.updateItem = async (userId, itemId, quantity) => {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new Error('Cart not found');

    const item = await prisma.cartItem.findFirst({
        where: {
            id: itemId,
            cartId: cart.id
        },
        include: { productVariant: true, product: true }
    });

    if (!item) throw new Error('Item not found in your cart');

    if (item.productVariantId && item.productVariant) {
        if (item.productVariant.stock < qty) {
            throw new Error(`Only ${item.productVariant.stock} in stock`);
        }
    } else if (item.productId && (item.selectedColor || item.selectedSize)) {
        const variant = await prisma.productVariant.findFirst({
            where: {
                productId: item.productId,
                ...(item.selectedColor && { color: { name: item.selectedColor } }),
                ...(item.selectedSize && { size: { name: item.selectedSize } })
            }
        });
        if (variant && variant.stock < qty) throw new Error(`Only ${variant.stock} in stock`);
    }

    return prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: qty },
        include: { productVariant: { include: { product: true, color: true, size: true } }, product: true }
    });
};

// Remove Item
exports.removeItem = async (userId, itemId) => {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new Error('Cart not found');

    const item = await prisma.cartItem.findFirst({
        where: {
            id: itemId,
            cartId: cart.id
        }
    });

    if (!item) throw new Error('Item not found in your cart');

    return prisma.cartItem.delete({
        where: { id: item.id }
    });
};

// Get Cart
// Include category (for exchangeRateToEgp) so frontend can always display EGP prices,
// and include colorImages for per-colour thumbnails.
// Also include variants so the frontend can resolve the selected variant's normalized price.
const productIncludeWithColorImages = {
    include: {
        category: true,
        brandRel: true,
        variants: { include: { color: true, size: true } },
        colorImages: { include: { color: true }, orderBy: { order: 'asc' } }
    }
};

exports.getCart = async (userId) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: productIncludeWithColorImages,
                    productVariant: {
                        include: {
                            product: productIncludeWithColorImages,
                            color: true,
                            size: true
                        }
                    }
                }
            }
        }
    });
    return cart || { items: [] };
};

// Clear Cart
exports.clearCart = async (userId) => {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;

    return prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
    });
};
