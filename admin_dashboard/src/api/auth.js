import { API_BASE_URL } from './config';
import { apiRequest, setCsrfToken, clearCsrfToken, startTokenRefresh, stopTokenRefresh } from './apiClient';

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

    // Persist token in localStorage for Authorization header fallback
    if (data.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
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
        await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    }

    // Clear local state
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    clearCsrfToken();
    stopTokenRefresh();
};

/**
 * Register user
 */
export const registerUser = async (userData) => {
    const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
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
    // Use apiRequest so Bearer token (localStorage) can be sent if cookies aren't available
    const response = await apiRequest('/auth/me', { method: 'GET' });

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
    const response = await apiRequest('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(userData)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Update failed');
    }
    return data;
};
