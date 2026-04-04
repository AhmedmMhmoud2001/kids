const express = require('express');
const router = express.Router();
const authRoutes = require('./modules/auth/auth.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const categoriesRoutes = require('./modules/categories/categories.routes');
const productsRoutes = require('./modules/products/products.routes');
const ordersRoutes = require('./modules/orders/orders.routes');
const couponsRoutes = require('./modules/coupons/coupons.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);
router.use('/orders', ordersRoutes);
router.use('/coupons', couponsRoutes);
router.use('/users', require('./modules/users/users.routes'));
router.use('/cart', require('./modules/cart/cart.routes'));
router.use('/favorites', require('./modules/favorites/favorites.routes'));
router.use('/brands', require('./modules/brands/brands.routes'));
router.use('/upload', require('./modules/upload/upload.routes'));
router.use('/checkout', require('./modules/checkout/checkout.routes'));
router.use('/payment', require('./modules/payment/payment.routes'));
router.use('/static-pages', require('./modules/static-pages/static-pages.routes'));
router.use('/contact', require('./modules/contact-messages/contact.routes'));
router.use('/settings', require('./modules/settings/settings.routes'));
router.use('/notifications', require('./modules/notifications/notifications.routes'));
router.use('/rbac', require('./modules/rbac/rbac.routes'));

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

module.exports = router;
