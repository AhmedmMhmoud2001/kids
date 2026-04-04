import { API_BASE_URL } from './config';

// Get all categories with optional audience filter
export const fetchCategories = async (audience = null) => {
    try {
        const url = audience 
            ? `${API_BASE_URL}/categories?audience=${audience}`
            : `${API_BASE_URL}/categories`;
            
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch categories');
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

// Get single category by ID
export const fetchCategoryById = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${id}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch category');
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching category:', error);
        throw error;
    }
};

