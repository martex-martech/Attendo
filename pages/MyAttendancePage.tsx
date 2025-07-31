
import React, { useState, useEffect } from 'react';
import { AttendanceHistoryEntry } from '../types';
import api from '../utils/api';

const Icon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-icons ${className || ''}`}>{name}</span>
);

const AttendanceHistoryTable: React.FC<{ history: AttendanceHistoryEntry[]; isLoading: boolean; }> = ({ history, isLoading }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-full">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Attendance History</h2>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b-2 border-gray-200 dark:border-slate-700">
                    <tr>
                        <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wider">Date</th>
                        <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wider">Clock In</th>
                        <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wider">Clock Out</th>
                        <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wider">Work Hours</th>
                        <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan={5} className="text-center p-6 text-gray-500">Loading history...</td></tr>
                    ) : history.length === 0 ? (
                        <tr><td colSpan={5} className="text-center p-6 text-gray-500">No attendance history found.</td></tr>
                    ) : (
                        history.map((entry, index) => (
                            <tr key={index} className="border-b border-gray-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">{entry.date}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{entry.clockIn}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{entry.clockOut}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{entry.hours}</td>
                                <td className="p-3">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                        entry.status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                                        entry.status === 'Late' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                        'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                    }`}>
                                        {entry.status}
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


const MyAttendancePage: React.FC = () => {
    const [history, setHistory] = useState<AttendanceHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const res = await api.get('/attendance/history');
                setHistory(res.data.data);
            } catch (error) {
                console.error("Failed to fetch attendance history", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="space-y-6">
            <AttendanceHistoryTable history={history} isLoading={isLoading} />
        </div>
    );
};

export default MyAttendancePage;
