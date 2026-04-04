const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { verifyPaymobHmacMiddleware } = require('../../utils/security');

// ============================================
// PUBLIC ROUTES (Webhooks & Callbacks)
// ============================================

// Stripe webhook (needs raw body)
router.post('/stripe/webhook', 
    express.raw({ type: 'application/json' }),
    paymentController.stripeWebhook
);

// Paymob callback (redirect from Paymob) - HMAC verified
router.get('/paymob/callback', verifyPaymobHmacMiddleware, paymentController.paymobCallback);

// Paymob webhook (server-to-server) - HMAC verified
router.post('/paymob/webhook', verifyPaymobHmacMiddleware, paymentController.paymobWebhook);

// ============================================
// PROTECTED ROUTES (Require Authentication)
// ============================================

// Get available payment methods
router.get('/methods', paymentController.getPaymentMethods);

// Get payment status for order
router.get('/status/:orderId', authenticate, paymentController.getPaymentStatus);

// Stripe
router.post('/stripe/create-intent', authenticate, paymentController.createStripeIntent);
router.post('/stripe/confirm', authenticate, paymentController.confirmStripePayment);

// Paymob
router.post('/paymob/card', authenticate, paymentController.initPaymobCard);
router.post('/paymob/wallet', authenticate, paymentController.initPaymobWallet);

module.exports = router;
