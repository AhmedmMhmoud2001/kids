import { get, patch, post, del } from './apiClient';

// Use apiClient so 401 triggers token refresh and consistent redirect to login

export const fetchNotifications = async (skip = 0, take = 20) => {
    return get(`/notifications?skip=${skip}&take=${take}`);
};

export const markAsRead = async (id) => {
    return patch(`/notifications/${id}/read`, {});
};

export const markAllAsRead = async () => {
    return post('/notifications/read-all');
};

export const deleteNotification = async (id) => {
    return del(`/notifications/${id}`);
};
