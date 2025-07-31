

export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum ClockStatus {
  CLOCKED_OUT = 'CLOCKED_OUT',
  CLOCKED_IN = 'CLOCKED_IN',
  ON_BREAK = 'ON_BREAK',
}

export interface AttendanceStatus {
  status: ClockStatus;
  workStartTime: string | null;
  breakStartTime: string | null;
}

export interface LeaveStatsData {
    totalAllowed: number;
    taken: number;
    pending: number;
    available: number;
    breakdown: {
        type: string;
        total: number;
        taken: number;
        color: string;
    }[];
}

export interface HourStats {
    worked: number;
    overtime: number;
}
export interface HourStatsCollection {
    today: HourStats;
    week: HourStats;
    month: HourStats;
}


export interface FilterOption {
  label: string;
  value: string;
}

export interface StatCardData {
  icon: string;
  iconBgColor: string;
  iconColor: string;
  title: string;
  value: string;
  trend: string;
  trendColor: string;
}

export interface DepartmentData {
  name: string;
  percentage: number;
}

export interface BasicEmployee {
  name:string;
  avatar: string;
  role: string;
  employeeId?: string;
  email?: string;
  department?: string;
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  avatar: string;
  email: string;
  role: UserRole;
  department: string;
  joinedOn: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  phone: string;
  reportTo: string;
}

export type Employee = User;


export interface ClockInOutRecord extends BasicEmployee {
  time: string;
  status: 'in' | 'out' | 'break';
}

export interface AttendanceStat {
    status: 'Present' | 'Late' | 'Permission' | 'Absent';
    percentage: number;
    color: string;
}

export interface LeaveBalance {
    type: string;
    total: number;
    used: number;
    color: string;
}

export interface AttendanceHistoryEntry {
    date: string;
    clockIn: string;
    clockOut: string;
    hours: string;
    status: 'Present' | 'Late' | 'Absent';
}

export interface EmployeeProfileData {
    name: string;
    avatar: string;
    role: string;
    department: string;
    phone: string;
    email: string;
    reportTo: string;
    joinedOn: string;
}

export interface HourStatData {
    title: string;
    current: number;
    total: number;
    icon: string;
    iconBgColor: string;
    iconColor: string;
    borderColor: string;
}

export interface LeaveBreakdownStat {
    label: string;
    value: number;
    color: string;
}

export interface LeaveStat {
    label: string;
    value: number;
}

export interface TimelineSegment {
    type: 'working' | 'productive' | 'break' | 'overtime';
    percentage: number;
    color: string;
}

export interface LeaveRequest {
  id: string;
  employee: BasicEmployee;
  leaveType: 'Annual Leave' | 'Medical Leave' | 'Other';
  from: string;
  to: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface ReportStatCardData {
  icon: string;
  iconBgColor: string;
  iconColor: string;
  title: string;
  value: string;
  trend: string;
  progress: number;
}

export interface EmployeeAttendanceRecord {
    id: string;
    employee: BasicEmployee;
    date: string;
    checkIn: string;
    checkOut: string;
    status: 'Present' | 'Absent' | 'Late';
    break: string;
    late: string;
    overtime: string;
    production: number; // in hours
}

export interface Notification {
    _id: string;
    text: string;
    type: 'leave' | 'attendance' | 'system';
    read: boolean;
    createdAt: string;
    link?: string;
}

export interface Settings {
    companyName: string;
    companyLogo?: string;
}