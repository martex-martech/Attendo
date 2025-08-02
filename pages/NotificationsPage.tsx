
import React, { useState, useEffect, useCallback } from 'react';
import { Notification } from '../types';
import api from '../utils/api';

const Icon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-icons ${className || ''}`}>{name}</span>
);

const getNotificationIcon = (type: Notification['type']): { icon: string; color: string } => {
    switch (type) {
        case 'leave':
            return { icon: 'mail', color: 'text-blue-500' };
        case 'attendance':
            return { icon: 'warning', color: 'text-yellow-500' };
        case 'system':
        default:
            return { icon: 'update', color: 'text-green-500' };
    }
};

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min ago";
    return Math.floor(seconds) + " sec ago";
};


const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id: string) => {
        setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
        try {
            await api.put(`/notifications/${id}/read`);
        } catch (error) {
            console.error("Failed to mark notification as read", error);
            // Revert UI change on failure
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: false } : n));
        }
    };
    
    const handleMarkAllAsRead = async () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        try {
            await api.put('/notifications/read-all');
        } catch (error) {
            console.error("Failed to mark all notifications as read", error);
            // Revert on error
            fetchNotifications();
        }
    };

    const filteredNotifications = notifications.filter(n => filter === 'all' || !n.read);
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-xl font-bold text-gray-800">All Notifications</h1>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleMarkAllAsRead} 
                        disabled={unreadCount === 0}
                        className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg flex items-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Icon name="done_all" className="mr-2 text-sm" /> Mark all as read
                    </button>
                    <div className="bg-gray-200 p-0.5 rounded-lg flex">
                         <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-white shadow' : 'text-gray-600'}`}>All</button>
                         <button onClick={() => setFilter('unread')} className={`px-3 py-1 text-sm rounded-md ${filter === 'unread' ? 'bg-white shadow' : 'text-gray-600'}`}>Unread</button>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                {isLoading ? (
                    <p className="text-center text-gray-500 p-8">Loading notifications...</p>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center text-gray-500 p-10">
                        <Icon name="notifications_off" className="text-5xl mb-2"/>
                        <p>{filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}</p>
                    </div>
                ) : (
                    filteredNotifications.map(n => {
                        const { icon, color } = getNotificationIcon(n.type);
                        return (
                            <div key={n._id} className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${!n.read ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                <div className="flex-shrink-0 pt-1">
                                    <Icon name={icon} className={color} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">{n.text}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{formatTimeAgo(n.createdAt)}</p>
                                </div>
                                {!n.read && (
                                    <button onClick={() => handleMarkAsRead(n._id)} className="p-1 rounded-full hover:bg-blue-200" title="Mark as read">
                                        <span className="w-2.5 h-2.5 block bg-blue-500 rounded-full"></span>
                                    </button>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
