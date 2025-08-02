import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, User, LeaveRequest, Employee } from './types';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboardPage from './pages/EmployeeDashboardPage';
import MyAttendancePage from './pages/MyAttendancePage';
import MyLeaveRequestPage from './pages/MyLeaveRequestPage';
import EmployeeProfile from './pages/EmployeeProfile';
import EmployeesPage from './pages/EmployeesPage';
import LeaveRequestsPage from './pages/LeaveRequestsPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import NotificationsPage from './pages/NotificationsPage';
import CompanySettingsPage from './pages/CompanySettingsPage';
import { NAV_LINKS } from './constants';
import api from './utils/api';
import AppHeader from './components/Header';

const getInitialDarkMode = () => {
    return false; // Always use light mode
};

const Icon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-icons ${className || ''}`}>{name}</span>
);

const SideBar = ({ user, activeLink, setActiveLink, onLogout }: { user: User; activeLink: string; setActiveLink: (link: string) => void; onLogout: () => void; }) => {
    const navLinks = NAV_LINKS[user.role];
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
    
    const activeClass = 'bg-red-500 text-white shadow-lg scale-105';
    const brandIconColor = 'text-red-500';
    const logoutButtonClass = 'bg-red-500 hover:bg-red-600';

    return (
        <aside className="w-64 bg-white text-gray-900 flex flex-col min-h-screen flex-shrink-0 border-r border-gray-200">
            <div className="p-4 text-center border-b border-gray-200 h-[65px] flex items-center justify-center">
                    <h1 className="text-2xl font-bold flex items-center justify-center">
                        <Icon name={isSuperAdmin ? "shield_person" : "task_alt"} className={`mr-2 ${brandIconColor}`} />
                        <span>Martex</span>
                    </h1>
            </div>
            <nav className="flex-grow p-4 space-y-2">
                {navLinks.map((link) => (
                    <a
                        key={link.name}
                        href="#"
                        onClick={(e) => { e.preventDefault(); setActiveLink(link.name); }}
                        className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-300 transform ${
                            activeLink === link.name
                                ? activeClass
                                : 'text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        <Icon name={link.icon} className="mr-3" />
                        <span className="font-medium">{link.name}</span>
                    </a>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-200">
                 <div className="flex items-center mb-4">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mr-3" />
                    <div>
                        <p className="font-bold text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                           {isSuperAdmin && <Icon name="workspace_premium" className="text-sm mr-1 text-red-400" />}
                           {user.role.replace('_', ' ')}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={onLogout} 
                    className={`w-full flex items-center justify-center text-white px-4 py-2 rounded-lg transition-colors ${logoutButtonClass}`}
                >
                    <Icon name="logout" className="mr-2" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

const App: React.FC = () => {
    const [auth, setAuth] = useState<{ user: User | null; token: string | null; loading: boolean }>({
        user: null,
        token: localStorage.getItem('token'),
        loading: true,
    });
    const [activeLink, setActiveLink] = useState('Dashboard');
    // Removed dark mode state
    
    // Centralized state
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    
    // Removed toggleDarkMode function as it's unused now

    // Removed switchToLightMode

    // Removed dark mode effect
    
    const handleLogout = () => {
        localStorage.removeItem('token');
        setAuth({ user: null, token: null, loading: false });
        setAllUsers([]);
        setLeaveRequests([]);
    };

    const fetchAllAdminData = useCallback(async () => {
        if (!auth.token || auth.user?.role === UserRole.EMPLOYEE) return;
        setIsLoadingData(true);
        try {
            const [usersRes, leavesRes] = await Promise.all([
                api.get('/users'),
                api.get('/leaves')
            ]);
            
            const formattedLeaves = leavesRes.data.data.map((req: any) => ({
                ...req,
                id: req._id,
                employee: {
                    id: req.user._id,
                    name: req.user.name,
                    avatar: req.user.avatar,
                    role: req.user.role,
                    employeeId: req.user.employeeId,
                    email: req.user.email,
                    department: req.user.department,
                }
            }));

            setAllUsers(usersRes.data.data.map((e: any) => ({...e, id: e._id})));
            setLeaveRequests(formattedLeaves);
        } catch (error) {
            console.error("Failed to fetch initial data", error);
            if ((error as any).response?.status === 401) {
                handleLogout();
            }
        } finally {
            setIsLoadingData(false);
        }
    }, [auth.token, auth.user?.role]);

    const handleEmployeeAddLeaveRequest = async (requestData: Omit<LeaveRequest, 'id' | 'status' | 'employee'>): Promise<boolean> => {
        try {
            await api.post('/leaves', requestData);
            alert('Leave request submitted successfully!');
            return true;
        } catch (error: any) {
            console.error("Failed to submit leave request", error);
            alert(`Failed to submit leave request: ${error.response?.data?.message || 'Please try again.'}`);
            return false;
        }
    };
    
    const refreshAuthUser = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const res = await api.get('/auth/me');
                setAuth(prev => ({ ...prev, user: { ...res.data.data, id: res.data.data._id } }));
            } catch (error) {
                 console.error("Failed to refresh user data", error);
                 handleLogout();
            }
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    setAuth({ user: { ...res.data.data, id: res.data.data._id }, token, loading: false });
                } catch (error) {
                    console.error("Session expired or invalid", error);
                    handleLogout();
                }
            } else {
                setAuth(prev => ({ ...prev, loading: false }));
            }
        };

        loadUser();
    }, []);

    useEffect(() => {
        if (auth.user?.role === UserRole.ADMIN || auth.user?.role === UserRole.SUPER_ADMIN) {
            fetchAllAdminData();
        }
    }, [auth.user, fetchAllAdminData]);
    
    const handleLogin = (user: User, token: string) => {
        localStorage.setItem('token', token);
        setAuth({ user: { ...user, id: (user as any)._id }, token, loading: false });
        setActiveLink('Dashboard');
    };
    
    const getHeaderProps = () => {
        if (!auth.user) return null;
        const breadcrumbs = [
            { label: 'Home', href: '#' },
            { label: activeLink }
        ];

        let title = activeLink;
        if(activeLink === 'Dashboard') {
            title = (auth.user.role === UserRole.ADMIN || auth.user.role === UserRole.SUPER_ADMIN) ? `Welcome Back, ${auth.user.name}` : `Welcome, ${auth.user.name.split(' ')[0]}!`;
        }

        return { title, breadcrumbs };
    };

    const renderContent = () => {
        if (!auth.user) return null;

        if (activeLink === 'Notifications') {
            return <NotificationsPage />;
        }

        const isAdminOrSuper = auth.user.role === UserRole.ADMIN || auth.user.role === UserRole.SUPER_ADMIN;

        if (isAdminOrSuper) {
             if (isLoadingData && !['Dashboard', 'Settings', 'Company Settings', 'Notifications'].includes(activeLink)) {
                return <div className="flex items-center justify-center h-full w-full"><p>Loading Data...</p></div>;
             }
             switch(activeLink) {
                case 'Dashboard':
                    return auth.user.role === UserRole.SUPER_ADMIN ? <SuperAdminDashboard setActiveLink={setActiveLink} /> : <AdminDashboard setActiveLink={setActiveLink} />;
                case 'Admin Management':
                     return auth.user.role === UserRole.SUPER_ADMIN ? <EmployeesPage user={auth.user} pageMode="admin" /> : <div>Not Authorized</div>;
                case 'Employees':
                    return <EmployeesPage user={auth.user} pageMode="employee" />;
                case 'Leave Requests':
                    return <LeaveRequestsPage requests={leaveRequests} employees={allUsers} onDataRefresh={fetchAllAdminData} />;
                case 'Reports':
                    return <ReportsPage employees={allUsers} />;
                case 'Settings':
                    return <SettingsPage user={auth.user} />;
                case 'Company Settings':
                    return auth.user.role === UserRole.SUPER_ADMIN ? <CompanySettingsPage /> : <div>Not Authorized</div>;
                default:
                     return auth.user.role === UserRole.SUPER_ADMIN ? <SuperAdminDashboard setActiveLink={setActiveLink} /> : <AdminDashboard setActiveLink={setActiveLink} />;
             }
        } else { // Employee
            const employeeUser = auth.user as Employee;
            switch (activeLink) {
                case 'Dashboard':
                    return <EmployeeDashboardPage user={employeeUser} onAddLeaveRequest={handleEmployeeAddLeaveRequest} />;
                case 'My Attendance':
                    return <MyAttendancePage />;
                case 'Leave Request':
                    return <MyLeaveRequestPage user={employeeUser} onAddLeaveRequest={handleEmployeeAddLeaveRequest} />;
                case 'My Profile':
                    return <EmployeeProfile user={employeeUser} onProfileUpdate={refreshAuthUser} onAddLeaveRequest={handleEmployeeAddLeaveRequest} />;
                default:
                    return <EmployeeDashboardPage user={employeeUser} onAddLeaveRequest={handleEmployeeAddLeaveRequest} />;
            }
        }
    };

    if (auth.loading) {
        return <div className="flex items-center justify-center h-screen bg-slate-100"><p className="text-gray-600">Authenticating...</p></div>;
    }

    if (!auth.user) {
        return <LoginPage onLoginSuccess={handleLogin} />;
    }
    
    const headerProps = getHeaderProps();

    return (
        <div className="flex min-h-screen bg-slate-100 font-sans">
            <SideBar user={auth.user} activeLink={activeLink} setActiveLink={setActiveLink} onLogout={handleLogout} />
            <main className="flex-1 p-6 overflow-auto flex flex-col justify-between">
                {headerProps && <AppHeader {...headerProps} userRole={auth.user.role} setActiveLink={setActiveLink} />}
                <div className="mt-6 flex-grow">
                    {renderContent()}
                </div>
                <footer className="text-center py-4 text-gray-500">
                    © 2025 Martex. All rights reserved.
                </footer>
            </main>
        </div>
    );
};

export default App;
