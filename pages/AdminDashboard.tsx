
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { StatCardData, DepartmentData, AttendanceStat, FilterOption, BasicEmployee, ClockInOutRecord, AttendanceStatus } from '../types';
import { ClockStatus } from '../types';
import api from '../utils/api';

const Icon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-icons ${className || ''}`}>{name}</span>
);

const Tooltip: React.FC<{ content: React.ReactNode; position: { x: number; y: number } }> = ({ content, position }) => {
    if (!content) return null;
    const TooltipContent = () => (
         <div
            style={{
                left: position.x + 15,
                top: position.y + 15,
                pointerEvents: 'none',
            }}
            className="fixed bg-gray-900 dark:bg-black text-white text-sm rounded-md px-3 py-1.5 z-[100] shadow-lg"
        >
            {content}
        </div>
    );
    return ReactDOM.createPortal(<TooltipContent />, document.body);
};

const StatCard: React.FC<{ data: StatCardData, onViewDetails?: () => void }> = ({ data, onViewDetails }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={onViewDetails}>
        <div className="flex items-center justify-between">
            <div className={`p-4 rounded-full ${data.iconBgColor}`}>
                <Icon name={data.icon} className={`${data.iconColor} text-3xl`} />
            </div>
            <div className="text-right">
                <h2 className="text-sm text-gray-500 dark:text-gray-400">{data.title}</h2>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{data.value}</p>
            </div>
        </div>
        <div className="mt-4">
            <p className={`text-sm font-semibold ${data.trendColor}`}>{data.trend}</p>
        </div>
    </div>
);

const EmployeesByDepartment: React.FC<{ 
    data: (DepartmentData & { count: number })[]; 
    onHover: (content: React.ReactNode, event: React.MouseEvent) => void;
    onMove: (event: React.MouseEvent) => void;
    onLeave: () => void;
}> = ({ data, onHover, onMove, onLeave }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-full">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Employees By Department</h2>
        </div>
        <div className="space-y-4">
            {data.map(dep => (
                <div key={dep.name} 
                    onMouseEnter={(e) => onHover(<><strong>{dep.name}</strong>: {dep.count} employees ({dep.percentage.toFixed(0)}%)</>, e)}
                    onMouseMove={onMove}
                    onMouseLeave={onLeave}
                    className="flex items-center group cursor-pointer"
                >
                    <span className="w-24 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{dep.name}</span>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mr-3">
                        <div className="bg-red-500 h-2.5 rounded-full group-hover:bg-red-600 transition-colors" style={{ width: `${dep.percentage}%` }}></div>
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">{dep.count}</span>
                </div>
            ))}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4"><span className="text-red-500 font-bold">•</span> Based on current employee distribution</p>
    </div>
);

const DonutChart: React.FC<{ 
    stats: AttendanceStat[], 
    total: number,
    onHover: (content: React.ReactNode, event: React.MouseEvent) => void;
    onMove: (event: React.MouseEvent) => void;
    onLeave: () => void;
}> = ({ stats, total, onHover, onMove, onLeave }) => {
    let cumulativePercentage = 0;
    return (
        <div className="relative w-48 h-48 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9155" fill="none" className="text-slate-200 dark:text-slate-700" strokeWidth="3.8"></circle>
                {stats.map((stat, index) => {
                    const offset = cumulativePercentage;
                    cumulativePercentage += stat.percentage;
                    return (
                        <circle 
                            key={index} 
                            className={`stroke-current ${stat.color} cursor-pointer transition-opacity hover:opacity-80`} 
                            cx="18" cy="18" r="15.9155" fill="none" 
                            strokeWidth="3.8" 
                            strokeDasharray={`${stat.percentage}, 100`} 
                            strokeDashoffset={-offset}
                            onMouseEnter={(e) => onHover(<><strong>{stat.status}</strong>: {stat.percentage.toFixed(0)}%</>, e)}
                            onMouseMove={onMove}
                            onMouseLeave={onLeave}
                        ></circle>
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Attendance</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{total}</p>
            </div>
        </div>
    );
};

const AttendanceOverview: React.FC<{ 
    data: { total: number, stats: AttendanceStat[] }, 
    onViewDetails: () => void,
    onHover: (content: React.ReactNode, event: React.MouseEvent) => void;
    onMove: (event: React.MouseEvent) => void;
    onLeave: () => void;
}> = ({ data, onViewDetails, onHover, onMove, onLeave }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-full">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Attendance Overview</h2>
        </div>
        <DonutChart stats={data.stats} total={data.total} onHover={onHover} onMove={onMove} onLeave={onLeave}/>
        <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-100">Status</h3>
        <div className="space-y-2">
            {data.stats.map(stat => (
                <div key={stat.status} className="flex justify-between items-center">
                    <div className="flex items-center"><span className={`w-3 h-3 ${stat.color.replace('text-', 'bg-')} rounded-full mr-2`}></span><p className="text-gray-600 dark:text-gray-300">{stat.status}</p></div>
                    <p className="font-bold text-gray-800 dark:text-gray-100">{stat.percentage.toFixed(0)}%</p>
                </div>
            ))}
        </div>
    </div>
);

const EmployeeStatus: React.FC<{ 
    data: any;
    mostPunctual: BasicEmployee & { lates: number; avgBreak: number; };
    setActiveLink: (link: string) => void;
    onHover: (content: React.ReactNode, event: React.MouseEvent) => void;
    onMove: (event: React.MouseEvent) => void;
    onLeave: () => void;
}> = ({ data, mostPunctual, setActiveLink, onHover, onMove, onLeave }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Employee Status</h2></div>
        <div className="flex justify-between items-center mb-2"><p className="text-gray-500 dark:text-gray-400">Total Employee</p><p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{data.total}</p></div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-4 flex">
            {data.types.map((type: any) => (
                <div 
                    key={type.name} 
                    className={`${type.color || 'bg-gray-500'} h-2.5 first:rounded-l-full last:rounded-r-full cursor-pointer hover:opacity-80`} 
                    style={{ width: `${type.percentage}%` }}
                    onMouseEnter={(e) => onHover(<><strong>{type.name}</strong>: {type.value} employees</>, e)}
                    onMouseMove={onMove}
                    onMouseLeave={onLeave}
                ></div>
            ))}
        </div>
        <div className="grid grid-cols-2 gap-4 text-center mb-4">
            {data.types.map((type: any) => (<div key={type.name} className="bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg"><p className="text-gray-500 dark:text-gray-400 text-sm">{type.name}</p><p className="text-xl font-bold text-gray-800 dark:text-gray-100">{type.value}</p></div>))}
        </div>
        <h3 className="font-bold my-3 text-gray-800 dark:text-gray-100">Most Punctual</h3>
        <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-lg">
            <div className="flex items-center">
                <img alt={mostPunctual.name} className="w-12 h-12 rounded-full mr-4" src={mostPunctual.avatar} />
                <div className="flex-grow">
                    <p className="font-bold text-gray-800 dark:text-gray-100">{mostPunctual.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{mostPunctual.role}</p>
                </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                    <p className="text-xs text-green-700 dark:text-green-300 font-semibold">Lates (30d)</p>
                    <p className="font-bold text-green-600 dark:text-green-400 text-lg">{mostPunctual.lates}</p>
                </div>
                <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                    <p className="text-xs text-green-700 dark:text-green-300 font-semibold">Avg. Break</p>
                    <p className="font-bold text-green-600 dark:text-green-400 text-lg">{mostPunctual.avgBreak} min</p>
                </div>
            </div>
        </div>
        <div className="text-center mt-4"><a href="#" onClick={(e) => { e.preventDefault(); setActiveLink('Employees'); }} className="text-red-500 hover:underline cursor-pointer font-semibold">View All Employees</a></div>
    </div>
);

const ClockInOut: React.FC<{ setActiveLink: (link: string) => void; clockInOuts: ClockInOutRecord[] }> = ({ setActiveLink, clockInOuts }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-full">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2"><h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Clock-In/Out</h2>
        </div>
        <div className="space-y-2">
            {clockInOuts.map((record, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b dark:border-slate-700 last:border-b-0">
                    <div className="flex items-center"><img alt={record.name} className="w-10 h-10 rounded-full mr-3" src={record.avatar} />
                        <div><p className="font-bold text-gray-800 dark:text-gray-100">{record.name}</p><p className="text-sm text-gray-500 dark:text-gray-400">{record.role}</p></div>
                    </div>
                    {record.status === 'in' ? (<div className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-xs font-bold px-2 py-1 rounded-full flex items-center"><Icon name="arrow_upward" className="text-sm mr-1" />{record.time}</div>) : (<div className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 text-xs font-bold px-2 py-1 rounded-full flex items-center"><Icon name="arrow_downward" className="text-sm mr-1" />{record.time}</div>)}
                </div>
            ))}
        </div>
        <div className="text-center mt-4"><a href="#" onClick={(e) => { e.preventDefault(); setActiveLink('Reports'); }} className="text-red-500 hover:underline cursor-pointer font-semibold">View All Attendance</a></div>
    </div>
);

const AttendanceStatusViewer: React.FC<{}> = () => {
    const [status, setStatus] = useState<AttendanceStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const fetchStatus = async () => {
            // No need to set loading true here, to avoid UI flicker on interval
            try {
                const res = await api.get('/attendance/status');
                setStatus(res.data.data);
            } catch (error) {
                console.error("Failed to fetch attendance status", error);
            } finally {
                if (isLoading) setIsLoading(false);
            }
        };

        fetchStatus(); // Initial fetch
        const timerId = setInterval(fetchStatus, 15000); // Poll every 15 seconds
        const clockTimer = setInterval(() => setTime(new Date()), 1000);

        return () => {
            clearInterval(timerId);
            clearInterval(clockTimer);
        };
    }, []);

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
                         {getStatusPill('Clocked Out', 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300')}
                         <p className="text-gray-500 dark:text-gray-400 text-sm mt-3">Ready for the next shift.</p>
                    </div>
                );
            case ClockStatus.ON_BREAK:
                return (
                    <div className="text-center">
                        {getStatusPill('On Break', 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300')}
                        <p className="text-4xl font-bold text-gray-800 dark:text-gray-100 my-2">{formatDuration(status.breakStartTime)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Work: {formatDuration(status.workStartTime, status.breakStartTime)}</p>
                    </div>
                );
            case ClockStatus.CLOCKED_IN:
            default:
                return (
                    <div className="text-center">
                        {getStatusPill('Clocked In', 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300')}
                        <p className="text-4xl font-bold text-gray-800 dark:text-gray-100 my-2">{formatDuration(status.workStartTime)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Since {new Date(status.workStartTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                );
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-full flex flex-col justify-center">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">My Attendance Status</h2>
            <div className="flex-grow flex items-center justify-center">
                {renderContent()}
            </div>
            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
                <Icon name="info_outline" className="text-sm mr-1 align-bottom"/>
                Status is updated automatically by the ID scanner.
            </p>
        </div>
    );
};


const AdminDashboard: React.FC<{ 
    setActiveLink: (link: string) => void; 
}> = ({ setActiveLink }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tooltip, setTooltip] = useState<{ content: React.ReactNode; x: number; y: number } | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const res = await api.get('/dashboard/admin');
                setStats(res.data.data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // --- Tooltip Handlers ---
    const showTooltip = (content: React.ReactNode, event: React.MouseEvent) => {
        setTooltip({ content, x: event.clientX, y: event.clientY });
    };
    const moveTooltip = (event: React.MouseEvent) => {
        if (tooltip) {
            setTooltip(t => t ? { ...t, x: event.clientX, y: event.clientY } : null);
        }
    };
    const hideTooltip = () => {
        setTooltip(null);
    };

    if (loading || !stats) {
        return <div className="text-center p-10 flex items-center justify-center h-full text-gray-600 dark:text-gray-400">Loading Dashboard...</div>;
    }

    const adminStatsCards: StatCardData[] = [
        { icon: 'groups', iconBgColor: 'bg-blue-100 dark:bg-blue-900/50', iconColor: 'text-blue-500 dark:text-blue-300', title: 'Total Employees', value: `${stats.totalEmployees}`, trend: '', trendColor: 'text-green-500' },
        { icon: 'event_available', iconBgColor: 'bg-green-100 dark:bg-green-900/50', iconColor: 'text-green-500 dark:text-green-300', title: 'Attendance Today', value: `${stats.attendanceTodayCount}/${stats.totalEmployees}`, trend: stats.totalEmployees > 0 ? `${Math.round((stats.attendanceTodayCount / stats.totalEmployees) * 100)}% present` : '0% present', trendColor: 'text-gray-500 dark:text-gray-400' },
        { icon: 'person_off', iconBgColor: 'bg-yellow-100 dark:bg-yellow-900/50', iconColor: 'text-yellow-700 dark:text-yellow-300', title: 'On Leave', value: `${stats.onLeaveCount}`, trend: 'Today', trendColor: 'text-red-500' },
        { icon: 'mail', iconBgColor: 'bg-purple-100 dark:bg-purple-900/50', iconColor: 'text-purple-500 dark:text-purple-300', title: 'Pending Requests', value: `${stats.pendingRequestsCount}`, trend: 'Approval needed', trendColor: 'text-orange-500' }, 
    ];

    const getStatusColor = (statusName: string) => {
        switch(statusName) {
            case 'Fulltime': return 'bg-blue-500';
            case 'Contract': return 'bg-red-500';
            case 'Probation': return 'bg-yellow-400';
            case 'WFH': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    }
    
    const employeeStatusData = {
        ...stats.employeeStatus,
        types: stats.employeeStatus.types.map((t:any) => ({...t, color: getStatusColor(t.name)}))
    };

    return (
        <div className="space-y-6">
            {tooltip && <Tooltip content={tooltip.content} position={{ x: tooltip.x, y: tooltip.y }} />}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {adminStatsCards.map(stat => <StatCard key={stat.title} data={stat} onViewDetails={() => setActiveLink(stat.title === 'Pending Requests' ? 'Leave Requests' : 'Employees')} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <EmployeesByDepartment 
                        data={stats.departments} 
                        onHover={showTooltip}
                        onMove={moveTooltip}
                        onLeave={hideTooltip}
                    />
                </div>
                 <div className="flex flex-col gap-6">
                    <EmployeeStatus 
                        data={employeeStatusData} 
                        mostPunctual={stats.mostPunctual}
                        setActiveLink={setActiveLink}
                        onHover={showTooltip}
                        onMove={moveTooltip}
                        onLeave={hideTooltip}
                    />
                    <AttendanceStatusViewer />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ClockInOut setActiveLink={setActiveLink} clockInOuts={stats.clockInOuts || []}/>
                </div>
                <AttendanceOverview 
                    data={stats.attendanceOverview} 
                    onViewDetails={() => alert("Viewing details...")} 
                    onHover={showTooltip}
                    onMove={moveTooltip}
                    onLeave={hideTooltip}
                />
            </div>
        </div>
    );
};

export default AdminDashboard;