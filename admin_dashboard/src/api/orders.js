import { API_BASE_URL } from './config';

// All requests use credentials: 'include' for httpOnly cookies

export const fetchOrders = async (audience = null) => {
    const audienceParam = audience && typeof audience === 'string' ? audience : null;
    const url = audienceParam
        ? `${API_BASE_URL}/orders?audience=${audienceParam}`
        : `${API_BASE_URL}/orders`;

    const response = await fetch(url, {
        credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch orders');
    return data;
};

export const fetchOrderById = async (id, audience = null) => {
    const url = audience
        ? `${API_BASE_URL}/orders/${id}?audience=${audience}`
        : `${API_BASE_URL}/orders/${id}`;

    const response = await fetch(url, {
        credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch order');
    return data;
};

export const updateOrderStatus = async (id, status, cancelReason = null, returnReason = null) => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, cancelReason, returnReason })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update order status');
    return data;
};

export const updateOrderDetails = async (id, details) => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(details)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update order details');
    return data;
};

export const updateOrderItems = async (id, items) => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update order items');
    return data;
};

export const deleteOrder = async (id) => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete order');
    return data;
};
