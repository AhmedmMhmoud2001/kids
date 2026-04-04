const express = require('express');
const router = express.Router();

const couponsController = require('./coupons.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

// Public/User routes
router.post('/validate', authenticate, couponsController.validateCoupon);

// All coupon routes below are for admins only (currently SYSTEM_ADMIN)
const adminRoles = ['SYSTEM_ADMIN'];

// List all coupons
router.get(
    '/',
    authenticate,
    authorize(adminRoles),
    couponsController.getAllCoupons,
);

// Get single coupon
router.get(
    '/:id',
    authenticate,
    authorize(adminRoles),
    couponsController.getCouponById,
);

// Create coupon
router.post(
    '/',
    authenticate,
    authorize(adminRoles),
    couponsController.createCoupon,
);

// Update coupon
router.put(
    '/:id',
    authenticate,
    authorize(adminRoles),
    couponsController.updateCoupon,
);

// Delete coupon
router.delete(
    '/:id',
    authenticate,
    authorize(adminRoles),
    couponsController.deleteCoupon,
);

module.exports = router;


