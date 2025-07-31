
import { FilterOption, UserRole, User } from './types';

export const PERIOD_FILTER_OPTIONS: FilterOption[] = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'this_week' },
    { label: 'This Month', value: 'this_month' },
];

export const DEPT_FILTER_OPTIONS: FilterOption[] = [
    { label: 'All Depts', value: 'all' },
    { label: 'UI/UX', value: 'ui_ux' },
    { label: 'Development', value: 'development' },
    { label: 'Management', value: 'management' },
    { label: 'HR', value: 'hr' },
];

export const NAV_LINKS: Record<UserRole, { name: string; icon: string }[]> = {
    [UserRole.SUPER_ADMIN]: [
        { name: 'Dashboard', icon: 'space_dashboard' },
        { name: 'Admin Management', icon: 'manage_accounts' },
        { name: 'Employees', icon: 'groups' },
        { name: 'Leave Requests', icon: 'mail' },
        { name: 'Notifications', icon: 'notifications' },
        { name: 'Reports', icon: 'assessment' },
        { name: 'Settings', icon: 'settings' },
        { name: 'Company Settings', icon: 'corporate_fare' },
    ],
    [UserRole.ADMIN]: [
        { name: 'Dashboard', icon: 'dashboard' },
        { name: 'Employees', icon: 'groups' },
        { name: 'Leave Requests', icon: 'mail' },
        { name: 'Notifications', icon: 'notifications' },
        { name: 'Reports', icon: 'assessment' },
        // { name: 'Payroll', icon: 'payments' }, // This page doesn't exist
        { name: 'Settings', icon: 'settings' },
    ],
    [UserRole.EMPLOYEE]: [
        { name: 'Dashboard', icon: 'dashboard' },
        { name: 'My Attendance', icon: 'event_available' },
        { name: 'My Profile', icon: 'person' },
        { name: 'Leave Request', icon: 'mail' },
        { name: 'Notifications', icon: 'notifications' },
    ],
};
