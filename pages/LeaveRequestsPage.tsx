import React, { useState, useMemo, useEffect } from 'react';
import type { LeaveRequest, Employee, LeaveBalance } from '../types';
import { exportToCSV } from '../utils';
import api from '../utils/api';

const Icon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-icons ${className || ''}`}>{name}</span>
);

const AddLeaveModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onAddLeave: (request: Omit<LeaveRequest, 'id' | 'status' | 'employee' > & { user: string }) => Promise<void>;
    employees: Employee[];
}> = ({ isOpen, onClose, onAddLeave, employees }) => {
    const [userId, setUserId] = useState('');
    const [leaveType, setLeaveType] = useState<'Annual Leave' | 'Medical Leave' | 'Other'>('Annual Leave');
    const [from, setFromDate] = useState('');
    const [to, setToDate] = useState('');
    const [reason, setReason] = useState('');
    const [days, setDays] = useState(0);

    const [balance, setBalance] = useState<LeaveBalance[] | null>(null);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [balanceError, setBalanceError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBalance = async () => {
            if (!userId) {
                setBalance(null);
                return;
            }
            setIsLoadingBalance(true);
            try {
                const res = await api.get(`/leaves/balance/${userId}`);
                setBalance(res.data.data);
            } catch (error) {
                console.error("Failed to fetch leave balance", error);
                setBalance(null);
            } finally {
                setIsLoadingBalance(false);
            }
        };
        fetchBalance();
    }, [userId]);

    useEffect(() => {
        if (from && to) {
            const start = new Date(from);
            const end = new Date(to);
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
    }, [from, to]);
    
    useEffect(() => {
        if (!balance || days <= 0) {
            setBalanceError(null);
            return;
        }

        const selectedLeaveTypeBalance = balance.find(b => b.type === leaveType);
        if (!selectedLeaveTypeBalance) {
            setBalanceError(null);
            return;
        }

        const availableDays = selectedLeaveTypeBalance.total - selectedLeaveTypeBalance.used;
        if (days > availableDays) {
            setBalanceError(`Exceeds available balance (${availableDays} days left).`);
        } else {
            setBalanceError(null);
        }
    }, [days, leaveType, balance]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !from || !to || days <= 0 || balanceError) {
            alert('Please fill all fields correctly and ensure leave balance is not exceeded.');
            return;
        }
        await onAddLeave({ user: userId, leaveType, from, to, days, reason });
    };

    const remainingDays = useMemo(() => {
        if (!balance || !leaveType) return 'N/A';
        const selectedBalance = balance.find(b => b.type === leaveType);
        if (!selectedBalance) return 'N/A';
        return `${selectedBalance.total - selectedBalance.used} days`;
    }, [balance, leaveType]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b p-4">
                    <h3 className="text-xl font-bold text-gray-800">Add Leave</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <Icon name="close" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                                <select value={userId} onChange={e => setUserId(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md bg-white text-black">
                                    <option value="" disabled>Select</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                                <select value={leaveType} onChange={e => setLeaveType(e.target.value as any)} required className="w-full p-2 border border-gray-300 rounded-md bg-white text-black">
                                    <option>Annual Leave</option>
                                    <option>Medical Leave</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                                <input type="date" value={from} onChange={e => setFromDate(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                                <input type="date" value={to} onChange={e => setToDate(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">No of Days</label>
                                <input type="number" value={days} readOnly className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-black" />
                                {balanceError && <p className="text-red-500 text-xs mt-1">{balanceError}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Days</label>
                                <input type="text" value={isLoadingBalance ? 'Loading...' : remainingDays} readOnly className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-black" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} required rows={3} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" placeholder="Enter reason for leave..."></textarea>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={!!balanceError || isLoadingBalance} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed">
                            Add Leave
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LeaveStatCard: React.FC<{ icon: string; title: string; value: string; colorClass: string; iconBgClass: string }> = ({ icon, title, value, colorClass, iconBgClass }) => {
    return (
        <div className="bg-white p-5 rounded-xl shadow-lg flex items-center gap-4">
            <div className={`p-3 rounded-full ${iconBgClass}`}>
                <Icon name={icon} className={`${colorClass} text-3xl`} />
            </div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            </div>
        </div>
    );
};

const LeaveRequestsPage: React.FC<{ 
    requests: LeaveRequest[]; 
    employees: Employee[];
    onDataRefresh: () => void;
}> = ({ requests, employees, onDataRefresh }) => {
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddLeaveModalOpen, setAddLeaveModalOpen] = useState(false);

    const handleUpdateRequest = async (id: string, newStatus: 'Approved' | 'Rejected') => {
        try {
            await api.put(`/leaves/${id}/status`, { status: newStatus });
            onDataRefresh();
        } catch (error) {
            console.error("Failed to update leave request", error);
            alert("Update failed.");
        }
    };
    
    const handleAddLeave = async (newRequestData: any) => {
        try {
            await api.post('/leaves/admin', newRequestData);
            setAddLeaveModalOpen(false);
            onDataRefresh();
            alert('Leave request added successfully!');
        } catch (error) {
            console.error("Failed to add leave request", error);
            alert("Failed to add leave request.");
        }
    };

    const stats = useMemo(() => {
        const totalEmployees = employees.length;
        const activeEmployees = employees.filter(e => e.status === 'Active').length;
        
        const plannedLeaves = requests.filter(r => r.leaveType === 'Annual Leave' && (r.status === 'Approved' || r.status === 'Pending')).length;
        const unplannedLeaves = requests.filter(r => r.leaveType === 'Medical Leave' || r.leaveType === 'Other').length;
        const pendingRequestsCount = requests.filter(r => r.status === 'Pending').length;

        return {
            totalPresent: `${activeEmployees}/${totalEmployees}`,
            plannedLeaves: plannedLeaves.toString(),
            unplannedLeaves: unplannedLeaves.toString(),
            pendingRequests: pendingRequestsCount.toString(),
        };
    }, [requests, employees]);

    const filteredRequests = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        
        return requests.filter(req => {
            const statusMatch = statusFilter === 'All' || req.status === statusFilter;
            if (!statusMatch) return false;

            if (lowercasedSearchTerm === '') return true;
            if (!req.employee) return false;

            return (
                req.employee.name.toLowerCase().includes(lowercasedSearchTerm) ||
                (req.employee.email && req.employee.email.toLowerCase().includes(lowercasedSearchTerm)) ||
                (req.employee.employeeId && req.employee.employeeId.toLowerCase().includes(lowercasedSearchTerm)) ||
                (req.employee.department && req.employee.department.toLowerCase().includes(lowercasedSearchTerm)) ||
                req.employee.role.toLowerCase().replace('_', ' ').includes(lowercasedSearchTerm)
            );
        });
    }, [requests, statusFilter, searchTerm]);
    
    const handleExport = () => {
        const dataToExport = filteredRequests.map(r => ({
            EmployeeName: r.employee.name,
            EmployeeRole: r.employee.role,
            LeaveType: r.leaveType,
            From: new Date(r.from).toLocaleDateString(),
            To: new Date(r.to).toLocaleDateString(),
            Days: r.days,
            Reason: r.reason,
            Status: r.status,
        }));
        exportToCSV(dataToExport, 'leave-requests.csv');
    };

    const getStatusClass = (status: LeaveRequest['status']) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    return (
        <div className="space-y-6">
            <AddLeaveModal 
                isOpen={isAddLeaveModalOpen}
                onClose={() => setAddLeaveModalOpen(false)}
                onAddLeave={handleAddLeave}
                employees={employees}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <LeaveStatCard icon="groups" title="Total Present" value={stats.totalPresent} colorClass="text-green-500" iconBgClass="bg-green-100" />
                <LeaveStatCard icon="event_available" title="Planned Leaves" value={stats.plannedLeaves} colorClass="text-pink-500" iconBgClass="bg-pink-100" />
                <LeaveStatCard icon="event_busy" title="Unplanned Leaves" value={stats.unplannedLeaves} colorClass="text-yellow-500" iconBgClass="bg-yellow-100" />
                <LeaveStatCard icon="pending_actions" title="Pending Requests" value={stats.pendingRequests} colorClass="text-cyan-500" iconBgClass="bg-cyan-100" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-gray-800">Leave Applications</h2>
                    <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
                        <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
                            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by employee..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-black placeholder-gray-400"
                            />
                        </div>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 border rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500">
                            <option value="All">All</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                         <button onClick={handleExport} className="bg-white text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-100 transition-colors shadow-sm border border-gray-200">
                            <Icon name="download" className="mr-2 text-sm" /> Export
                        </button>
                        <button onClick={() => setAddLeaveModalOpen(true)} className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-red-600 transition-colors shadow">
                            <Icon name="add" className="mr-2" /> Add Leave
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b-2 border-gray-200">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Employee</th>
                                <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Leave Type</th>
                                <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">From</th>
                                <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">To</th>
                                <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Days</th>
                                <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider max-w-xs">Reason</th>
                                <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Status</th>
                                <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map((req) => (
                                <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="p-3 text-gray-800 font-medium">
                                        <div className="flex items-center">
                                            <img src={req.employee.avatar} alt={req.employee.name} className="w-10 h-10 rounded-full mr-3" />
                                            <div>
                                                <p>{req.employee.name}</p>
                                                <p className="text-xs text-gray-500">{req.employee.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 text-gray-600">{req.leaveType}</td>
                                    <td className="p-3 text-gray-600">{new Date(req.from).toLocaleDateString()}</td>
                                    <td className="p-3 text-gray-600">{new Date(req.to).toLocaleDateString()}</td>
                                    <td className="p-3 text-gray-600">{req.days}</td>
                                    <td className="p-3 text-gray-600 max-w-xs truncate">{req.reason}</td>
                                    <td className="p-3">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-700">
                                        {req.status === 'Pending' ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleUpdateRequest(req.id, 'Approved')} className="p-1.5 rounded-md bg-green-100 hover:bg-green-200 text-green-700">
                                                    <Icon name="check" className="text-sm" />
                                                </button>
                                                <button onClick={() => handleUpdateRequest(req.id, 'Rejected')} className="p-1.5 rounded-md bg-red-100 hover:bg-red-200 text-red-700">
                                                    <Icon name="close" className="text-sm" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                             {filteredRequests.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center p-6 text-gray-500">
                                        No leave requests found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeaveRequestsPage;
