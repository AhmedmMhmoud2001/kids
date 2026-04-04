import { API_BASE_URL } from './config';

export const fetchShippingFee = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/shipping_fee`);
        const result = await response.json();
        if (result.success && result.data) {
            return parseFloat(result.data.value);
        }
        return 150; // Fallback
    } catch (error) {
        console.error('Error fetching shipping fee:', error);
        return 150; // Fallback
    }
};
export const fetchHomeHeroVideo = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/home2_hero_video`);
        const result = await response.json();
        if (result.success && result.data) {
            return result.data.value;
        }
        return "https://www.pexels.com/download/video/3917742/"; // Original video as fallback
    } catch (error) {
        console.error('Error fetching home hero video:', error);
        return "https://www.pexels.com/download/video/3917742/"; // Fallback
    }
};

/** Social links for footer (facebook, instagram, twitter, youtube). */
export const getSocialLinks = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/social`);
        const result = await response.json();
        if (result.success && result.data) {
            return result.data;
        }
        return { facebook: '', instagram: '', twitter: '', youtube: '' };
    } catch (error) {
        console.error('Error fetching social links:', error);
        return { facebook: '', instagram: '', twitter: '', youtube: '' };
    }
};

/** Show out-of-stock variants on product detail (true) or hide them (false). Default true. */
export const fetchShowOutOfStock = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/show_out_of_stock`);
        const result = await response.json();
        if (result.success && result.data && result.data.value !== undefined) {
            return String(result.data.value).toLowerCase() === 'true';
        }
        return true; // Default: show out of stock
    } catch (error) {
        console.error('Error fetching show_out_of_stock:', error);
        return true;
    }
};

/** Currency settings for displaying prices: { code, symbol, locale } */
export const fetchCurrencySettings = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/currency`);
        const result = await response.json();
        if (result.success && result.data) {
            return {
                code: result.data.code || 'EGP',
                symbol: result.data.symbol || 'EGP',
                locale: result.data.locale || 'en-EG'
            };
        }
        return { code: 'EGP', symbol: 'EGP', locale: 'en-EG' };
    } catch (error) {
        console.error('Error fetching currency settings:', error);
        return { code: 'EGP', symbol: 'EGP', locale: 'en-EG' };
    }
};

/** Top header offers list. */
export const fetchTopHeaderOffers = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/top_header_offers`);
        const result = await response.json();
        const raw = result?.success ? result?.data?.value : null;
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item) => item && typeof item === 'object');
    } catch (error) {
        console.error('Error fetching top header offers:', error);
        return [];
    }
};
