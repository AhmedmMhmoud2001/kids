import { API_BASE_URL } from './config';

// All requests use credentials: 'include' for httpOnly cookies

export const validateCoupon = async (code, amount) => {
    const response = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, amount })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to validate coupon');
    return data;
};
