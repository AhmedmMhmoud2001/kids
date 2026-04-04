import { API_BASE_URL } from './config';

// All requests use credentials: 'include' for httpOnly cookies

const brandsApi = {
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/brands`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch brands');
        return data;
    },
    getOne: async (id) => {
        const response = await fetch(`${API_BASE_URL}/brands/${id}`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch brand');
        return data;
    },
    create: async (brandData) => {
        const response = await fetch(`${API_BASE_URL}/brands`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(brandData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to create brand');
        return data;
    },
    update: async (id, brandData) => {
        const response = await fetch(`${API_BASE_URL}/brands/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(brandData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update brand');
        return data;
    },
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/brands/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete brand');
        return data;
    }
};

export default brandsApi;
