import apiClient from './apiClient';

export const fetchUsers = async () => apiClient.get('/users');

export const createUser = async (userData) => apiClient.post('/users', userData);

export const updateUser = async (id, userData) => apiClient.put(`/users/${id}`, userData);

export const deleteUser = async (id) => apiClient.del(`/users/${id}`);
