import React, { useState, useEffect, useCallback } from 'react';
import { ClockStatus, Employee, LeaveRequest, AttendanceStatus, LeaveBalance } from '../types';
import api from '../utils/api';

const Icon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-icons ${className || ''}`}>{name}</span>
);

const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string, isOpen: boolean }> = ({ children, onClose, title, isOpen }) => {
    if(!isOpen) return null;
    return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b pb-3 mb-4 p-4">
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <Icon name="close" />
                </button>
            </div>
            <div className="p-4 pt-0">{children}</div>
        </div>
    </div>
    );
};

const ApplyLeaveForm: React.FC<{ onClose: () => void; onAddLeaveRequest: (data: Omit<LeaveRequest, 'id' | 'status' | 'employee'>) => Promise<boolean>, balance: LeaveBalance[] | null }> = ({ onClose, onAddLeaveRequest, balance }) => {
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
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select value={leaveType} onChange={e => setLeaveType(e.target.value as any)} className="w-full p-2 border rounded-md bg-white border-gray-300 text-black">
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
                <input type="number" value={days} readOnly className="w-full p-2 border rounded-md bg-gray-100 border-gray-300 text-black" />
                 {balanceError && <p className="text-red-500 text-xs mt-1">{balanceError}</p>}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label><textarea value={reason} onChange={e => setReason(e.target.value)} required rows={3} className="w-full p-2 border rounded-md bg-white border-gray-300 text-black" placeholder="Please provide a reason for your leave..."></textarea></div>
        </div>
        <div className="mt-6 flex justify-end">
            <button type="button" onClick={onClose} className="mr-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={!!balanceError} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed">Submit Request</button>
        </div>
        </form>
    );
};

const AttendanceStatusViewer: React.FC<{
    status: ClockStatus | null;
    workStartTime: Date | null;
    breakStartTime: Date | null;
    isLoading: boolean;
    onClockAction: (action: 'CLOCK_IN' | 'START_BREAK' | 'END_BREAK' | 'CLOCK_OUT') => void;
}> = ({ status, workStartTime, breakStartTime, isLoading, onClockAction }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    
    const formatDuration = (start: Date | null, end: Date | null = null) => {
        if (!start) return '00h 00m 00s';
        const endTime = end || time;
        const diff = endTime.getTime() - start.getTime();

        if (diff < 0) return '00h 00m 00s';

        const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        return `${hours}h ${minutes}m ${seconds}s`;
    };
    
    const renderContent = () => {
        if (isLoading && !status) {
            return (
                <div className="flex flex-col items-center justify-center text-center">
                    <Icon name="hourglass_top" className="animate-spin text-4xl text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400 mt-4">Loading Status...</p>
                </div>
            );
        }
        if (!status) {
            return (
                <div className="flex flex-col items-center justify-center text-center">
                    <Icon name="error_outline" className="text-4xl text-red-400" />
                    <p className="text-gray-500 dark:text-gray-400 mt-4">Could not load attendance status.</p>
                </div>
            );
        }

        switch (status) {
            case ClockStatus.CLOCKED_OUT:
                return (
                    <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">You are currently clocked out.</p>
                         <div className="text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2"><Icon name="badge"/><span>Ready to clock in.</span></div>
                    </div>
                );
            case ClockStatus.ON_BREAK:
                 return (
                    <div className="text-center">
                         <p className="text-gray-500">On Break</p>
                        <h2 className="text-5xl font-extrabold text-gray-900 my-2">{formatDuration(breakStartTime)}</h2>
                        <div className="w-full border-t my-4"></div>
                        <p className="text-sm text-gray-700 mb-4">Total work time: {formatDuration(workStartTime, breakStartTime)}</p>
                    </div>
                );
            case ClockStatus.CLOCKED_IN:
            default:
                return (
                    <div className="text-center">
                        <p className="text-gray-500">Work duration</p>
                        <h2 className="text-5xl font-extrabold text-gray-900 my-2">{formatDuration(workStartTime)}</h2>
                        <div className="w-full border-t my-4"></div>
                        <p className="text-sm text-gray-700 mb-4">Clocked in at {workStartTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                );
        }
    }

    const renderButtons = () => {
        if (isLoading || !status) {
            return <div className="h-[52px]"></div>; // Placeholder to prevent layout shift
        }

        switch (status) {
            case ClockStatus.CLOCKED_OUT:
                return (
                    <button onClick={() => onClockAction('CLOCK_IN')} disabled={isLoading} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors shadow-md disabled:bg-red-300 disabled:cursor-wait">
                        <Icon name="login" className="mr-2" />
                        Clock In
                    </button>
                );
            case ClockStatus.CLOCKED_IN:
                return (
                    <div className="flex gap-4">
                        <button onClick={() => onClockAction('START_BREAK')} disabled={isLoading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors shadow-md disabled:bg-yellow-300 disabled:cursor-wait">
                            <Icon name="free_breakfast" className="mr-2" />
                            Start Break
                        </button>
                        <button onClick={() => onClockAction('CLOCK_OUT')} disabled={isLoading} className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors shadow-sm border border-slate-300 dark:border-gray-500 disabled:opacity-50 disabled:cursor-wait">
                            <Icon name="logout" className="mr-2" />
                            Clock Out
                        </button>
                    </div>
                );
            case ClockStatus.ON_BREAK:
                return (
                    <button onClick={() => onClockAction('END_BREAK')} disabled={isLoading} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors shadow-md disabled:bg-green-300 disabled:cursor-wait">
                         <Icon name="play_circle_filled" className="mr-2" />
                        End Break
                    </button>
                );
            default:
                return <div className="h-[52px]"></div>;
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg min-h-[300px] h-full flex flex-col justify-between">
            <div className="flex-grow flex items-center justify-center">
                 {renderContent()}
            </div>
            <div className="mt-4">
                {renderButtons()}
            </div>
            <p className="text-xs text-center text-gray-400 mt-4 pt-4 border-t border-gray-100">
                <Icon name="info_outline" className="text-sm mr-1 align-bottom"/>
                You can also clock in automatically via the ID scanner.
            </p>
        </div>
    );
};

const LeaveBalanceCard: React.FC<{ onApply: () => void, leaveBalance: LeaveBalance[] | null }> = ({ onApply, leaveBalance }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Leave Balance</h2>
        <div className="space-y-4">
            {!leaveBalance ? (
                <p className="text-gray-500">Loading leave balance...</p>
            ) : (
                leaveBalance.map(leave => (
                    <div key={leave.type}>
                        <div className="flex justify-between mb-1 text-sm">
                            <span className="font-medium text-gray-700">{leave.type}</span>
                            <span className="text-gray-500">{leave.used} / {leave.total} days</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                            <div className={`${leave.color} h-2.5 rounded-full`} style={{ width: `${Math.min((leave.used / leave.total), 1) * 100}%` }}></div>
                        </div>
                    </div>
                ))
            )}
        </div>
         <button onClick={onApply} className="mt-6 w-full bg-red-500 text-white py-2.5 rounded-lg hover:bg-red-600 transition-colors font-semibold">
            Apply for Leave
        </button>
    </div>
);

const EmployeeDashboardPage: React.FC<{ user: Employee; onAddLeaveRequest: (requestData: Omit<LeaveRequest, 'id' | 'status' | 'employee'>) => Promise<boolean>; }> = ({ user, onAddLeaveRequest }) => {
    const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[] | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);

    const fetchStatus = useCallback(async () => {
        try {
            const [statusRes, balanceRes] = await Promise.all([
                api.get('/attendance/status'),
                api.get('/leaves/balance')
            ]);
            setAttendanceStatus(statusRes.data.data);
            setLeaveBalance(balanceRes.data.data);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
            setAttendanceStatus(null);
        } finally {
            if (isLoading) setIsLoading(false);
        }
    }, [isLoading]);
    
    useEffect(() => {
        fetchStatus();
        const intervalId = setInterval(fetchStatus, 15000); // Poll every 15 seconds
        return () => clearInterval(intervalId);
    }, [fetchStatus]);

    const [time, setTime] = React.useState(new Date());

    const handleClockAction = async (action: 'CLOCK_IN' | 'START_BREAK' | 'END_BREAK' | 'CLOCK_OUT') => {
        setIsActionLoading(true);
        try {
            // Optimistically update attendanceStatus for CLOCK_IN and CLOCK_OUT
            if (action === 'CLOCK_IN') {
                setAttendanceStatus(prev => ({
                    ...prev,
                    status: 'CLOCKED_IN',
                    workStartTime: new Date().toISOString(),
                    clockInTime: new Date().toISOString(),
                }));
            } else if (action === 'CLOCK_OUT') {
                setAttendanceStatus(prev => ({
                    ...prev,
                    status: 'CLOCKED_OUT',
                    clockOutTime: new Date().toISOString(),
                }));
                // Stop timer by clearing time state or resetting
                setTime(new Date());
            }
            await api.post('/attendance/action', { action });
            await fetchStatus(); // Refresh status immediately
        } catch (error: any) {
            console.error(`Failed to perform action: ${action}`, error);
            alert(`Error: ${error.response?.data?.message || 'An error occurred.'}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    const workStartTime = attendanceStatus?.workStartTime ? new Date(attendanceStatus.workStartTime) : null;
    const breakStartTime = attendanceStatus?.breakStartTime ? new Date(attendanceStatus.breakStartTime) : null;
    
    return (
        <div className="space-y-6">
            <Modal isOpen={isLeaveModalOpen} onClose={() => setLeaveModalOpen(false)} title="Apply for Leave">
                <ApplyLeaveForm onClose={() => setLeaveModalOpen(false)} onAddLeaveRequest={onAddLeaveRequest} balance={leaveBalance} />
            </Modal>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AttendanceStatusViewer
                    status={attendanceStatus?.status || null}
                    workStartTime={workStartTime}
                    breakStartTime={breakStartTime}
                    isLoading={isLoading || isActionLoading}
                    onClockAction={handleClockAction}
                />
                <LeaveBalanceCard onApply={() => setLeaveModalOpen(true)} leaveBalance={leaveBalance} />
            </div>
        </div>
    );
};

export default EmployeeDashboardPage;