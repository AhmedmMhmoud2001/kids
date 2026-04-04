import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    CheckCheck,
    ShoppingBag,
    AlertTriangle,
    Info,
    Settings,
    Trash2,
    Calendar,
    Filter,
    ExternalLink
} from 'lucide-react';
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification } from '../api/notifications';
import { useApp } from '../context/useApp';
import { useLanguage } from '../context/LanguageContext';
import { tx } from '../i18n/text';

const Notifications = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { refreshNotifications } = useApp();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, ORDER, SYSTEM, ALERT
    const ITEMS_PER_PAGE = 20;

    // Load notifications on component mount
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setLoading(true);
            const response = await fetchNotifications(0, ITEMS_PER_PAGE);
            if (isMounted && response.success) {
                setNotifications(response.data);
                setHasMore(response.hasMore);
            }
            if (isMounted) {
                setLoading(false);
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, []);

    const loadMoreNotifications = async () => {
        setLoadingMore(true);
        const response = await fetchNotifications(notifications.length, ITEMS_PER_PAGE);
        if (response.success) {
            setNotifications(prev => [...prev, ...response.data]);
            setHasMore(response.hasMore);
        }
        setLoadingMore(false);
    };

    const handleMarkAsRead = async (id) => {
        const response = await markAsRead(id);
        if (response.success) {
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            refreshNotifications();
        }
    };

    const handleMarkAllRead = async () => {
        const response = await markAllAsRead();
        if (response.success) {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            refreshNotifications();
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm(t(tx('Delete this notification?', 'حذف هذا الإشعار؟')))) return;
        try {
            const response = await deleteNotification(id);
            if (response.success) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                refreshNotifications();
            } else {
                alert(response.message || t(tx('Failed to delete', 'فشل الحذف')));
            }
        } catch (err) {
            alert(err.message || t(tx('Failed to delete notification', 'فشل حذف الإشعار')));
        }
    };

    // Navigate to order when clicking on an ORDER notification
    const handleNotificationClick = async (notif) => {
        // Mark as read first
        if (!notif.isRead) {
            await handleMarkAsRead(notif.id);
        }

        // If it's an ORDER notification with orderId, navigate to orders page
        if (notif.type === 'ORDER' && notif.orderId) {
            navigate(`/orders?orderId=${notif.orderId}`);
        }
    };
    const getIcon = (type) => {
        switch (type) {
            case 'ORDER':
                return <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ShoppingBag size={20} /></div>;
            // case 'ALERT':
            //     return <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertTriangle size={20} /></div>;
            // case 'SYSTEM':
            //     return <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Settings size={20} /></div>;
            default:
                return <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><Info size={20} /></div>;
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'ALL') return true;
        if (filter === 'UNREAD') return !n.isRead;
        return n.type === filter;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return t(tx('Just now', 'الآن'));
        if (diffInSeconds < 3600) return t(tx(`${Math.floor(diffInSeconds / 60)}m ago`, `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`));
        if (diffInSeconds < 86400) return t(tx(`${Math.floor(diffInSeconds / 3600)}h ago`, `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`));

        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                        <Bell className="text-blue-600" />
                        {t(tx('Notifications', 'الإشعارات'))}
                        <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                            {notifications.filter(n => !n.isRead).length} {t(tx('New', 'جديد'))}
                        </span>
                    </h1>
                    <p className="text-gray-500 mt-1">{t(tx('Manage and view your store notifications', 'إدارة وعرض إشعارات متجرك'))}</p>
                </div>

                <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm active:scale-95"
                >
                    <CheckCheck size={18} />
                    {t(tx('Mark all as read', 'تعيين الكل كمقروء'))}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex flex-wrap items-center gap-2">
                    {[
                        { id: 'ALL', label: t(tx('All', 'الكل')) },
                        { id: 'UNREAD', label: t(tx('Unread', 'غير مقروء')) },
                        { id: 'ORDER', label: t(tx('Orders', 'الطلبات')) },
                        // { id: 'ALERT', label: 'Alerts' },
                        // { id: 'SYSTEM', label: 'System' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filter === tab.id
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-500 hover:text-blue-600'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="divide-y divide-gray-50">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                            {t(tx('Loading notifications...', 'جاري تحميل الإشعارات...'))}
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-4 md:p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors cursor-pointer group ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                                onClick={() => handleNotificationClick(notif)}
                            >
                                <div className="relative">
                                    {getIcon(notif.type)}
                                    {!notif.isRead && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 border-2 border-white rounded-full"></div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`text-sm md:text-base font-bold truncate ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {notif.title}
                                        </h3>
                                        <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
                                            <Calendar size={12} />
                                            {formatDate(notif.createdAt)}
                                        </span>
                                    </div>
                                    <p className={`text-sm ${!notif.isRead ? 'text-gray-600' : 'text-gray-500'} line-clamp-2`}>
                                        {notif.message}
                                    </p>

                                    <div className="flex items-center gap-3 mt-3">
                                        {notif.type === 'ORDER' && notif.orderId && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/orders?orderId=${notif.orderId}`);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                <ExternalLink size={12} />
                                                View Order
                                            </button>
                                        )}
                                        {!notif.isRead && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkAsRead(notif.id);
                                                }}
                                                className="text-xs font-bold text-gray-500 hover:text-blue-600 hover:underline"
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => handleDelete(e, notif.id)}
                                    className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="حذف الإشعار"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="text-gray-300" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No notifications found</h3>
                            <p className="text-gray-500">You're all caught up! No new notifications for this category.</p>
                        </div>
                    )}
                </div>

                {hasMore && (
                    <div className="p-4 bg-gray-50 text-center">
                        <button
                            onClick={loadMoreNotifications}
                            disabled={loadingMore}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingMore ? (
                                <>
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Loading...
                                </>
                            ) : (
                                'Load More Notifications'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
