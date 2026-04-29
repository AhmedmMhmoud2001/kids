const express = require('express');
const router = express.Router();
const ordersController = require('./orders.controller');
const nextPushRoutes = require('./next-push/next-push.routes');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

// next.co.uk cart-push routes (mounted first so /next-push/* doesn't clash with /:id/status etc)
router.use('/', nextPushRoutes);

// Batch mark orders as fulfilled (literal path so it doesn't shadow /:id/...)
router.post('/fulfill-batch',
    authenticate,
    authorize(['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT']),
    ordersController.markOrdersFulfilled
);

// Create Order (Customer)
router.post('/', authenticate, ordersController.createOrder);

// Get All Orders (Customer: own, Admins: filtered)
router.get('/', authenticate, ordersController.getAllOrders);

// Get Single Order
router.get('/:id', authenticate, ordersController.getOrderById);

// Update Order Status (Admins)
router.patch('/:id/status',
    authenticate,
    authorize(['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT']),
    ordersController.updateOrderStatus
);

// Cancel Order (Customer: own PENDING order only)
router.patch('/:id/cancel',
    authenticate,
    ordersController.cancelOrderByCustomer
);

// Request return (Customer: own DELIVERED order only, after 24h since delivery)
router.patch('/:id/request-return',
    authenticate,
    ordersController.requestReturnByCustomer
);

// Update Order Details (Admins & Customers)
router.patch('/:id/details',
    authenticate,
    authorize(['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT', 'CUSTOMER']),
    ordersController.updateOrderDetails
);

// Update Order Items (Admins & Customers)
router.patch('/:id/items',
    authenticate,
    authorize(['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT', 'CUSTOMER']),
    ordersController.updateOrderItems
);

// Delete Order (Admins only)
router.delete('/:id',
    authenticate,
    authorize(['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT']),
    ordersController.deleteOrder
);

module.exports = router;
