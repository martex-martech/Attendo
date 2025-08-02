
import React, { useState, useEffect, useCallback } from 'react';
import { Employee, LeaveRequest, LeaveBalance } from '../types';
import api from '../utils/api';

const Icon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-icons ${className || ''}`}>{name}</span>
);

const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string, isOpen: boolean }> = ({ children, onClose, title, isOpen }) => {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
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

const ApplyLeaveForm: React.FC<{ 
    onAddLeaveRequest: (data: Omit<LeaveRequest, 'id' | 'status' | 'employee'>) => Promise<boolean>; 
    onClose: () => void;
    balance: LeaveBalance[] | null;
}> = ({ onAddLeaveRequest, onClose, balance }) => {
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
                    <select value={leaveType} onChange={e => setLeaveType(e.target.value as any)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black">
                        <option>Annual Leave</option>
                        <option>Medical Leave</option>
                        <option>Other</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" /></div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. of Days</label>
                    <input type="number" value={days} readOnly className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-black" />
                     {balanceError && <p className="text-red-500 text-xs mt-1">{balanceError}</p>}
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label><textarea value={reason} onChange={e => setReason(e.target.value)} required rows={3} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" placeholder="Please provide a reason for your leave..."></textarea></div>
            </div>
             <div className="mt-6 pt-4 flex justify-end border-t border-gray-200">
                <button type="button" onClick={onClose} className="mr-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={!!balanceError} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed">Submit Request</button>
            </div>
        </form>
    );
};

const LeaveBalanceCard: React.FC<{ onApply: () => void, balance: LeaveBalance[] | null }> = ({ onApply, balance }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Leave Balance</h2>
        <div className="space-y-4">
            {balance ? balance.map(leave => (
                <div key={leave.type}>
                    <div className="flex justify-between mb-1 text-sm">
                        <span className="font-medium text-gray-800">{leave.type}</span>
                        <span className="text-gray-500 dark:text-gray-400">{leave.used} / {leave.total} days</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div className={`${leave.color} h-2.5 rounded-full`} style={{ width: `${Math.min((leave.used / leave.total), 1) * 100}%` }}></div>
                    </div>
                </div>
            )) : <p className="text-gray-500">Loading...</p>}
        </div>
         <button onClick={onApply} className="mt-6 w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors shadow-md font-semibold">
            Apply for Leave
        </button>
    </div>
);

const LeaveRequestHistory: React.FC<{ requests: LeaveRequest[], isLoading: boolean }> = ({ requests, isLoading }) => {
    const getStatusClass = (status: LeaveRequest['status']) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg h-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">My Leave Requests</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b-2 border-gray-200 dark:border-slate-700">
                        <tr>
                            <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wider">Leave Type</th>
                            <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wider">From</th>
                            <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wider">To</th>
                            <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wider">Days</th>
                            <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wider">Reason</th>
                            <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} className="text-center p-6 text-gray-500">Loading...</td></tr>
                        ) : requests.length === 0 ? (
                           <tr><td colSpan={6} className="text-center p-6 text-gray-500">No leave requests found.</td></tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id} className="border-b border-gray-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="p-3 text-gray-800 font-medium">{req.leaveType}</td>
                                    <td className="p-3 text-gray-800">{new Date(req.from).toLocaleDateString()}</td>
                                    <td className="p-3 text-gray-800">{new Date(req.to).toLocaleDateString()}</td>
                                    <td className="p-3 text-gray-800">{req.days}</td>
                                    <td className="p-3 text-gray-800 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                    <td className="p-3">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const MyLeaveRequestPage: React.FC<{ user: Employee; onAddLeaveRequest: (requestData: Omit<LeaveRequest, 'id' | 'status' | 'employee'>) => Promise<boolean>; }> = ({ user, onAddLeaveRequest }) => {
    const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
    const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMyData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [requestsRes, balanceRes] = await Promise.all([
                api.get('/leaves/my-requests'),
                api.get('/leaves/balance')
            ]);
            setMyRequests(requestsRes.data.data.map((r: any) => ({ ...r, id: r._id })));
            setLeaveBalance(balanceRes.data.data);
        } catch (error) {
            console.error("Failed to fetch leave data", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyData();
    }, [fetchMyData]);

    const handleAddLeave = async (requestData: Omit<LeaveRequest, 'id' | 'status' | 'employee'>) => {
        const success = await onAddLeaveRequest(requestData);
        if (success) {
            setLeaveModalOpen(false);
            fetchMyData(); // Re-fetch all data
        }
        return success;
    };

    return (
        <div className="space-y-6">
             <Modal isOpen={isLeaveModalOpen} onClose={() => setLeaveModalOpen(false)} title="Apply for Leave">
                <ApplyLeaveForm onAddLeaveRequest={handleAddLeave} onClose={() => setLeaveModalOpen(false)} balance={leaveBalance} />
            </Modal>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <LeaveBalanceCard onApply={() => setLeaveModalOpen(true)} balance={leaveBalance} />
                </div>
                <div className="lg:col-span-2">
                     <LeaveRequestHistory requests={myRequests} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
};

export default MyLeaveRequestPage;
