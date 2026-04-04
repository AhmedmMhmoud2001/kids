import { API_BASE_URL } from './config';

// All requests use credentials: 'include' for httpOnly cookies

const couponsApi = {
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/coupons`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch coupons');
        return data;
    },
    create: async (couponData) => {
        const response = await fetch(`${API_BASE_URL}/coupons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(couponData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to create coupon');
        return data;
    },
    update: async (id, couponData) => {
        const response = await fetch(`${API_BASE_URL}/coupons/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(couponData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update coupon');
        return data;
    },
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/coupons/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete coupon');
        return data;
    }
};

export default couponsApi;
