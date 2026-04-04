import { API_BASE_URL } from './config';

// All requests use credentials: 'include' for httpOnly cookies

export const fetchContactMessages = async () => {
    const response = await fetch(`${API_BASE_URL}/contact`, {
        credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch messages');
    return data;
};

export const deleteContactMessage = async (id) => {
    const response = await fetch(`${API_BASE_URL}/contact/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete message');
    return data;
};
