import { API_BASE_URL } from './config';
import { apiRequest } from './apiClient';

// Requests go through apiRequest to attach auth headers (Bearer) + cookies.

export const fetchFavorites = async () => {
    const response = await apiRequest('/favorites', { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch favorites');
    return data;
};

export const addToFavorites = async (productId) => {
    const response = await apiRequest('/favorites/add', {
        method: 'POST',
        body: JSON.stringify({ productId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to add favorite');
    return data;
};

export const removeFromFavorites = async (productId) => {
    const response = await apiRequest(`/favorites/remove/${productId}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to remove favorite');
    return data;
};
