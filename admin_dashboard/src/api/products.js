import { apiRequest, getBlob, uploadFile } from './apiClient';

const triggerBlobDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
};

export const fetchProducts = async (audience = null, options = {}) => {
    const params = new URLSearchParams();
    if (audience) params.set('audience', audience);
    if (options.limit != null) params.set('limit', String(options.limit));
    if (options.page != null) params.set('page', String(options.page));
    if (options.search) params.set('search', options.search);
    if (options.category) params.set('category', options.category);
    const query = params.toString();
    const path = query ? `/products?${query}` : '/products';

    const response = await apiRequest(path, { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch products');
    return data;
};

export const fetchProduct = async (id) => {
    const response = await apiRequest(`/products/${id}`, { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch product');
    return data;
};

export const createProduct = async (productData) => {
    const response = await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(productData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create product');
    return data;
};

export const updateProduct = async (id, productData) => {
    const response = await apiRequest(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update product');
    return data;
};

export const deleteProduct = async (id) => {
    const response = await apiRequest(`/products/${id}`, { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Failed to delete product');
    return data;
};

/** Excel: Kids */
export const downloadKidsExport = async () => {
    const blob = await getBlob('/products/export/kids');
    triggerBlobDownload(blob, 'kids-products.xlsx');
};

export const downloadKidsTemplate = async () => {
    const blob = await getBlob('/products/template/kids');
    triggerBlobDownload(blob, 'kids-products-template.xlsx');
};

export const importKidsExcel = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const data = await uploadFile('/products/import/kids', formData);
    return data;
};

/** Excel: Next */
export const downloadNextExport = async () => {
    const blob = await getBlob('/products/export/next');
    triggerBlobDownload(blob, 'next-products.xlsx');
};

export const downloadNextTemplate = async () => {
    const blob = await getBlob('/products/template/next');
    triggerBlobDownload(blob, 'next-products-template.xlsx');
};

export const importNextExcel = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const data = await uploadFile('/products/import/next', formData);
    return data;
};
