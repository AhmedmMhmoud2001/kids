import { API_BASE_URL } from './config';

// All requests use credentials: 'include' for httpOnly cookies

export const fetchSystemStats = async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/system`, {
        credentials: 'include'
    });
    const data = await response.json();
    return { success: response.ok, ...data };
};

export const fetchKidsStats = async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/kids`, {
        credentials: 'include'
    });
    const data = await response.json();
    return { success: response.ok, ...data };
};

export const fetchNextStats = async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/next`, {
        credentials: 'include'
    });
    const data = await response.json();
    return { success: response.ok, ...data };
};

/**
 * Reports — query: preset (today|week|month|custom), from, to (ISO for custom), status (optional)
 */
export const fetchReports = async (params = {}) => {
    const q = new URLSearchParams();
    if (params.preset) q.set('preset', params.preset);
    if (params.from) q.set('from', params.from);
    if (params.to) q.set('to', params.to);
    if (params.status != null && params.status !== '') q.set('status', params.status);
    const url = `${API_BASE_URL}/dashboard/reports${q.toString() ? `?${q.toString()}` : ''}`;
    const response = await fetch(url, { credentials: 'include' });
    const data = await response.json();
    return { success: response.ok, ...data };
};
