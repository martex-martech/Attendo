
import React, { useState, useEffect } from 'react';
import type { StatCardData, Notification, AttendanceStatus } from '../types';
import { ClockStatus } from '../types';
import api from '../utils/api';

const Icon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-icons ${className || ''}`}>{name}</span>
);

const StatCard: React.FC<{ data: StatCardData, onViewDetails?: () => void }> = ({ data, onViewDetails }) => (
    <div className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={onViewDetails}>
        <div className="flex items-center justify-between">
            <div className={`p-4 rounded-full ${data.iconBgColor}`}>
                <Icon name={data.icon} className={`${data.iconColor} text-3xl`} />
            </div>
            <div className="text-right">
                <h2 className="text-sm text-gray-700">{data.title}</h2>
                <p className="text-2xl font-bold text-gray-900">{data.value}</p>
            </div>
        </div>
        <div className="mt-4">
            <p className={`text-sm font-semibold ${data.trendColor}`}>{data.trend}</p>
        </div>
    </div>
);


const getNotificationIcon = (type: Notification['type']): { icon: string; color: string } => {
    switch (type) {
        case 'leave':
            return { icon: 'mail', color: 'text-blue-500' };
        case 'attendance':
            return { icon: 'warning', color: 'text-yellow-500' };
        case 'system':
        default:
            return { icon: 'person_add', color: 'text-green-500' };
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

const ActivityFeed: React.FC<{ activities: Notification[], setActiveLink: (link: string) => void; }> = ({ activities, setActiveLink }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Activity Feed</h2>
        <div className="space-y-4">
            {activities.length > 0 ? activities.map(activity => {
                 const { icon, color } = getNotificationIcon(activity.type);
                 return (
                    <div key={activity._id} className="flex items-start gap-4">
                        <div className={`mt-1 rounded-full p-2 bg-gray-100 ${color}`}>
                            <Icon name={icon} className="text-lg" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-700">{activity.text}</p>
                            <p className="text-xs text-gray-500">{formatTimeAgo(activity.createdAt)}</p>
                        </div>
                    </div>
                 )
            }) : <p className="text-gray-500 text-center py-8">No recent activity.</p>}
        </div>
         <div className="text-center mt-4 border-t border-gray-200 pt-3">
             <a href="#" onClick={(e) => { e.preventDefault(); setActiveLink('Reports'); }} className="text-red-500 hover:underline cursor-pointer font-semibold text-sm">View All Reports</a>
         </div>
    </div>
);

const AttendanceStatusViewer: React.FC<{}> = () => {
    const [status, setStatus] = useState<AttendanceStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get('/attendance/status');
                setStatus(res.data.data);
            } catch (error) {
                console.error("Failed to fetch attendance status", error);
            } finally {
                if(isLoading) setIsLoading(false);
            }
        };

        fetchStatus();
        const timerId = setInterval(fetchStatus, 15000); // Poll every 15 seconds
        const clockTimer = setInterval(() => setTime(new Date()), 1000);

        return () => {
            clearInterval(timerId);
            clearInterval(clockTimer);
        };
    }, [isLoading]);

    const formatDuration = (start: string | null, end: string | null = null) => {
        if (!start) return '00:00:00';
        const startTime = new Date(start).getTime();
        const endTime = end ? new Date(end).getTime() : time.getTime();
        const diff = endTime - startTime;

        if (diff < 0) return '00:00:00';

        const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const renderContent = () => {
        if (isLoading) return <div className="text-center text-gray-500">Loading Attendance...</div>;
        if (!status) return <div className="text-center text-red-500">Failed to load status.</div>;
        
        const getStatusPill = (text: string, color: string) => (
            <div className={`px-3 py-1 text-sm font-semibold rounded-full ${color}`}>
                {text}
            </div>
        );

        switch (status.status) {
            case ClockStatus.CLOCKED_OUT:
                return (
                    <div className="text-center">
                         {getStatusPill('Clocked Out', 'bg-red-100 text-red-700')}
                         <p className="text-gray-500 text-sm mt-3">Ready for the next shift.</p>
                    </div>
                );
            case ClockStatus.ON_BREAK:
                return (
                    <div className="text-center">
                        {getStatusPill('On Break', 'bg-yellow-100 text-yellow-700')}
                        <p className="text-4xl font-bold text-gray-800 my-2">{formatDuration(status.breakStartTime)}</p>
                        <p className="text-sm text-gray-500">Total Work: {formatDuration(status.workStartTime, status.breakStartTime)}</p>
                    </div>
                );
            case ClockStatus.CLOCKED_IN:
            default:
                return (
                    <div className="text-center">
                        {getStatusPill('Clocked In', 'bg-green-100 text-green-700')}
                        <p className="text-4xl font-bold text-gray-800 my-2">{formatDuration(status.workStartTime)}</p>
                        <p className="text-sm text-gray-500">Since {new Date(status.workStartTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                );
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col justify-center">
            <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">My Attendance Status</h2>
             <div className="flex-grow flex items-center justify-center">
                {renderContent()}
            </div>
            <p className="text-xs text-center text-gray-400 mt-4">
                <Icon name="info_outline" className="text-sm mr-1 align-bottom"/>
                Status is updated automatically by the ID scanner.
            </p>
        </div>
    );
};


const SuperAdminDashboard: React.FC<{ 
    setActiveLink: (link: string) => void; 
}> = ({ setActiveLink }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const res = await api.get('/dashboard/super-admin');
                setStats(res.data.data);
            } catch (error) {
                console.error("Failed to fetch super admin dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading || !stats) {
        return <div className="text-center p-10 flex items-center justify-center h-full text-gray-600 dark:text-gray-400">Loading Super Admin Dashboard...</div>;
    }

    const superAdminStatsCards: StatCardData[] = [
        { icon: 'manage_accounts', iconBgColor: 'bg-yellow-300', iconColor: 'text-yellow-800', title: 'Total Admins', value: `${stats.totalAdmins}`, trend: '', trendColor: 'text-green-500' },
        { icon: 'groups', iconBgColor: 'bg-blue-300', iconColor: 'text-blue-800', title: 'Total Employees', value: `${stats.totalEmployees}`, trend: '', trendColor: 'text-gray-500' },
        { icon: 'event_available', iconBgColor: 'bg-green-300', iconColor: 'text-green-800', title: 'System Attendance', value: `${stats.attendanceTodayCount}/${stats.totalEmployees + stats.totalAdmins}`, trend: 'Today', trendColor: 'text-gray-500' },
        { icon: 'mail', iconBgColor: 'bg-orange-300', iconColor: 'text-orange-800', title: 'Pending Requests', value: `${stats.pendingRequestsCount}`, trend: 'Across all departments', trendColor: 'text-orange-500' }, 
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {superAdminStatsCards.map(stat => (
                    <StatCard 
                        key={stat.title} 
                        data={stat} 
                        onViewDetails={() => {
                            if (stat.title === 'Total Admins') setActiveLink('Admin Management');
                            if (stat.title === 'Total Employees') setActiveLink('Employees');
                            if (stat.title === 'Pending Requests') setActiveLink('Leave Requests');
                        }}
                    />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ActivityFeed activities={stats.activities} setActiveLink={setActiveLink} />
                <AttendanceStatusViewer />
            </div>
        </div>
    );
};

export default SuperAdminDashboard;