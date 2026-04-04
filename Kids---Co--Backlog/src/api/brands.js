import { API_BASE_URL } from './config';

// Get all active brands
export const fetchBrands = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/brands`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch brands');
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching brands:', error);
        throw error;
    }
};

// Get single brand by slug
export const fetchBrandBySlug = async (slug) => {
    try {
        const response = await fetch(`${API_BASE_URL}/brands/${slug}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch brand');
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching brand:', error);
        throw error;
    }
};

