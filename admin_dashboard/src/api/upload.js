import { API_BASE_URL } from './config';

// All requests use credentials: 'include' for httpOnly cookies

/**
 * Upload general image
 */
export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to upload image');
    return data.data;
};

/**
 * Upload User Profile Picture
 */
export const uploadUserImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload/user-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to upload user image');
    return data.data;
};

/**
 * Upload Category image
 */
export const uploadCategoryImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload/category`, {
        method: 'POST',
        credentials: 'include',
        body: formData
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to upload category image');
    return data.data;
};

/**
 * Upload Brand logo
 */
export const uploadBrandImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload/brand`, {
        method: 'POST',
        credentials: 'include',
        body: formData
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to upload brand image');
    return data.data;
};

/**
 * Upload Product image (single)
 */
export const uploadProductImage = async (file) => {
    const formData = new FormData();
    formData.append('images', file); // Backend expects 'images' (array) even for single in product route

    const response = await fetch(`${API_BASE_URL}/upload/product`, {
        method: 'POST',
        credentials: 'include',
        body: formData
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to upload product image');
    // Product route returns { files: [...] }
    return data.data.files[0];
};

/**
 * Upload Product images (multiple)
 */
export const uploadProductImages = async (files) => {
    const formData = new FormData();

    if (Array.isArray(files)) {
        files.forEach(file => formData.append('images', file));
    } else if (files instanceof FileList) {
        Array.from(files).forEach(file => formData.append('images', file));
    } else {
        formData.append('images', files);
    }

    const response = await fetch(`${API_BASE_URL}/upload/product`, {
        method: 'POST',
        credentials: 'include',
        body: formData
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to upload product images');
    return data.data;
};
