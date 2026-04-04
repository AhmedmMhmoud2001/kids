/**
 * API Client with httpOnly Cookie Support & Auto Token Refresh
 * Handles authentication via httpOnly cookies
 * Automatically refreshes tokens before expiry
 */

import { API_BASE_URL, TOKEN_REFRESH_INTERVAL } from './config';

// Store CSRF token in memory (not localStorage for security)
let csrfToken = null;
let refreshPromise = null;
let refreshTimer = null;

/**
 * Get CSRF token from server
 */
export const getCsrfToken = async () => {
    if (csrfToken) return csrfToken;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            csrfToken = data.data.csrfToken;
        }
        return csrfToken;
    } catch (error) {
        console.error('Failed to get CSRF token:', error);
        return null;
    }
};

/**
 * Set CSRF token (called after login/verify)
 */
export const setCsrfToken = (token) => {
    csrfToken = token;
};

/**
 * Clear CSRF token (called on logout)
 */
export const clearCsrfToken = () => {
    csrfToken = null;
    stopTokenRefresh();
};

/**
 * Refresh access token using refresh token cookie
 */
export const refreshAccessToken = async () => {
    // Prevent multiple simultaneous refresh requests
    if (refreshPromise) {
        return refreshPromise;
    }
    
    refreshPromise = (async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Token refresh failed');
            }
            
            // Token is refreshed via httpOnly cookie
            // Restart refresh timer
            startTokenRefresh();
            
            return data;
        } catch (error) {
            console.error('Token refresh failed:', error);
            // Clear state and dispatch event
            clearCsrfToken();
            localStorage.removeItem('user');
            window.dispatchEvent(new CustomEvent('auth:expired'));
            throw error;
        } finally {
            refreshPromise = null;
        }
    })();
    
    return refreshPromise;
};

/**
 * Start automatic token refresh timer
 */
export const startTokenRefresh = () => {
    stopTokenRefresh();
    
    // Refresh token before it expires
    refreshTimer = setInterval(async () => {
        try {
            await refreshAccessToken();
        } catch (error) {
            // Error handled in refreshAccessToken
        }
    }, TOKEN_REFRESH_INTERVAL);
};

/**
 * Stop automatic token refresh
 */
export const stopTokenRefresh = () => {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
};

/**
 * Make an API request with credentials
 * @param {string} endpoint - API endpoint (e.g., '/auth/me')
 * @param {Object} options - Fetch options
 */
export const apiRequest = async (endpoint, options = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // Add CSRF token for state-changing requests
    const methodsNeedingCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (methodsNeedingCsrf.includes(options.method?.toUpperCase())) {
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }
    }
    
    let response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include' // Important: include cookies in requests
    });
    
    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401) {
        const data = await response.json();
        
        if (data.code === 'TOKEN_EXPIRED') {
            try {
                // Try to refresh the token
                await refreshAccessToken();
                
                // Retry the original request
                response = await fetch(url, {
                    ...options,
                    headers,
                    credentials: 'include'
                });
            } catch (refreshError) {
                // Refresh failed
                throw new Error('Session expired. Please log in again.');
            }
        } else {
            // Other auth errors
            clearCsrfToken();
            localStorage.removeItem('user');
            window.dispatchEvent(new CustomEvent('auth:expired'));
            throw new Error(data.message || 'Unauthorized');
        }
    }
    
    return response;
};

/**
 * GET request
 */
export const get = async (endpoint) => {
    const response = await apiRequest(endpoint, { method: 'GET' });
    return response.json();
};

/**
 * POST request
 */
export const post = async (endpoint, data) => {
    const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response.json();
};

/**
 * PUT request
 */
export const put = async (endpoint, data) => {
    const response = await apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return response.json();
};

/**
 * PATCH request
 */
export const patch = async (endpoint, data) => {
    const response = await apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
    return response.json();
};

/**
 * DELETE request
 */
export const del = async (endpoint) => {
    const response = await apiRequest(endpoint, { method: 'DELETE' });
    return response.json();
};

/**
 * Upload file with credentials
 */
export const uploadFile = async (endpoint, formData) => {
    const headers = {};
    
    // Add CSRF token
    if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include'
    });
    
    return response.json();
};

export default {
    get,
    post,
    put,
    patch,
    del,
    uploadFile,
    apiRequest,
    getCsrfToken,
    setCsrfToken,
    clearCsrfToken,
    refreshAccessToken,
    startTokenRefresh,
    stopTokenRefresh
};
