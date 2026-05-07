import { apiRequest } from './apiClient';

// Requests go through apiRequest to attach CSRF + auth headers + cookies.

export const createOrder = async (orderData) => {
    const response = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
    });
    return await response.json();
};

export const fetchMyOrders = async () => {
    const response = await apiRequest('/orders', { method: 'GET' });
    return await response.json();
};

export const fetchOrderById = async (id) => {
    const response = await apiRequest(`/orders/${id}`, { method: 'GET' });
    return await response.json();
};

export const updateOrderDetails = async (id, data) => {
    const response = await apiRequest(`/orders/${id}/details`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
    return await response.json();
};

export const updateOrderItems = async (id, items) => {
    const response = await apiRequest(`/orders/${id}/items`, {
        method: 'PATCH',
        body: JSON.stringify({ items })
    });
    return await response.json();
};

/** Cancel order (customer only, PENDING orders). */
export const cancelOrder = async (id) => {
    const response = await apiRequest(`/orders/${id}/cancel`, { method: 'PATCH' });
    return await response.json();
};

/** Request return (customer only, DELIVERED orders, at least 24h after delivery). */
export const requestReturn = async (id, returnReason = null) => {
    const response = await apiRequest(`/orders/${id}/request-return`, {
        method: 'PATCH',
        body: JSON.stringify({ returnReason: returnReason || null })
    });
    return await response.json();
};
