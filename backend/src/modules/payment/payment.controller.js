const paymentService = require('./payment.service');

// ============================================
// STRIPE ENDPOINTS
// ============================================

/**
 * Create Stripe Payment Intent
 * POST /api/payment/stripe/create-intent
 */
exports.createStripeIntent = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user.id;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        const result = await paymentService.createStripePaymentIntent(orderId, userId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Stripe intent error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Confirm Stripe Payment
 * POST /api/payment/stripe/confirm
 */
exports.confirmStripePayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({
                success: false,
                message: 'Payment Intent ID is required'
            });
        }

        const result = await paymentService.confirmStripePayment(paymentIntentId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Stripe confirm error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Handle Stripe Webhook
 * POST /api/payment/stripe/webhook
 */
exports.stripeWebhook = async (req, res) => {
    try {
        const signature = req.headers['stripe-signature'];
        const result = await paymentService.handleStripeWebhook(req.rawBody, signature);

        res.json(result);
    } catch (error) {
        console.error('Stripe webhook error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// PAYMOB ENDPOINTS
// ============================================

/**
 * Initialize Paymob Card Payment
 * POST /api/payment/paymob/card
 */
exports.initPaymobCard = async (req, res) => {
    try {
        const { orderId, billingData } = req.body;
        const userId = req.user.id;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        const result = await paymentService.initializePaymobCardPayment(orderId, userId, billingData || {});

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Paymob card error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Initialize Paymob Wallet Payment (Vodafone Cash, etc.)
 * POST /api/payment/paymob/wallet
 */
exports.initPaymobWallet = async (req, res) => {
    try {
        const { orderId, phoneNumber } = req.body;
        const userId = req.user.id;

        if (!orderId || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and phone number are required'
            });
        }

        const result = await paymentService.initializePaymobWalletPayment(orderId, userId, phoneNumber);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Paymob wallet error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Handle Paymob Callback (Transaction processed callback)
 * GET /api/payment/paymob/callback
 */
exports.paymobCallback = async (req, res) => {
    try {
        const result = await paymentService.handlePaymobCallback(req.query);

        // Redirect to frontend based on result
        const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';

        if (result.success) {
            res.redirect(`${frontendUrl}/payment-success?orderId=${result.orderId}`);
        } else {
            res.redirect(`${frontendUrl}/payment-failed?orderId=${result.orderId}`);
        }
    } catch (error) {
        console.error('Paymob callback error:', error);
        const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/payment-failed`);
    }
};

/**
 * Handle Paymob Webhook (Server-to-server notification)
 * POST /api/payment/paymob/webhook
 */
exports.paymobWebhook = async (req, res) => {
    try {
        // Verify HMAC (optional but recommended)
        // const hmac = req.query.hmac;
        // TODO: Verify HMAC signature

        const result = await paymentService.handlePaymobCallback(req.body.obj);

        res.json({ success: true });
    } catch (error) {
        console.error('Paymob webhook error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GENERAL ENDPOINTS
// ============================================

/**
 * Get Payment Status
 * GET /api/payment/status/:orderId
 */
exports.getPaymentStatus = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.user.id;

        const status = await paymentService.getPaymentStatus(orderId, userId);

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get available payment methods
 * GET /api/payment/methods
 */
exports.getPaymentMethods = async (req, res) => {
    const methods = [];

    // COD is always available
    methods.push({
        id: 'cod',
        name: 'Cash on Delivery',
        nameAr: 'الدفع عند الاستلام',
        available: true
    });

    // Check Stripe
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY) {
        methods.push({
            id: 'stripe',
            name: 'Credit/Debit Card (Stripe)',
            nameAr: 'بطاقة ائتمان (Stripe)',
            available: true
        });
    }

    // Check Paymob Card
    if (process.env.PAYMOB_API_KEY && process.env.PAYMOB_CARD_INTEGRATION_ID) {
        methods.push({
            id: 'paymob_card',
            name: 'Credit/Debit Card (Paymob)',
            nameAr: 'بطاقة ائتمان (Paymob)',
            available: true
        });
    }

    // Check Paymob Wallet
    if (process.env.PAYMOB_API_KEY && process.env.PAYMOB_WALLET_INTEGRATION_ID) {
        methods.push({
            id: 'paymob_wallet',
            name: 'Mobile Wallet (Vodafone Cash, etc.)',
            nameAr: 'محفظة إلكترونية (فودافون كاش)',
            available: true
        });
    }

    res.json({
        success: true,
        data: methods
    });
};
