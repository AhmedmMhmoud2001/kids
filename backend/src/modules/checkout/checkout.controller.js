const cartService = require('../cart/cart.service');
const ordersService = require('../orders/orders.service');
const notificationsService = require('../notifications/notifications.service');

exports.checkout = async (req, res) => {
    try {
        const userId = req.user.id;
        const { shippingAddress, billingInfo, paymentMethod } = req.body;
        const phone = req.body.phone || billingInfo?.phone;

        if (!shippingAddress || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Shipping address and phone are required'
            });
        }

        // 1. Get Cart
        const cart = await cartService.getCart(userId);
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // 2. Prepare items for order
        const orderItems = cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
        }));

        // 3. Create Order
        const order = await ordersService.create(userId, orderItems, {
            shippingAddress,
            phone,
            paymentMethod: paymentMethod || 'COD'
        });

        // 4. Create Notification for Admins
        await notificationsService.create({
            title: 'New Order Received',
            message: `Order #${order.id} has been placed by ${req.user.firstName || 'a customer'}. Total: ${order.totalAmount} EGP`,
            type: 'ORDER',
            orderId: order.id
        });

        // 5. Clear Cart
        await cartService.clearCart(userId);

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: order
        });

    } catch (error) {
        console.error('Checkout Error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
