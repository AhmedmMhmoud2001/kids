import { API_BASE_URL } from './config';

// All requests use credentials: 'include' for httpOnly cookies

const staticPagesApi = {
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/static-pages`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch pages');
        return data;
    },
    getOne: async (idOrSlug) => {
        const response = await fetch(`${API_BASE_URL}/static-pages/${idOrSlug}`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch page');
        return data;
    },
    create: async (pageData) => {
        const response = await fetch(`${API_BASE_URL}/static-pages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(pageData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to create page');
        return data;
    },
    update: async (id, pageData) => {
        const response = await fetch(`${API_BASE_URL}/static-pages/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(pageData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update page');
        return data;
    },
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/static-pages/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete page');
        return data;
    }
};

export default staticPagesApi;
