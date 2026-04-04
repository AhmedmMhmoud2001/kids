import { API_BASE_URL } from './config';

// Get static page by slug (about-us, faq, delivery-return)
export const fetchStaticPage = async (slug) => {
    try {
        const response = await fetch(`${API_BASE_URL}/static-pages/${slug}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch page');
        }

        return data;
    } catch (error) {
        console.error(`Error fetching static page ${slug}:`, error);
        throw error;
    }
};
