import { API_BASE_URL } from './config';
import { setCsrfToken, clearCsrfToken, startTokenRefresh, stopTokenRefresh } from './apiClient';

/**
 * Login user
 * Token is stored in httpOnly cookie by - backend
 */
export const loginUser = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Important: receive cookies
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Login failed');
    }

    // Store CSRF token in memory
    if (data.data?.csrfToken) {
        setCsrfToken(data.data.csrfToken);
    }

    // Start automatic token refresh
    startTokenRefresh();

    return data;
};

/**
 * Logout user
 * Clears httpOnly cookie on backend
 */
export const logoutUser = async () => {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    // Clear local state
    localStorage.removeItem('user');
    clearCsrfToken();
    stopTokenRefresh();
};

/**
 * Register user
 */
export const registerUser = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
    }
    return data;
};

/**
 * Get current user
 */
export const fetchMe = async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) {
        if (response.status === 401) {
            return { success: false };
        }
        throw new Error(data.message || 'Failed to fetch user');
    }

    // If we successfully get user, start token refresh
    startTokenRefresh();

    return data;
};

/**
 * Update user profile
 */
export const updateProfile = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
        credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Update failed');
    }
    return data;
};
