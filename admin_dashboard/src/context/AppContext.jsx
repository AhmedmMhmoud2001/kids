import { useState, useEffect, useCallback, useRef } from 'react';
import { AppContext } from './contextInstance';
import { fetchNotifications } from '../api/notifications';
import { logoutUser, fetchMe } from '../api/auth';
import { setCsrfToken, startTokenRefresh, stopTokenRefresh } from '../api/apiClient';
import { io } from 'socket.io-client';
import { API_HOST } from '../api/config';

export const AppProvider = ({ children }) => {
    // Load user from localStorage on mount
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef(null);
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'));

    // Verify session on mount
    useEffect(() => {
        const verifySession = async () => {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                try {
                    // Verify the session is still valid
                    const result = await fetchMe();
                    if (result.success) {
                        setUser(result.data);
                        localStorage.setItem('user', JSON.stringify(result.data));
                    } else {
                        // Session expired
                        setUser(null);
                        localStorage.removeItem('user');
                    }
                } catch (error) {
                    console.error('Session verification failed:', error);
                    setUser(null);
                    localStorage.removeItem('user');
                }
            }
            setIsLoading(false);
        };

        verifySession();
    }, []);

    // Socket Connection
    useEffect(() => {
        if (user && !isLoading) {
            // Initialize socket
            const socket = io(API_HOST, {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('✅ Connected to WebServer Socket');

                // Join personal room
                socket.emit('join', user.id);

                // If admin, join admins room
                if (['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT'].includes(user.role)) {
                    socket.emit('join_admin');
                }
            });

            socket.on('new_notification', (notification) => {
                console.log('🆕 New notification received:', notification);

                // Add to list
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Play sound
                audioRef.current.play().catch(e => console.log('Sound play blocked:', e));

                // Show browser notification if permitted
                if (Notification.permission === 'granted') {
                    new Notification(notification.title, {
                        body: notification.message,
                        icon: '/logo192.png'
                    });
                }
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [user, isLoading]);

    // Request notification permission
    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Save user to localStorage whenever it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
            stopTokenRefresh();
        }
    }, [user]);

    // Authentication functions
    const login = (authData, onSuccess) => {
        // authData = { user, csrfToken, expiresIn }
        const userData = authData.user || authData;
        setUser(userData);

        // Store CSRF token in memory
        if (authData.csrfToken) {
            setCsrfToken(authData.csrfToken);
        }

        // Start token refresh timer
        startTokenRefresh();

        // Run callback after React has committed state (so ProtectedRoute sees user)
        if (typeof onSuccess === 'function') {
            setTimeout(onSuccess, 0);
        }
    };

    const logout = async () => {
        // Call backend to clear httpOnly cookies
        await logoutUser();
        setUser(null);
    };

    const isAuthenticated = () => {
        return user !== null;
    };

    const refreshNotifications = useCallback(async () => {
        if (!user || isLoading) return; // Added isLoading check to prevent early calls
        try {
            const response = await fetchNotifications();
            if (response.success) {
                setNotifications(response.data);
                setUnreadCount(response.data.filter(n => !n.isRead).length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [user, isLoading]);

    // Initial fetch and polling (keeping polling as fallback but with safety)
    useEffect(() => {
        if (!user || isLoading) return;
        const id = setTimeout(() => refreshNotifications(), 0);
        const interval = setInterval(refreshNotifications, 120000);
        return () => {
            clearTimeout(id);
            clearInterval(interval);
        };
    }, [user, isLoading, refreshNotifications]);

    const value = {
        user,
        isLoading,
        login,
        logout,
        isAuthenticated,
        notifications,
        unreadCount,
        refreshNotifications
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
