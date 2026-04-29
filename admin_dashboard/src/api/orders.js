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

// next.co.uk cart-push flow (browser extension ↔ backend audit log)
export const startNextPush = async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/next-push/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: '{}'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to start next.co.uk push');
    return data;
};

export const getNextPushHistory = async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/next-push`, {
        credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load push history');
    return data;
};

// Merged push: queue NEXT items from many orders under one correlationId.
export const startNextPushBatch = async (orderIds) => {
    const response = await fetch(`${API_BASE_URL}/orders/next-push/start-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderIds })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to start merged next.co.uk push');
    return data;
};

// Cross-order push history for a single correlationId (powers merged-push polling).
export const getNextPushByCorrelation = async (correlationId) => {
    const response = await fetch(`${API_BASE_URL}/orders/next-push/correlation/${correlationId}`, {
        credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load merged push history');
    return data;
};

// Mark one or more orders as fulfilled (post-checkout). Idempotent on already-fulfilled orders.
export const markOrdersFulfilled = async (orderIds) => {
    const response = await fetch(`${API_BASE_URL}/orders/fulfill-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderIds })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to mark orders fulfilled');
    return data;
};
