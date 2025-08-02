import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Employee, HourStatData, LeaveStat, AttendanceStatus, LeaveStatsData, HourStatsCollection, TimelineSegment, AttendanceHistoryEntry, LeaveRequest, LeaveBalance } from '../types';
import { ClockStatus } from '../types';
import api from '../utils/api';

const Icon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-icons ${className || ''}`}>{name}</span>
);

const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string; isOpen: boolean }> = ({ children, onClose, title, isOpen }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b p-4">
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <Icon name="close" />
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
};

const EditProfileModal: React.FC<{ user: Employee; onClose: () => void; onProfileUpdate: () => void; }> = ({ user, onClose, onProfileUpdate }) => {
    const [formData, setFormData] = useState({
        name: user.name,
        phone: user.phone,
        email: user.email,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put('/users/profile', formData);
            alert('Profile updated successfully!');
            onProfileUpdate();
            onClose();
        } catch (error) {
            console.error("Failed to update profile", error);
            alert('Failed to update profile.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
                 <div className="flex items-center space-x-4">
                    <img src={user.avatar} alt="Avatar preview" className="w-16 h-16 rounded-full mr-4" />
                    <div>
                        <p className="text-sm text-gray-500">Avatar is assigned automatically by the system.</p>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" required />
                    </div>
                </div>
            </div>
             <div className="mt-6 pt-4 flex justify-end border-t border-gray-200">
                <button type="button" onClick={onClose} className="mr-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-red-300">
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
};


const UserProfileCard: React.FC<{ user: Employee; onEdit: () => void; }> = ({ user, onEdit }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <img alt={`Profile picture of ${user.name}`} className="w-16 h-16 rounded-full mr-4 object-cover" src={user.avatar} />
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                    <p className="text-sm text-gray-500">{user.role} <span className="text-gray-600">•</span> {user.department}</p>
                </div>
            </div>
            <button onClick={onEdit} className="bg-gray-100 p-2 rounded-md hover:bg-gray-200 transition-colors text-gray-600">
                <Icon name="edit" />
            </button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-y-4 text-sm">
            <div><p className="text-gray-500">Phone Number</p><p className="text-gray-800">{user.phone}</p></div>
            <div><p className="text-gray-500">Email Address</p><p className="text-gray-800">{user.email}</p></div>
            <div><p className="text-gray-500">Reports To</p><p className="text-gray-800">{user.reportTo}</p></div>
            <div><p className="text-gray-500">Joined on</p><p className="text-gray-800">{new Date(user.joinedOn).toLocaleDateString()}</p></div>
        </div>
    </div>
);

const AttendanceStatusViewer: React.FC<{ status: AttendanceStatus | null; }> = ({ status }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const formatDuration = (start: string | null, end: string | null = null) => {
        if (!start) return '00:00:00';
        const startTime = new Date(start).getTime();
        const endTime = end ? new Date(end).getTime() : currentTime.getTime();
        const diff = endTime - startTime;

        if (diff < 0) return '00:00:00';

        const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const renderContent = () => {
        if (!status) return <p className="text-gray-500">Loading attendance status...</p>;
        
        switch (status.status) {
            case ClockStatus.CLOCKED_OUT:
                return (
                    <div className="text-center">
                        <p className="text-lg text-gray-800 font-semibold mb-2">{currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-4xl font-bold text-gray-800">{currentTime.toLocaleTimeString()}</p>
                        <div className="mt-6 text-gray-500 flex items-center justify-center gap-2"><Icon name="badge"/><span>Ready to scan in.</span></div>
                    </div>
                );
            case ClockStatus.ON_BREAK:
                 return (
                    <div className="text-center">
                        <p className="text-gray-500">On Break</p>
                        <p className="text-4xl font-bold text-gray-800 my-2">{formatDuration(status.breakStartTime)}</p>
                        <div className="w-full border-t my-4"></div>
                        <p className="text-sm text-gray-600 mb-4">Total Work: {formatDuration(status.workStartTime, status.breakStartTime)}</p>
                    </div>
                );
             case ClockStatus.CLOCKED_IN:
                return (
                    <div className="text-center">
                        <p className="text-gray-500">Working</p>
                        <p className="text-4xl font-bold text-gray-800 my-2">{formatDuration(status.workStartTime)}</p>
                        <div className="w-full border-t my-4"></div>
                        <p className="text-sm text-gray-600">Clocked in at {new Date(status.workStartTime || '').toLocaleTimeString()}</p>
                    </div>
                );
            default:
                return <p>Loading attendance...</p>
        }
    };
    
    return (
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center min-h-[260px]">
                        <div className="flex-grow flex items-center justify-center">
                            {status ? renderContent() : <p>Loading...</p>}
                        </div>
                        <p className="text-xs text-center text-gray-400 mt-4">
                            <Icon name="info_outline" className="text-sm mr-1 align-bottom"/>
                            Status is updated automatically by the ID scanner.
                        </p>
                    </div>
    );
};

const LeaveStatsCard: React.FC<{ stats: LeaveStatsData | null; onApply: () => void; }> = ({ stats, onApply }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
        {stats ? (
            <>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div><p className="text-gray-500 text-sm">Total Allowed</p><p className="text-3xl font-bold text-gray-800">{stats.totalAllowed}</p></div>
                    <div><p className="text-gray-500 text-sm">Taken</p><p className="text-3xl font-bold text-gray-800">{stats.taken}</p></div>
                    <div><p className="text-gray-500 text-sm">Pending</p><p className="text-3xl font-bold text-gray-800">{stats.pending}</p></div>
                    <div><p className="text-gray-500 text-sm">Available</p><p className="text-3xl font-bold text-gray-800">{stats.available}</p></div>
                </div>
                 <div className="h-px bg-gray-200 my-4"></div>
                {stats.breakdown.map(item => (
                    <div key={item.type} className="text-sm mt-2">
                        <div className="flex justify-between mb-1">
                            <span>{item.type}</span>
                            <span className="font-medium">{item.taken} / {item.total}</span>
                        </div>
                         <div className="w-full bg-gray-200 rounded-full h-1.5"><div className={`${item.color} h-1.5 rounded-full`} style={{width: `${Math.min((item.taken/item.total), 1)*100}%`}}></div></div>
                    </div>
                ))}
            </>
        ) : <p className="text-center text-gray-500">Loading leave data...</p>}
        <button onClick={onApply} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg mt-6 transition-colors">Apply New Leave</button>
    </div>
);

const HourStatCard: React.FC<{ stat: HourStatData }> = ({ stat }) => (
    <div className={`bg-white p-4 rounded-xl shadow-lg border-l-4 ${stat.borderColor}`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-2xl font-bold text-gray-800">{stat.current.toFixed(2)} <span className="text-gray-500 text-lg">/ {stat.total}</span></p>
                <p className="text-sm text-gray-500">{stat.title}</p>
            </div>
            <div className={`${stat.iconBgColor} p-2 rounded-full`}>
                <Icon name={stat.icon} className={stat.iconColor} />
            </div>
        </div>
    </div>
);

interface AttendanceSummaryStat {
    status: 'Present' | 'Late' | 'Absent';
    count: number;
    percentage: number;
    color: string;
}

const DonutChart: React.FC<{ stats: AttendanceSummaryStat[], total: number }> = ({ stats, total }) => {
    let cumulativePercentage = 0;
    return (
        <div className="relative w-40 h-40 mx-auto mb-4 md:mb-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9155" fill="none" className="text-slate-200" strokeWidth="3.8"></circle>
                {stats.map((stat) => {
                    const offset = cumulativePercentage;
                    cumulativePercentage += stat.percentage;
                    return (
                        <circle
                            key={stat.status}
                            className={`stroke-current ${stat.color} cursor-pointer transition-opacity hover:opacity-80`}
                            cx="18" cy="18" r="15.9155" fill="none"
                            strokeWidth="3.8"
                            strokeDasharray={`${stat.percentage}, 100`}
                            strokeDashoffset={-offset}
                        ></circle>
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-3xl font-bold text-gray-800">{total}</p>
                 <p className="text-xs text-gray-500">Total Days</p>
            </div>
        </div>
    );
};

const AttendanceSummaryCard: React.FC<{ summary: AttendanceSummaryStat[] | null; totalDays: number; }> = ({ summary, totalDays }) => {
    if (!summary || totalDays === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-center text-gray-500 h-full">
                No Attendance Data Available
            </div>
        );
    }
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Attendance Summary</h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                    <DonutChart stats={summary} total={totalDays} />
                </div>
                <div className="flex-grow w-full">
                    <div className="space-y-3">
                        {summary.map(stat => (
                            <div key={stat.status} className="flex justify-between items-center text-sm">
                                <div className="flex items-center">
                                    <span className={`w-3 h-3 ${stat.color.replace('text-', 'bg-')} rounded-full mr-3`}></span>
                                    <p className="text-gray-600">{stat.status}</p>
                                </div>
                                <p className="font-bold text-gray-800">{stat.count} Day(s)</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DailyTimelineChart: React.FC<{ segments: TimelineSegment[] }> = ({ segments }) => {
    if (segments.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Daily Timeline</h3>
                <div className="flex items-center justify-center text-gray-500 h-24">Not enough data for today's timeline.</div>
            </div>
        );
    }
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Daily Timeline</h3>
            <div className="w-full bg-slate-200 rounded-full h-4 flex overflow-hidden">
                {segments.map((segment, index) => (
                    <div
                        key={index}
                        className={`h-4 ${segment.color} transition-all duration-300`}
                        style={{ width: `${segment.percentage}%` }}
                        title={`${segment.type.charAt(0).toUpperCase() + segment.type.slice(1)}: ${segment.percentage.toFixed(1)}%`}
                    />
                ))}
            </div>
            <div className="flex justify-center items-center space-x-4 mt-4 text-sm">
                {segments.map((segment) => (
                    <div key={segment.type} className="flex items-center">
                        <span className={`w-3 h-3 ${segment.color} rounded-full mr-2`}></span>
                        <span className="text-gray-600 capitalize">{segment.type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ApplyLeaveForm: React.FC<{ 
    onAddLeaveRequest: (data: Omit<LeaveRequest, 'id' | 'status' | 'employee'>) => Promise<boolean>; 
    onClose: () => void; 
    balanceBreakdown: { type: string, total: number, taken: number }[] | null;
}> = ({ onAddLeaveRequest, onClose, balanceBreakdown }) => {
    const [leaveType, setLeaveType] = useState<'Annual Leave' | 'Medical Leave' | 'Other'>('Annual Leave');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');
    const [days, setDays] = useState(0);
    const [balanceError, setBalanceError] = useState<string | null>(null);

    useEffect(() => {
        if (fromDate && toDate) {
            const start = new Date(fromDate);
            const end = new Date(toDate);
            if (end >= start) {
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setDays(diffDays);
            } else {
                setDays(0);
            }
        } else {
            setDays(0);
        }
    }, [fromDate, toDate]);
    
    useEffect(() => {
        if (!balanceBreakdown || days <= 0) {
            setBalanceError(null);
            return;
        }

        const selectedLeaveTypeBalance = balanceBreakdown.find(b => b.type === leaveType);
        if (!selectedLeaveTypeBalance) {
            setBalanceError(null);
            return;
        }

        const availableDays = selectedLeaveTypeBalance.total - selectedLeaveTypeBalance.taken;
        if (days > availableDays) {
            setBalanceError(`Exceeds available balance (${availableDays} days left).`);
        } else {
            setBalanceError(null);
        }
    }, [days, leaveType, balanceBreakdown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fromDate || !toDate || days <= 0 || !reason || balanceError) {
            alert('Please fill all fields correctly and ensure leave balance is not exceeded.');
            return;
        }
        const success = await onAddLeaveRequest({ leaveType, from: fromDate, to: toDate, days, reason });
        if(success) {
            onClose();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                    <select value={leaveType} onChange={e => setLeaveType(e.target.value as any)} className="w-full p-2 border rounded-md bg-white text-black">
                        <option>Annual Leave</option>
                        <option>Medical Leave</option>
                        <option>Other</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} required className="w-full p-2 border rounded-md bg-white text-black" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} required className="w-full p-2 border rounded-md bg-white text-black" /></div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. of Days</label>
                    <input type="number" value={days} readOnly className="w-full p-2 border rounded-md bg-gray-100 text-black" />
                     {balanceError && <p className="text-red-500 text-xs mt-1">{balanceError}</p>}
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label><textarea value={reason} onChange={e => setReason(e.target.value)} required rows={3} className="w-full p-2 border rounded-md bg-white text-black" placeholder="Please provide a reason for your leave..."></textarea></div>
            </div>
             <div className="mt-6 pt-4 flex justify-end border-t border-gray-200">
                <button type="button" onClick={onClose} className="mr-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={!!balanceError} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed">Submit Request</button>
            </div>
        </form>
    );
};

const EmployeeProfile: React.FC<{ user: Employee; onProfileUpdate: () => void; onAddLeaveRequest: (data: any) => Promise<boolean>; }> = ({ user, onProfileUpdate, onAddLeaveRequest }) => {
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
    const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
    const [leaveStats, setLeaveStats] = useState<LeaveStatsData | null>(null);
    const [hourStats, setHourStats] = useState<HourStatsCollection | null>(null);
    const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        // No need to set loading true to avoid flicker on interval
        try {
            const [statusRes, leaveRes, hoursRes, historyRes] = await Promise.all([
                api.get('/attendance/status'),
                api.get('/leaves/stats'),
                api.get('/attendance/hours'),
                api.get('/attendance/history'),
            ]);
            setAttendanceStatus(statusRes.data.data);
            setLeaveStats(leaveRes.data.data);
            setHourStats(hoursRes.data.data);
            setAttendanceHistory(historyRes.data.data);
        } catch (error) {
            console.error("Failed to fetch profile data", error);
        } finally {
            if(isLoading) setIsLoading(false);
        }
    }, [isLoading]);

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 15000); // Poll every 15 seconds
        return () => clearInterval(intervalId);
    }, [fetchData]);

    const attendanceSummaryData = useMemo(() => {
        const history = attendanceHistory;
        const totalDays = history.length;

        if (totalDays === 0) return { summary: [], totalDays: 0 };

        const statusCounts = history.reduce((acc, entry) => {
            acc[entry.status] = (acc[entry.status] || 0) + 1;
            return acc;
        }, {} as Record<'Present' | 'Late' | 'Absent', number>);
        
        const statusConfigs: {status: 'Present' | 'Late' | 'Absent', color: string}[] = [
            { status: 'Present', color: 'text-green-500' },
            { status: 'Late', color: 'text-yellow-500' },
            { status: 'Absent', color: 'text-red-500' },
        ];

        const summary: AttendanceSummaryStat[] = statusConfigs.map(config => ({
            status: config.status,
            count: statusCounts[config.status] || 0,
            percentage: totalDays > 0 ? ((statusCounts[config.status] || 0) / totalDays) * 100 : 0,
            color: config.color,
        })).filter(s => s.count > 0);

        return { summary, totalDays };
    }, [attendanceHistory]);
    
    const timelineData = useMemo((): TimelineSegment[] => {
        if (!hourStats?.today || hourStats.today.worked <= 0) {
            return [];
        }
        
        const { worked, overtime } = hourStats.today;
        const normalWork = worked - overtime;
        
        // Assume a break time to make the chart illustrative.
        const breakTime = worked > 4 ? 1 : (worked > 0 ? 0.5 : 0);

        const totalDuration = normalWork + overtime + breakTime;
        if (totalDuration === 0) return [];

        const segments: TimelineSegment[] = [];

        if (normalWork > 0) {
            segments.push({
                type: 'working',
                percentage: (normalWork / totalDuration) * 100,
                color: 'bg-blue-500',
            });
        }

        if (breakTime > 0) {
            segments.push({
                type: 'break',
                percentage: (breakTime / totalDuration) * 100,
                color: 'bg-yellow-500',
            });
        }
        
        if (overtime > 0) {
            segments.push({
                type: 'overtime',
                percentage: (overtime / totalDuration) * 100,
                color: 'bg-pink-500',
            });
        }

        return segments;
    }, [hourStats]);
    
    const handleApplyLeave = async (data: Omit<LeaveRequest, 'id' | 'status' | 'employee'>) => {
        const success = await onAddLeaveRequest(data);
        if (success) {
            setLeaveModalOpen(false);
            fetchData(); // Refresh all data after applying
        }
        return success;
    };

    const hourStatCards: HourStatData[] = hourStats ? [
        { title: 'Total Hours Today', current: hourStats.today.worked, total: 8, icon: 'schedule', iconBgColor: 'bg-orange-300', iconColor: 'text-orange-800', borderColor: 'border-orange-400' },
        { title: 'Total Hours Week', current: hourStats.week.worked, total: 40, icon: 'calendar_view_week', iconBgColor: 'bg-green-300', iconColor: 'text-green-800', borderColor: 'border-green-400' },
        { title: 'Total Hours Month', current: hourStats.month.worked, total: 160, icon: 'today', iconBgColor: 'bg-blue-300', iconColor: 'text-blue-800', borderColor: 'border-blue-400' },
        { title: 'Overtime this Month', current: hourStats.month.overtime, total: 10, icon: 'hourglass_bottom', iconBgColor: 'bg-pink-300', iconColor: 'text-pink-800', borderColor: 'border-pink-400' },
    ] : [];

    return (
        <div className="space-y-6">
            {isEditModalOpen && <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Edit My Profile">
                <EditProfileModal user={user} onClose={() => setEditModalOpen(false)} onProfileUpdate={() => { onProfileUpdate(); setEditModalOpen(false); }} />
            </Modal>}

            <Modal isOpen={isLeaveModalOpen} onClose={() => setLeaveModalOpen(false)} title="Apply for Leave">
                 <ApplyLeaveForm 
                    onAddLeaveRequest={handleApplyLeave} 
                    onClose={() => setLeaveModalOpen(false)} 
                    balanceBreakdown={leaveStats ? leaveStats.breakdown : null}
                 />
            </Modal>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <UserProfileCard user={user} onEdit={() => setEditModalOpen(true)} />
                    {isLoading ? <div className="text-center p-10">Loading Clock...</div> : <AttendanceStatusViewer status={attendanceStatus} />}
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AttendanceSummaryCard summary={attendanceSummaryData.summary} totalDays={attendanceSummaryData.totalDays} />
                        <LeaveStatsCard stats={leaveStats} onApply={() => setLeaveModalOpen(true)} />
                    </div>
                    {isLoading ? <p className="text-center p-10">Loading hour stats...</p> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {hourStatCards.map(stat => <HourStatCard key={stat.title} stat={stat} />)}
                        </div>
                    )}
                    <DailyTimelineChart segments={timelineData} />
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfile;