import { API_BASE_URL } from './config';

// All requests use credentials: 'include' for httpOnly cookies

/**
 * Get available payment methods
 */
export const getPaymentMethods = async () => {
    const response = await fetch(`${API_BASE_URL}/payment/methods`, {
        credentials: 'include'
    });
    return response.json();
};

/**
 * Get payment status for an order
 */
export const getPaymentStatus = async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/payment/status/${orderId}`, {
        credentials: 'include'
    });
    return response.json();
};

// ============================================
// STRIPE
// ============================================

/**
 * Create Stripe Payment Intent
 */
export const createStripePaymentIntent = async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/payment/stripe/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId })
    });
    return response.json();
};

/**
 * Confirm Stripe Payment
 */
export const confirmStripePayment = async (paymentIntentId) => {
    const response = await fetch(`${API_BASE_URL}/payment/stripe/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentIntentId })
    });
    return response.json();
};

// ============================================
// PAYMOB
// ============================================

/**
 * Initialize Paymob Card Payment
 */
export const initPaymobCardPayment = async (orderId, billingData = {}) => {
    const response = await fetch(`${API_BASE_URL}/payment/paymob/card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, billingData })
    });
    return response.json();
};

/**
 * Initialize Paymob Wallet Payment (Vodafone Cash, etc.)
 */
export const initPaymobWalletPayment = async (orderId, phoneNumber) => {
    const response = await fetch(`${API_BASE_URL}/payment/paymob/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, phoneNumber })
    });
    return response.json();
};
