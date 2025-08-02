import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { AttendanceHistoryEntry } from '../types';
import AttendanceStatusViewer from './AdminDashboard'; // Reuse the enhanced component from AdminDashboard

const AttendanceHistoryTable: React.FC<{ history: AttendanceHistoryEntry[]; isLoading: boolean; }> = ({ history, isLoading }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Attendance History</h2>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b-2 border-gray-200">
                    <tr>
                        <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Date</th>
                        <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Clock In</th>
                        <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Clock Out</th>
                        <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Work Hours</th>
                        <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan={5} className="text-center p-6 text-gray-500">Loading history...</td></tr>
                    ) : history.length === 0 ? (
                        <tr><td colSpan={5} className="text-center p-6 text-gray-500">No attendance history found.</td></tr>
                    ) : (
                        history.map((entry, index) => (
                            <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-slate-50 transition-colors">
                                <td className="p-3 text-gray-700 font-medium">{entry.date}</td>
                                <td className="p-3 text-gray-700">{entry.clockIn}</td>
                                <td className="p-3 text-gray-700">{entry.clockOut}</td>
                                <td className="p-3 text-gray-700">{entry.hours}</td>
                                <td className="p-3">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                        entry.status === 'Present' ? 'bg-green-100 text-green-800' :
                                        entry.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
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
            <AttendanceStatusViewer />
            <AttendanceHistoryTable history={history} isLoading={isLoading} />
        </div>
    );
};

export default MyAttendancePage;
