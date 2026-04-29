const orderService = require('./orders.service');
const cartService = require('../cart/cart.service');
const notificationsService = require('../notifications/notifications.service');

// Create Order (Customer)
exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            items,
            paymentMethod,
            notes,
            billingInfo,
            shippingAddress,
            shippingFee,
            discount,
            couponCode
        } = req.body;

        const phone = req.body.phone || billingInfo?.phone;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in order' });
        }

        const order = await orderService.create(userId, items, {
            paymentMethod,
            notes,
            billingInfo,
            shippingAddress,
            shippingFee,
            discount,
            couponCode,
            phone
        });

        // Add Notification for Admins
        try {
            await notificationsService.create({
                title: 'New Order Received',
                message: `Order #${order.id} has been placed. Total: ${order.totalAmount} EGP`,
                type: 'ORDER',
                orderId: order.id
            });
        } catch (notifErr) {
            console.error('Failed to create notification:', notifErr);
        }

        // Clear Cart
        try {
            await cartService.clearCart(userId);
        } catch (cartErr) {
            console.error('Failed to clear cart:', cartErr);
        }

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get All Orders (Dashboard / My Orders)
exports.getAllOrders = async (req, res) => {
    try {
        const user = req.user;
        const { audience } = req.query;
        let where = {};
        let itemWhere = {};

        if (user.role === 'CUSTOMER') {
            where.userId = user.id;
        } else if (user.role === 'ADMIN_KIDS' || (user.role === 'SYSTEM_ADMIN' && audience === 'KIDS')) {
            where.items = { some: { product: { audience: 'KIDS' } } };
            itemWhere.product = { audience: 'KIDS' };
        } else if (user.role === 'ADMIN_NEXT' || (user.role === 'SYSTEM_ADMIN' && audience === 'NEXT')) {
            where.items = { some: { product: { audience: 'NEXT' } } };
            itemWhere.product = { audience: 'NEXT' };
        } else if (user.role === 'SYSTEM_ADMIN') {
        } else {
            return res.status(403).json({ message: 'Unauthorized access to orders' });
        }

        const orders = await orderService.findAll(where, itemWhere);
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('GET /api/orders error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};

// Get Single Order
exports.getOrderById = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Invalid order ID' });
        }
        const user = req.user;
        const { audience } = req.query;

        const orderCheck = await orderService.findOne(id);
        if (!orderCheck) return res.status(404).json({ message: 'Order not found' });

        if (user.role === 'CUSTOMER' && orderCheck.userId !== user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        let itemWhere = {};
        if (user.role === 'ADMIN_KIDS' || (user.role === 'SYSTEM_ADMIN' && audience === 'KIDS')) {
            itemWhere.product = { audience: 'KIDS' };
        } else if (user.role === 'ADMIN_NEXT' || (user.role === 'SYSTEM_ADMIN' && audience === 'NEXT')) {
            itemWhere.product = { audience: 'NEXT' };
        }

        const order = await orderService.findOne(id, itemWhere);
        res.json({ success: true, data: order });
    } catch (error) {
        const code = error.statusCode || (error.message && (error.message.includes('not found') || error.message.includes('Invalid') ? 400 : 500));
        res.status(code).json({ success: false, message: error.message || 'Failed to load order' });
    }
};

// Cancel Order by Customer (only PENDING, own order)
exports.cancelOrderByCustomer = async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;
        const orderCheck = await orderService.findOne(id);
        if (!orderCheck) return res.status(404).json({ success: false, message: 'Order not found' });
        if (orderCheck.userId !== user.id) return res.status(403).json({ success: false, message: 'Access denied' });
        if (orderCheck.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: 'Only PENDING orders can be cancelled' });
        }
        const order = await orderService.updateStatus(id, 'CANCELED', 'Cancelled by customer', null);
        res.json({ success: true, data: order });
    } catch (error) {
        const message = error.message || 'Failed to cancel order';
        res.status(400).json({ success: false, message });
    }
};

// Request return (customer): only if order is DELIVERED and at least 24h since delivery
exports.requestReturnByCustomer = async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;
        const { returnReason } = req.body || {};
        const order = await orderService.requestReturnByCustomer(id, user.id, returnReason || null);
        res.json({ success: true, data: order });
    } catch (error) {
        const message = error.message || 'Failed to request return';
        const code = error.message && (error.message.includes('not found') || error.message.includes('denied') || error.message.includes('only')) ? 400 : 500;
        res.status(code).json({ success: false, message });
    }
};

// Update Order Status
exports.updateOrderStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status, cancelReason, returnReason } = req.body;
        if (status == null || status === '') {
            return res.status(400).json({ success: false, message: 'status is required' });
        }
        const order = await orderService.updateStatus(id, status, cancelReason, returnReason);
        res.json({ success: true, data: order });
    } catch (error) {
        console.error('[updateOrderStatus]', error.message || error);
        const message = error.message || 'Failed to update order status';
        const code = error.message && (error.message.includes('not found') || error.message.includes('Invalid status')) ? 400 : 500;
        res.status(code).json({ success: false, message });
    }
};

exports.updateOrderDetails = async (req, res) => {
    try {
        const id = req.params.id;
        const { phone, notes, shippingAddress, billingInfo } = req.body;
        const user = req.user;

        // Security check for CUSTOMER
        const orderCheck = await orderService.findOne(id);
        if (!orderCheck) return res.status(404).json({ message: 'Order not found' });

        if (user.role === 'CUSTOMER') {
            if (orderCheck.userId !== user.id) {
                return res.status(403).json({ message: 'Access denied' });
            }
            const orderStatus = String(orderCheck.status || '').toUpperCase().trim();
            const editableStatuses = ['PENDING', 'CONFIRMED', 'PAID'];
            if (!editableStatuses.includes(orderStatus)) {
                return res.status(400).json({ message: 'Only PENDING, CONFIRMED or PAID orders can be modified' });
            }
        }

        const order = await orderService.updateOrderDetails(id, {
            phone,
            notes,
            shippingAddress,
            billingInfo
        });
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateOrderItems = async (req, res) => {
    try {
        const id = req.params.id;
        const { items } = req.body;
        const user = req.user;

        const orderCheck = await orderService.findOne(id);
        if (!orderCheck) return res.status(404).json({ message: 'Order not found' });

        if (user.role === 'CUSTOMER') {
            if (orderCheck.userId !== user.id) {
                return res.status(403).json({ message: 'Access denied' });
            }
            const orderStatus = String(orderCheck.status || '').toUpperCase().trim();
            const editableStatuses = ['PENDING', 'CONFIRMED', 'PAID'];
            if (!editableStatuses.includes(orderStatus)) {
                return res.status(400).json({ message: 'Only PENDING, CONFIRMED or PAID orders can be modified' });
            }
        }

        // If user removed all items and order is PENDING → delete the order
        const orderStatusItems = String(orderCheck.status || '').toUpperCase().trim();
        if (Array.isArray(items) && items.length === 0 && orderStatusItems === 'PENDING') {
            await orderService.deleteOrder(id);
            return res.json({ success: true, data: null, deleted: true });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Order must have at least one item' });
        }

        const order = await orderService.updateOrderItems(id, items);
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Mark Orders Fulfilled (Admins) — batch-aware, idempotent
exports.markOrdersFulfilled = async (req, res) => {
    try {
        const { orderIds } = req.body || {};
        const userId = req.user?.id || null;
        const data = await orderService.markFulfilled(orderIds, userId);
        res.json({ success: true, data });
    } catch (error) {
        const status = error.statusCode || 400;
        res.status(status).json({ success: false, message: error.message });
    }
};

// Delete Order (Admins only)
exports.deleteOrder = async (req, res) => {
    try {
        const id = req.params.id;

        const orderCheck = await orderService.findOne(id);
        if (!orderCheck) return res.status(404).json({ message: 'Order not found' });

        await orderService.deleteOrder(id);
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
