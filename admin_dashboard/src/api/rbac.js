import apiClient from './apiClient';

export const fetchRbacRoles = async () => apiClient.get('/rbac/roles');

export const createRbacRole = async (payload) => apiClient.post('/rbac/roles', payload || {});

export const updateRbacRole = async (roleId, payload) => apiClient.put(`/rbac/roles/${roleId}`, payload || {});

export const deleteRbacRole = async (roleId) => apiClient.del(`/rbac/roles/${roleId}`);

export const fetchRbacPermissions = async () => apiClient.get('/rbac/permissions');

export const fetchUserRbacProfile = async (userId) => apiClient.get(`/rbac/users/${userId}`);

export const assignUserRoles = async (userId, roleIds) => apiClient.put(`/rbac/users/${userId}/roles`, { roleIds });

export const assignUserPermissions = async (userId, permissionKeys) =>
    apiClient.put(`/rbac/users/${userId}/permissions`, { permissionKeys });
