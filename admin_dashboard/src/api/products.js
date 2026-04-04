import { API_BASE_URL } from './config';

// All requests use credentials: 'include' for httpOnly cookies

export const fetchProducts = async (audience = null, options = {}) => {
    const params = new URLSearchParams();
    if (audience) params.set('audience', audience);
    if (options.limit != null) params.set('limit', String(options.limit));
    if (options.page != null) params.set('page', String(options.page));
    if (options.search) params.set('search', options.search);
    const query = params.toString();
    const url = query ? `${API_BASE_URL}/products?${query}` : `${API_BASE_URL}/products`;

    const response = await fetch(url, {
        credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch products');
    return data;
};

export const fetchProduct = async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch product');
    return data;
};

export const createProduct = async (productData) => {
    const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(productData)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create product');
    return data;
};

export const updateProduct = async (id, productData) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(productData)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update product');
    return data;
};

export const deleteProduct = async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete product');
    return data;
};

// Excel: Kids
export const downloadKidsExport = async () => {
    const response = await fetch(`${API_BASE_URL}/products/export/kids`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to download Kids export');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kids-products.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
};

export const downloadKidsTemplate = async () => {
    const response = await fetch(`${API_BASE_URL}/products/template/kids`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to download Kids template');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kids-products-template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
};

export const importKidsExcel = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/products/import/kids`, {
        method: 'POST',
        credentials: 'include',
        body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to import Kids Excel');
    return data;
};

// Excel: Next
export const downloadNextExport = async () => {
    const response = await fetch(`${API_BASE_URL}/products/export/next`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to download Next export');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'next-products.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
};

export const downloadNextTemplate = async () => {
    const response = await fetch(`${API_BASE_URL}/products/template/next`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to download Next template');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'next-products-template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
};

export const importNextExcel = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/products/import/next`, {
        method: 'POST',
        credentials: 'include',
        body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to import Next Excel');
    return data;
};
