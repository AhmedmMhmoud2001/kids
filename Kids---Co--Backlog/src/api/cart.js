import { API_BASE_URL } from './config';
import { apiRequest } from './apiClient';

// Requests go through apiRequest to attach auth headers (Bearer) + cookies.

export const fetchCart = async () => {
    const response = await apiRequest('/cart', { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch cart');
    return data;
};

export const addToCart = async (productId, quantity, selectedSize = null, selectedColor = null, productVariantId = null) => {
    const body = productVariantId
        ? { productVariantId: productVariantId, quantity: parseInt(quantity) }
        : { productId: productId, quantity: parseInt(quantity), selectedSize: selectedSize || undefined, selectedColor: selectedColor || undefined };
    const response = await apiRequest('/cart/add', {
        method: 'POST',
        body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to add to cart');
    return data;
};

export const updateCartItem = async (itemId, quantity) => {
    const response = await apiRequest(`/cart/update/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: parseInt(quantity) }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update cart item');
    return data;
};

export const removeCartItem = async (itemId) => {
    const response = await apiRequest(`/cart/remove/${itemId}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to remove cart item');
    return data;
};
