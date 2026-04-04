import { API_BASE_URL } from './config';

// All requests use credentials: 'include' for httpOnly cookies

export const fetchCategories = async (audience = null) => {
    const url = audience
        ? `${API_BASE_URL}/categories?audience=${audience}`
        : `${API_BASE_URL}/categories`;

    const response = await fetch(url, {
        credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch categories');
    return data;
};

export const fetchCategory = async (id) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch category');
    return data;
};

export const createCategory = async (categoryData) => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(categoryData)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create category');
    return data;
};

export const updateCategory = async (id, categoryData) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(categoryData)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update category');
    return data;
};

export const deleteCategory = async (id) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete category');
    return data;
};
