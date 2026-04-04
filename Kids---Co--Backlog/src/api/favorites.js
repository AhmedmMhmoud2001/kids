import { API_BASE_URL } from './config';

// All requests use credentials: 'include' for httpOnly cookies

export const fetchFavorites = async () => {
    const response = await fetch(`${API_BASE_URL}/favorites`, {
        credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch favorites');
    return data;
};

export const addToFavorites = async (productId) => {
    const response = await fetch(`${API_BASE_URL}/favorites/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to add favorite');
    return data;
};

export const removeFromFavorites = async (productId) => {
    const response = await fetch(`${API_BASE_URL}/favorites/remove/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to remove favorite');
    return data;
};
