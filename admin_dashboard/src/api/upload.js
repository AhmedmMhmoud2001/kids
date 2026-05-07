import { uploadFile } from './apiClient';

/**
 * Upload general image
 */
export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const data = await uploadFile('/upload', formData);
    return data.data;
};

/**
 * Upload User Profile Picture
 */
export const uploadUserImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const data = await uploadFile('/upload/user-image', formData);
    return data.data;
};

/**
 * Upload Category image
 */
export const uploadCategoryImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const data = await uploadFile('/upload/category', formData);
    return data.data;
};

/**
 * Upload Brand logo
 */
export const uploadBrandImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const data = await uploadFile('/upload/brand', formData);
    return data.data;
};

/**
 * Upload Product image (single)
 */
export const uploadProductImage = async (file) => {
    const formData = new FormData();
    formData.append('images', file);
    const data = await uploadFile('/upload/product', formData);
    return data.data.files[0];
};

/**
 * Upload Product images (multiple)
 */
export const uploadProductImages = async (files) => {
    const formData = new FormData();

    if (Array.isArray(files)) {
        files.forEach((file) => formData.append('images', file));
    } else if (files instanceof FileList) {
        Array.from(files).forEach((file) => formData.append('images', file));
    } else {
        formData.append('images', files);
    }

    const data = await uploadFile('/upload/product', formData);
    return data.data;
};
