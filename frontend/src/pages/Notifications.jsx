import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    HiBell,
    HiCheckCircle,
    HiExclamationCircle,
    HiInformationCircle,
    HiTrash,
    HiCheck,
    HiArrowPath
} from 'react-icons/hi2';
import Card from '../components/Card';
import Button from '../components/Button';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await notificationsAPI.getAll();
            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return <HiCheckCircle className="w-6 h-6 text-green-500" />;
            case 'warning':
                return <HiExclamationCircle className="w-6 h-6 text-amber-500" />;
            case 'error':
                return <HiExclamationCircle className="w-6 h-6 text-red-500" />;
            default:
                return <HiInformationCircle className="w-6 h-6 text-blue-500" />;
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
        return date.toLocaleDateString();
    };

    const markAsRead = async (id) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            toast.success('Marked as read');
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const deleteNotification = async (id) => {
        try {
            await notificationsAPI.delete(id);
            const notification = notifications.find(n => n.id === id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notification && !notification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const clearAll = async () => {
        try {
            await notificationsAPI.clearAll();
            setNotifications([]);
            setUnreadCount(0);
            toast.success('All notifications cleared');
        } catch (error) {
            toast.error('Failed to clear notifications');
        }
    };

    const handleRefresh = async () => {
        setLoading(true);
        await fetchNotifications();
        toast.success('Notifications refreshed');
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'read') return n.read;
        return true;
    });

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 dark:bg-dark-700 rounded-xl shimmer"></div>
                ))}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <HiBell className="w-7 h-7 text-primary-500" />
                        Notifications
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-sm bg-red-100 text-red-600 rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Stay updated with your account activity</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={handleRefresh}>
                        <HiArrowPath className="w-4 h-4" />
                        Refresh
                    </Button>
                    {unreadCount > 0 && (
                        <Button variant="secondary" onClick={markAllAsRead}>
                            <HiCheck className="w-4 h-4" />
                            Mark all as read
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button variant="ghost" onClick={clearAll}>
                            <HiTrash className="w-4 h-4" />
                            Clear all
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-dark-700 pb-2">
                {['all', 'unread', 'read'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${filter === f
                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                            }`}
                    >
                        {f} {f === 'unread' && unreadCount > 0 && `(${unreadCount})`}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <Card className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
                        <HiBell className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No notifications
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {filter === 'unread'
                            ? 'You have read all notifications'
                            : 'You have no notifications yet. Make a deposit or withdrawal to see notifications here!'}
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredNotifications.map((notification, index) => (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className={`${!notification.read ? 'border-l-4 border-l-primary-500' : ''}`}>
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className={`font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {notification.title}
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                    {formatTime(notification.createdAt)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {!notification.read && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <HiCheck className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notification.id)}
                                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title="Delete"
                                                >
                                                    <HiTrash className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default Notifications;
