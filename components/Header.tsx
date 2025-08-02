
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Notification, UserRole } from '../types';
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

const NotificationDropdown: React.FC<{
    onClose: () => void;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    setActiveLink: (link: string) => void;
}> = ({ onClose, notifications, onMarkAsRead, setActiveLink }) => {
    return (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl z-20 border origin-top-right animate-fade-in-down">
            <div className="p-4 border-b">
                <h3 className="font-bold text-gray-800">Notifications</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                    <p className="text-center text-gray-500 p-6">No new notifications.</p>
                ) : (
                    notifications.map(n => {
                        const { icon, color } = getNotificationIcon(n.type);
                        return (
                            <div key={n._id} className={`flex items-start gap-3 p-3 transition-colors hover:bg-slate-100 ${!n.read ? 'bg-blue-50' : ''}`}>
                                <div className="flex-shrink-0 pt-1">
                                    <Icon name={icon} className={color} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">{n.text}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{formatTimeAgo(n.createdAt)}</p>
                                </div>
                                {!n.read && (
                                    <button onClick={() => onMarkAsRead(n._id)} className="p-1 rounded-full hover:bg-blue-200" title="Mark as read">
                                        <span className="w-2 h-2 block bg-blue-500 rounded-full"></span>
                                    </button>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
            <div className="p-2 border-t text-center">
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveLink('Notifications'); onClose(); }} className="text-sm text-red-500 hover:underline font-semibold">View All Notifications</a>
            </div>
        </div>
    );
};

interface HeaderProps {
    title: string;
    breadcrumbs: { label: string; href?: string }[];
    actions?: React.ReactNode;
    userRole: UserRole;
    setActiveLink: (link: string) => void;
    isDarkMode: boolean;
    switchToLightMode: () => void;
}

const AppHeader: React.FC<HeaderProps> = ({ title, breadcrumbs, actions, userRole, setActiveLink, isDarkMode, switchToLightMode }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications.filter(n => !n.read).length;

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    }, [userRole]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, [fetchNotifications]);


    const handleMarkAsRead = async (id: string) => {
        setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
        try {
            await api.put(`/notifications/${id}/read`);
        } catch (error) {
            console.error("Failed to mark notification as read", error);
            // Optionally revert UI change
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: false } : n));
        }
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [notificationsRef]);


    return (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
                <nav className="text-sm text-gray-500 flex items-center mt-1" aria-label="Breadcrumb">
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={index}>
                            {index === 0 ? null : <Icon name="chevron_right" className="text-base mx-1" />}
                            <a href={crumb.href || '#'} className={`hover:text-red-500 transition-colors ${index === breadcrumbs.length - 1 ? 'text-gray-800 font-medium' : ''}`}>
                                {crumb.label}
                            </a>
                        </React.Fragment>
                    ))}
                </nav>
            </div>
            <div className="flex items-center gap-3">
                {actions}
                {/* Light mode only, dark mode toggle removed */}
                <div className="relative" ref={notificationsRef}>
                    <button
                        onClick={() => setShowNotifications(s => !s)}
                        className="p-2.5 rounded-full bg-white shadow-md text-gray-600 hover:bg-slate-100 transition-all duration-300"
                        aria-label="Notifications"
                    >
                        <Icon name="notifications" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span>
                            </span>
                        )}
                    </button>
                    {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} notifications={notifications} onMarkAsRead={handleMarkAsRead} setActiveLink={setActiveLink} />}
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
