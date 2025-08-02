

import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import type { ReportStatCardData, EmployeeAttendanceRecord, Employee } from '../types';
import { exportToCSV } from '../utils';
import api from '../utils/api';

const Icon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-icons ${className || ''}`}>{name}</span>
);

const Tooltip: React.FC<{
    content: React.ReactNode;
    position: { x: number; y: number };
}> = ({ content, position }) => {
    if (!content) return null;

    const TooltipContent = () => (
        <div
            style={{
                left: position.x + 15,
                top: position.y + 15,
                pointerEvents: 'none',
            }}
            className="fixed bg-gray-900 text-white text-sm rounded-md px-3 py-1.5 z-[100] shadow-lg"
        >
            {content}
        </div>
    );
    
    return ReactDOM.createPortal(<TooltipContent />, document.body);
};


const Dropdown: React.FC<{ options: {label: string, value: string}[]; selected: any; onSelect: (option: any) => void; }> = ({ options, selected, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="border dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm flex items-center text-gray-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 bg-white dark:bg-slate-800">
                {selected.label}
                <Icon name="expand_more" className="text-sm ml-1" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-md shadow-lg z-10 border dark:border-slate-700">
                    {options.map(option => (
                        <a key={option.value} href="#" onClick={(e) => { e.preventDefault(); onSelect(option); setIsOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                            {option.label}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Skeleton Components for Loading State ---

const StatCardSkeleton: React.FC = () => (
    <div className="bg-white p-5 rounded-xl shadow-lg animate-pulse">
        <div className="flex items-start justify-between">
            <div className="p-3 rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="h-8 w-16 bg-gray-200 rounded-md"></div>
        </div>
        <div>
            <div className="h-4 w-3/4 bg-gray-200 rounded-md mt-3"></div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full mt-2"></div>
            <div className="h-3 w-1/2 bg-gray-200 rounded-md mt-2"></div>
        </div>
    </div>
);

const ChartSkeleton: React.FC = () => (
    <div className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
        <div className="flex justify-between items-center mb-4">
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="w-full h-[250px] bg-gray-200 rounded-md"></div>
        <div className="flex justify-center items-center space-x-6 mt-4">
            <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-200 rounded-full mr-2"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-200 rounded-full mr-2"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
        </div>
    </div>
);

const TableSkeletonRow: React.FC = () => (
    <tr className="border-b border-gray-100 animate-pulse">
        <td className="p-3">
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                <div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded mt-1"></div>
                </div>
            </div>
        </td>
        {Array.from({ length: 8 }).map((_, i) => (
            <td key={i} className="p-3">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </td>
        ))}
    </tr>
);

// --- Dynamic Components ---

const ReportStatCard: React.FC<{ data: ReportStatCardData }> = ({ data }) => {
    return (
        <div className="bg-white p-5 rounded-xl shadow-lg flex flex-col justify-between">
            <div className="flex items-start justify-between">
                <div className={`p-3 rounded-full ${data.iconBgColor}`}>
                    <Icon name={data.icon} className={data.iconColor} />
                </div>
                <p className="text-3xl font-bold text-gray-800">{data.value}</p>
            </div>
            <div>
                <p className="text-gray-600 mt-3">{data.title}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${data.progress}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <Icon name="trending_up" className="text-sm mr-1 text-green-500"/> 
                    <span className="text-green-500">{data.trend.split(' ')[0]}</span>
                    <span className="ml-1">{data.trend.split(' ').slice(1).join(' ')}</span>
                </p>
            </div>
        </div>
    );
};

const AttendanceChart: React.FC<{
    data: { labels: string[], present: number[], absent: number[] } | null;
    onHover: (content: React.ReactNode, event: React.MouseEvent) => void;
    onMove: (event: React.MouseEvent) => void;
    onLeave: () => void;
}> = ({ data, onHover, onMove, onLeave }) => {
    if (!data) {
        return <ChartSkeleton />;
    }

    const width = 800;
    const height = 300;
    const padding = 50;
    const yMax = Math.max(...data.present, ...data.absent, 100);
    
    const scaleY = (value: number) => height - padding - (value / yMax * (height - padding * 2));
    const scaleX = (index: number) => padding + (index / (data.labels.length - 1)) * (width - padding * 2);

    const presentPoints = data.present.map((p, i) => `${scaleX(i)},${scaleY(p)}`).join(' ');
    const absentPoints = data.absent.map((a, i) => `${scaleX(i)},${scaleY(a)}`).join(' ');
    
    const TooltipContent = ({i}: {i:number}) => (
        <div className="text-left">
            <div className="font-bold mb-1">{data.labels[i]}</div>
            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Present: {data.present[i]}</div>
            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-pink-500 mr-2"></span>Absent: {data.absent[i]}</div>
        </div>
    );

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center"><Icon name="analytics" className="mr-2 text-red-500"/>Attendance</h2>
             <Dropdown options={[{label: 'This Year', value: 'this_year'}]} selected={{label: 'This Year', value: 'this_year'}} onSelect={() => {}} />
        </div>
        <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[800px] w-full">
                {/* Grid lines and Y-axis labels */}
                {[...Array(5)].map((_, i) => {
                    const val = Math.round(yMax * ( (4-i) / 4 ));
                    return (
                    <g key={val}>
                        <line x1={padding} y1={scaleY(val)} x2={width-padding} y2={scaleY(val)} stroke="currentColor" className="text-gray-200" strokeWidth="1" />
                        <text x={padding - 10} y={scaleY(val) + 5} textAnchor="end" className="text-xs text-gray-500 fill-current">{val}</text>
                    </g>
                )})}
                
                {/* X-axis labels */}
                {data.labels.map((label, i) => (
                    <text key={label} x={scaleX(i)} y={height - padding + 20} textAnchor="middle" className="text-xs text-gray-500 fill-current">{label}</text>
                ))}

                {/* Data lines */}
                <polyline points={presentPoints} fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={absentPoints} fill="none" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Hover points */}
                {data.labels.map((_, i) => (
                    <g key={`hover-group-${i}`}>
                        <circle cx={scaleX(i)} cy={scaleY(data.present[i])} r="8" fill="transparent"
                            onMouseEnter={(e) => onHover(<TooltipContent i={i} />, e)} onMouseMove={onMove} onMouseLeave={onLeave} className="cursor-pointer" />
                        <circle cx={scaleX(i)} cy={scaleY(data.absent[i])} r="8" fill="transparent"
                            onMouseEnter={(e) => onHover(<TooltipContent i={i} />, e)} onMouseMove={onMove} onMouseLeave={onLeave} className="cursor-pointer" />
                    </g>
                ))}
            </svg>
        </div>
        <div className="flex justify-center items-center space-x-6 mt-4">
            <div className="flex items-center text-sm"><span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span><span className="text-gray-600">Present</span></div>
            <div className="flex items-center text-sm"><span className="w-3 h-3 bg-pink-500 rounded-full mr-2"></span><span className="text-gray-600">Absent</span></div>
        </div>
      </div>
    );
};

const ReportsPage: React.FC<{ employees: Employee[] }> = ({ employees }) => {
    const [stats, setStats] = useState<ReportStatCardData[] | null>(null);
    const [chartData, setChartData] = useState<any | null>(null);
    const [records, setRecords] = useState<EmployeeAttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [tooltip, setTooltip] = useState<{ content: React.ReactNode; x: number; y: number } | null>(null);

    useEffect(() => {
        const fetchReportData = async () => {
            setIsLoading(true);
            try {
                 const [statsRes, chartRes, recordsRes] = await Promise.all([
                    api.get('/reports/stats'),
                    api.get('/reports/attendance-chart'),
                    api.get('/reports/attendance-records')
                ]);

                setStats(statsRes.data.data);
                setChartData(chartRes.data.data);
                setRecords(recordsRes.data.data.map((r: any) => ({...r, id: r._id})));
                
            } catch (error) {
                console.error("Failed to fetch report data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReportData();
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

    const filteredRecords = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();

        return records.filter(rec => {
            if (!rec.employee) {
                return false;
            }
            const statusMatch = statusFilter === 'All' || rec.status === statusFilter;
            
            if (!statusMatch) return false;
            
            if (lowercasedSearchTerm === '') return true;

            return (
                rec.employee.name.toLowerCase().includes(lowercasedSearchTerm) ||
                (rec.employee.email && rec.employee.email.toLowerCase().includes(lowercasedSearchTerm)) ||
                (rec.employee.employeeId && rec.employee.employeeId.toLowerCase().includes(lowercasedSearchTerm)) ||
                (rec.employee.department && rec.employee.department.toLowerCase().includes(lowercasedSearchTerm)) ||
                rec.employee.role.toLowerCase().replace('_', ' ').includes(lowercasedSearchTerm)
            );
        });
    }, [records, searchTerm, statusFilter]);

    const handleExport = () => {
        const dataToExport = filteredRecords.map(r => ({
            EmployeeName: r.employee.name,
            Date: r.date,
            CheckIn: r.checkIn,
            CheckOut: r.checkOut,
            Status: r.status,
            Break: r.break,
            Late: r.late,
            Overtime: r.overtime,
            ProductionHours: r.production.toFixed(2),
        }));
        exportToCSV(dataToExport, 'attendance-report.csv');
    };

    const getStatusClass = (status: 'Present' | 'Absent' | 'Late') => {
        if (status === 'Present') return 'bg-green-300 text-green-900';
        if (status === 'Late') return 'bg-yellow-300 text-yellow-900';
        return 'bg-red-300 text-red-900';
    };

    const getProductionBadgeClass = (hours: number) => {
        if (hours > 9) return "bg-blue-300 text-blue-900";
        if (hours >= 8) return "bg-green-300 text-green-900";
        return "bg-red-300 text-red-900";
    };

    return (
        <div className="space-y-6">
            {tooltip && <Tooltip content={tooltip.content} position={{ x: tooltip.x, y: tooltip.y }} />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
                ) : (
                    stats?.map(stat => <ReportStatCard key={stat.title} data={stat} />)
                )}
            </div>
            
            <AttendanceChart data={chartData} onHover={showTooltip} onMove={moveTooltip} onLeave={hideTooltip} />

            <div className="bg-white p-6 rounded-xl shadow-lg">
                 <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-800">Employee Attendance</h2>
                     <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
                        <button onClick={handleExport} className="bg-white text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-100 transition-colors shadow-sm border border-gray-200">
                            <Icon name="download" className="mr-2 text-sm" /> Export
                        </button>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 border rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500">
                            <option value="All">Select Status</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                        </select>
                        <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
                           <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                           <input
                            type="text"
                            placeholder="Search employee..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-black placeholder-gray-400"
                        />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Name</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Date</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Check In</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Status</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Check Out</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Break</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Late</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Overtime</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Production</th>
                                    </tr>
                                </thead>
                        <tbody>
                             {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => <TableSkeletonRow key={i} />)
                            ) : filteredRecords.length > 0 ? (
                                filteredRecords.map((rec) => (
                                <tr key={rec.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="p-3 text-gray-800 font-medium">
                                        <div className="flex items-center">
                                            <img src={rec.employee.avatar} alt={rec.employee.name} className="w-10 h-10 rounded-full mr-3" />
                                            <div>
                                                <p>{rec.employee.name}</p>
                                                <p className="text-xs text-gray-500">{rec.employee.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 text-gray-600">{rec.date}</td>
                                    <td className="p-3 text-gray-600">{rec.checkIn}</td>
                                    <td className="p-3"><span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(rec.status)}`}>{rec.status}</span></td>
                                    <td className="p-3 text-gray-600">{rec.checkOut}</td>
                                    <td className="p-3 text-gray-600">{rec.break}</td>
                                    <td className="p-3 text-gray-600">{rec.late}</td>
                                    <td className="p-3 text-gray-600">{rec.overtime}</td>
                                    <td className="p-3">
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getProductionBadgeClass(rec.production)}`}>
                                            <Icon name="timer" className="text-sm mr-1" />
                                            {rec.production.toFixed(2)} Hrs
                                        </span>
                                    </td>
                                </tr>
                            ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="text-center p-6 text-gray-500 dark:text-gray-400">No records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;