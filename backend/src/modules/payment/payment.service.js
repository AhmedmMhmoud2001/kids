const Stripe = require('stripe');
const axios = require('axios');
const prisma = require('../../config/db');
const orderService = require('../orders/orders.service');

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

// Paymob API base URL
const PAYMOB_API_URL = 'https://accept.paymob.com/api';

// ============================================
// STRIPE INTEGRATION
// ============================================

/**
 * Create Stripe Payment Intent
 */
exports.createStripePaymentIntent = async (orderId, userId) => {
    if (!stripe) {
        throw new Error('Stripe is not configured. Add STRIPE_SECRET_KEY to .env');
    }

    // Get order
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId }
    });

    if (!order) {
        throw new Error('Order not found');
    }

    if (order.status === 'PAID') {
        throw new Error('Order is already paid');
    }

    // Convert to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(Number(order.totalAmount) * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'egp', // Egyptian Pound
        metadata: {
            orderId: order.id.toString(),
            userId: userId.toString()
        }
    });

    // Create payment record
    await prisma.payment.create({
        data: {
            orderId: order.id,
            provider: 'Stripe',
            status: 'PENDING',
            amount: order.totalAmount,
            transactionId: paymentIntent.id
        }
    });

    return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: order.totalAmount
    };
};

/**
 * Confirm Stripe Payment (called after frontend confirms)
 */
exports.confirmStripePayment = async (paymentIntentId) => {
    if (!stripe) {
        throw new Error('Stripe is not configured');
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
        // Update payment record
        await prisma.payment.updateMany({
            where: { transactionId: paymentIntentId },
            data: { status: 'SUCCESS' }
        });

        // Update order status (decrements stock via orderService)
        const orderId = paymentIntent.metadata.orderId;
        await orderService.updateStatus(orderId, 'PAID');

        return { success: true, status: 'PAID' };
    }

    return { success: false, status: paymentIntent.status };
};

/**
 * Handle Stripe Webhook
 */
exports.handleStripeWebhook = async (payload, signature) => {
    if (!stripe) {
        throw new Error('Stripe is not configured');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
        throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
        case 'payment_intent.succeeded':
            await handlePaymentSuccess(event.data.object, 'Stripe');
            break;
        case 'payment_intent.payment_failed':
            await handlePaymentFailed(event.data.object, 'Stripe');
            break;
    }

    return { received: true };
};

// ============================================
// PAYMOB INTEGRATION
// ============================================

/**
 * Get Paymob Auth Token
 */
const getPaymobAuthToken = async () => {
    const response = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
        api_key: process.env.PAYMOB_API_KEY
    });
    return response.data.token;
};

/**
 * Create Paymob Order
 */
const createPaymobOrder = async (authToken, order) => {
    const response = await axios.post(`${PAYMOB_API_URL}/ecommerce/orders`, {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: Math.round(Number(order.totalAmount) * 100),
        currency: 'EGP',
        merchant_order_id: order.id.toString(),
        items: []
    });
    return response.data;
};

/**
 * Get Paymob Payment Key
 */
const getPaymobPaymentKey = async (authToken, paymobOrder, order, billingData, integrationId) => {
    const response = await axios.post(`${PAYMOB_API_URL}/acceptance/payment_keys`, {
        auth_token: authToken,
        amount_cents: Math.round(Number(order.totalAmount) * 100),
        expiration: 3600, // 1 hour
        order_id: paymobOrder.id,
        billing_data: {
            apartment: billingData.apartment || 'NA',
            email: billingData.email || 'customer@example.com',
            floor: billingData.floor || 'NA',
            first_name: billingData.firstName || 'Customer',
            street: billingData.street || 'NA',
            building: billingData.building || 'NA',
            phone_number: billingData.phone || '+201000000000',
            shipping_method: 'NA',
            postal_code: billingData.postalCode || 'NA',
            city: billingData.city || 'Cairo',
            country: billingData.country || 'EG',
            last_name: billingData.lastName || 'User',
            state: billingData.state || 'Cairo'
        },
        currency: 'EGP',
        integration_id: integrationId
    });
    return response.data.token;
};

/**
 * Initialize Paymob Payment (Card)
 */
exports.initializePaymobCardPayment = async (orderId, userId, billingData) => {
    if (!process.env.PAYMOB_API_KEY || !process.env.PAYMOB_CARD_INTEGRATION_ID) {
        throw new Error('Paymob is not configured. Add PAYMOB_API_KEY and PAYMOB_CARD_INTEGRATION_ID to .env');
    }

    // Get order
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: { user: true }
    });

    if (!order) {
        throw new Error('Order not found');
    }

    if (order.status === 'PAID') {
        throw new Error('Order is already paid');
    }

    // Step 1: Get auth token
    const authToken = await getPaymobAuthToken();

    // Step 2: Create order in Paymob
    const paymobOrder = await createPaymobOrder(authToken, order);

    // Step 3: Get payment key
    const paymentKey = await getPaymobPaymentKey(
        authToken,
        paymobOrder,
        order,
        {
            ...billingData,
            email: order.user?.email,
            firstName: order.user?.firstName,
            lastName: order.user?.lastName
        },
        process.env.PAYMOB_CARD_INTEGRATION_ID
    );

    // Create payment record
    await prisma.payment.create({
        data: {
            orderId: order.id,
            provider: 'Paymob',
            status: 'PENDING',
            amount: order.totalAmount,
            transactionId: paymobOrder.id.toString()
        }
    });

    // Return iframe URL for card payment
    return {
        iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`,
        paymentKey,
        paymobOrderId: paymobOrder.id
    };
};

/**
 * Initialize Paymob Mobile Wallet Payment (Vodafone Cash, etc.)
 */
exports.initializePaymobWalletPayment = async (orderId, userId, phoneNumber) => {
    if (!process.env.PAYMOB_API_KEY || !process.env.PAYMOB_WALLET_INTEGRATION_ID) {
        throw new Error('Paymob wallet is not configured. Add PAYMOB_WALLET_INTEGRATION_ID to .env');
    }

    // Get order
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: { user: true }
    });

    if (!order) {
        throw new Error('Order not found');
    }

    // Step 1: Get auth token
    const authToken = await getPaymobAuthToken();

    // Step 2: Create order
    const paymobOrder = await createPaymobOrder(authToken, order);

    // Step 3: Get payment key
    const paymentKey = await getPaymobPaymentKey(
        authToken,
        paymobOrder,
        order,
        {
            email: order.user?.email || 'customer@example.com',
            firstName: order.user?.firstName || 'Customer',
            lastName: order.user?.lastName || 'User',
            phone: phoneNumber
        },
        process.env.PAYMOB_WALLET_INTEGRATION_ID
    );

    // Step 4: Pay with wallet
    const response = await axios.post(`${PAYMOB_API_URL}/acceptance/payments/pay`, {
        source: {
            identifier: phoneNumber,
            subtype: 'WALLET'
        },
        payment_token: paymentKey
    });

    // Create payment record
    await prisma.payment.create({
        data: {
            orderId: order.id,
            provider: 'Paymob',
            status: 'PENDING',
            amount: order.totalAmount,
            transactionId: paymobOrder.id.toString()
        }
    });

    return {
        redirectUrl: response.data.redirect_url,
        paymobOrderId: paymobOrder.id
    };
};

/**
 * Handle Paymob Callback/Webhook
 */
exports.handlePaymobCallback = async (data) => {
    const { success, order: paymobOrderId, amount_cents } = data;

    // Find payment by paymob order ID
    const payment = await prisma.payment.findFirst({
        where: { transactionId: paymobOrderId?.toString() }
    });

    if (!payment) {
        console.error('Payment not found for Paymob order:', paymobOrderId);
        return { success: false };
    }

    if (success === 'true' || success === true) {
        // Update payment
        await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'SUCCESS' }
        });

        // Update order (decrements stock via orderService)
        await orderService.updateStatus(payment.orderId, 'PAID');

        return { success: true, orderId: payment.orderId };
    } else {
        // Update payment as failed
        await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED' }
        });

        return { success: false, orderId: payment.orderId };
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Handle successful payment
 */
const handlePaymentSuccess = async (paymentData, provider) => {
    const transactionId = provider === 'Stripe' ? paymentData.id : paymentData.order?.toString();

    const payment = await prisma.payment.findFirst({
        where: { transactionId }
    });

    if (payment) {
        await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'SUCCESS' }
        });

        await orderService.updateStatus(payment.orderId, 'PAID');
    }
};

/**
 * Handle failed payment
 */
const handlePaymentFailed = async (paymentData, provider) => {
    const transactionId = provider === 'Stripe' ? paymentData.id : paymentData.order?.toString();

    const payment = await prisma.payment.findFirst({
        where: { transactionId }
    });

    if (payment) {
        await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED' }
        });
    }
};

/**
 * Get payment status for order
 */
exports.getPaymentStatus = async (orderId, userId) => {
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: {
            payments: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });

    if (!order) {
        throw new Error('Order not found');
    }

    const latestPayment = order.payments[0];

    return {
        orderStatus: order.status,
        paymentStatus: latestPayment?.status || 'NOT_INITIATED',
        paymentProvider: latestPayment?.provider || null,
        amount: order.totalAmount
    };
};
