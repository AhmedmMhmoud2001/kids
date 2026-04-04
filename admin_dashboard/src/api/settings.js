import { API_BASE_URL } from './config';

// All requests use credentials: 'include' for httpOnly cookies

export const fetchSettings = async () => {
    const response = await fetch(`${API_BASE_URL}/settings`, {
        credentials: 'include'
    });
    return response.json();
};

export const updateSetting = async (key, value) => {
    const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key, value })
    });
    return response.json();
};

/** Get social links only (for admin form). */
export const getSocialLinks = async () => {
    const response = await fetch(`${API_BASE_URL}/settings/social`, { credentials: 'include' });
    const result = await response.json();
    return result.success ? result.data : { facebook: '', instagram: '', twitter: '', youtube: '' };
};

/** Update all social links at once. */
export const updateSocialLinks = async (data) => {
    const response = await fetch(`${API_BASE_URL}/settings/social`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
    });
    return response.json();
};

/** Currency settings: { code, symbol, locale } */
export const getCurrencySettings = async () => {
    const response = await fetch(`${API_BASE_URL}/settings/currency`, { credentials: 'include' });
    const result = await response.json();
    return result.success ? result.data : { code: 'EGP', symbol: 'EGP', locale: 'en-EG' };
};

export const updateCurrencySettings = async (data) => {
    const response = await fetch(`${API_BASE_URL}/settings/currency`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
    });
    return response.json();
};
