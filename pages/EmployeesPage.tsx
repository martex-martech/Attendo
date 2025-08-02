import React, { useState, useMemo, useRef, useEffect } from 'react';
import { exportToCSV } from '../utils';
import type { User } from '../types';
import { UserRole } from '../types';
import api from '../utils/api';

const Icon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-icons ${className || ''}`}>{name}</span>
);

const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string; isOpen: boolean }> = ({ children, onClose, title, isOpen }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
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

const AddUserForm: React.FC<{ onAddUser: (data: any) => Promise<void>; onClose: () => void; userRole: UserRole; pageMode: 'employee' | 'admin'; }> = ({ onAddUser, onClose, userRole, pageMode }) => {
    const isAddingAdmin = pageMode === 'admin';
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: isAddingAdmin ? UserRole.ADMIN : UserRole.EMPLOYEE,
        department: '',
        phone: '',
        employeeId: `${isAddingAdmin ? 'ADM' : 'EMP'}${Math.floor(Math.random() * 9000) + 1000}`,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: name === 'role' ? (value as UserRole) : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onAddUser(formData);
        setIsSubmitting(false);
    };
    
    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" placeholder="e.g. John Doe" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" placeholder="e.g. john.doe@example.com" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                    <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" placeholder="e.g. 123-456-7890" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                     <select name="role" value={formData.role} onChange={handleChange} disabled={isAddingAdmin} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black disabled:bg-gray-100" required>
                        <option value={UserRole.EMPLOYEE}>Employee</option>
                        {userRole === UserRole.SUPER_ADMIN && <option value={UserRole.ADMIN}>Admin</option>}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select name="department" value={formData.department} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" required>
                        <option value="">Select Department</option>
                        <option>Design</option>
                        <option>Development</option>
                        <option>Management</option>
                        <option>Marketing</option>
                        <option>Operations</option>
                        <option>IT</option>
                        <option>HR</option>
                    </select>
                </div>
            </div>
             <div className="mt-6 flex justify-end">
                <button type="button" onClick={onClose} className="mr-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-red-300">
                    {isSubmitting ? 'Adding...' : `Add ${isAddingAdmin ? 'Admin' : 'Employee'}`}
                </button>
            </div>
        </form>
    );
};

const EditUserForm: React.FC<{ onEditUser: (id: string, data: any) => Promise<void>; onClose: () => void; userToEdit: User; userRole: UserRole; pageMode: 'employee' | 'admin' }> = ({ onEditUser, onClose, userToEdit, userRole, pageMode }) => {
    const isEditingAdmin = pageMode === 'admin';

    const [formData, setFormData] = useState(userToEdit);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: name === 'role' ? (value as UserRole) : value });
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onEditUser(userToEdit.id, formData);
        setIsSubmitting(false);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
             <div className="flex items-center space-x-4">
                <img src={formData.avatar} alt="Avatar preview" className="w-16 h-16 rounded-full object-cover" />
                <p className="text-sm text-gray-500">Avatar is assigned automatically based on email.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                    <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select name="role" value={formData.role} onChange={handleChange} disabled={isEditingAdmin} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black disabled:bg-gray-100" required>
                        <option value={UserRole.EMPLOYEE}>Employee</option>
                        {userRole === UserRole.SUPER_ADMIN && <option value={UserRole.ADMIN}>Admin</option>}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select name="department" value={formData.department} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" required>
                        <option value="">Select Department</option>
                        <option>Design</option>
                        <option>Development</option>
                        <option>Management</option>
                        <option>Marketing</option>
                        <option>Operations</option>
                        <option>IT</option>
                        <option>HR</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" required>
                        <option>Active</option>
                        <option>Inactive</option>
                        <option>On Leave</option>
                    </select>
                </div>
            </div>
             <div className="mt-6 flex justify-end">
                <button type="button" onClick={onClose} className="mr-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-red-300">
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
};


const BulkUploadForm: React.FC<{ onBulkUpload: (users: any[]) => Promise<void>; }> = ({ onBulkUpload }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };
    
    const handleUpload = async () => {
        if (!file) {
            alert("Please select a file to upload.");
            return;
        }
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result;
            if (typeof text !== 'string') {
                 setIsProcessing(false);
                 return;
            };
            
            const rows = text.split('\n').slice(1); // remove header
            const newUsers = rows.filter(row => row.trim()).map(row => {
                const [name, email, role, department, phone] = row.split(',').map(item => item.trim());
                return { name, email, role, department, phone, employeeId: `EMP${Math.floor(Math.random() * 9000) + 1000}`};
            });
            
            await onBulkUpload(newUsers);
            setIsProcessing(false);
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-800">
                Upload a CSV file with user data. The file should contain columns in this order: Name, Email, Role, Department, Phone.
            </p>
             <a href="/sample-employees.csv" download className="text-red-500 hover:underline text-sm flex items-center">
                <Icon name="download" className="mr-1 text-base"/>
                Download Sample CSV
            </a>
            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center">
                <input type="file" id="csv-upload" accept=".csv" onChange={handleFileChange} className="hidden" />
                <label htmlFor="csv-upload" className="cursor-pointer text-red-500 font-semibold">
                    {file ? file.name : 'Choose a file to upload'}
                </label>
                <p className="text-xs text-gray-700 mt-1">CSV files only, max 5MB.</p>
            </div>
             <div className="mt-6 flex justify-end">
                <button onClick={handleUpload} disabled={!file || isProcessing} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-red-300 flex items-center">
                    {isProcessing ? <Icon name="hourglass_top" className="animate-spin mr-2" /> : <Icon name="upload_file" className="mr-2"/>}
                    {isProcessing ? 'Processing...' : 'Upload & Add'}
                </button>
            </div>
        </div>
    );
};

const AddUserModalContent: React.FC<{ onAddUser: (data: any) => Promise<void>; onBulkUpload: (users: any[]) => Promise<void>; onClose: () => void; userRole: UserRole; pageMode: 'employee' | 'admin' }> = ({ onAddUser, onBulkUpload, onClose, userRole, pageMode }) => {
    const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
    
    return (
        <div>
            <div className="border-b border-gray-200">
                 <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('single')} className={`${activeTab === 'single' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                        Add Single {pageMode === 'admin' ? 'Admin' : 'Employee'}
                    </button>
                    {pageMode === 'employee' && (
                    <button onClick={() => setActiveTab('bulk')} className={`${activeTab === 'bulk' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                        Bulk Upload
                    </button>
                    )}
                </nav>
            </div>
            <div className="p-6">
                {activeTab === 'single' ? (
                    <AddUserForm onAddUser={onAddUser} onClose={onClose} userRole={userRole} pageMode={pageMode} />
                ) : (
                    <BulkUploadForm onBulkUpload={onBulkUpload} />
                )}
            </div>
        </div>
    );
};

const ActionsMenu: React.FC<{ userToManage: User; onEdit: (user: User) => void; onDelete: (userId: string) => void; }> = ({ userToManage, onEdit, onDelete }) => {
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
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-red-500 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                <Icon name="more_vert" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-md shadow-lg z-10 border dark:border-slate-700">
                    <a href="#" onClick={(e) => { e.preventDefault(); onEdit(userToManage); setIsOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Icon name="edit" className="mr-2 text-sm"/> Edit
                    </a>
                    <a href="#" onClick={(e) => { e.preventDefault(); onDelete(userToManage.id); setIsOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50">
                        <Icon name="delete" className="mr-2 text-sm"/> Delete
                    </a>
                </div>
            )}
        </div>
    );
};

const UserManagementPage: React.FC<{ 
    user: User;
    pageMode: 'employee' | 'admin';
}> = ({ user, pageMode }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('All');
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const isModeAdmin = pageMode === 'admin';
    const pageTitle = isModeAdmin ? 'Admin Users' : 'All Employees';
    const userType = isModeAdmin ? 'Admin' : 'Employee';

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/users', {
                params: { role: isModeAdmin ? 'ADMIN' : 'EMPLOYEE' }
            });
            setUsers(res.data.data.map((u: any) => ({...u, id: u._id})));
        } catch (error) {
            console.error(`Failed to fetch ${userType}s`, error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [pageMode]);

    const handleAddUser = async (formData: any) => {
        try {
            await api.post('/users', formData);
            alert(`${userType} added successfully!`);
            setAddModalOpen(false);
            fetchData();
        } catch (error: any) {
            alert(`Failed to add ${userType}: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleEditUser = async (id: string, formData: any) => {
        try {
            await api.put(`/users/${id}`, formData);
            alert(`${userType} updated successfully!`);
            setEditModalOpen(false);
            setSelectedUser(null);
            fetchData();
        } catch (error: any) {
             alert(`Failed to update ${userType}: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if(window.confirm(`Are you sure you want to delete this ${userType}? This action cannot be undone.`)) {
            try {
                await api.delete(`/users/${userId}`);
                alert(`${userType} deleted successfully.`);
                fetchData();
            } catch (error: any) {
                 alert(`Failed to delete ${userType}: ${error.response?.data?.message || error.message}`);
            }
        }
    };

    const handleOpenEditModal = (userToEdit: User) => {
        setSelectedUser(userToEdit);
        setEditModalOpen(true);
    };

    const handleBulkAddUsers = async (newUsers: any[]) => {
        try {
           await api.post('/users/bulk', {employees: newUsers});
           alert('Bulk upload successful!');
           setAddModalOpen(false);
           fetchData();
       } catch (error: any) {
           alert(`Bulk upload failed: ${error.response?.data?.message || 'An error occurred.'}`);
       }
   };

    const departmentOptions = useMemo(() => {
        const depts = new Set(users.map(u => u.department));
        return ['All', ...Array.from(depts)];
    }, [users]);

    const filteredUsers = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();

        return users.filter(u => {
            const departmentMatch = departmentFilter === 'All' || u.department === departmentFilter;
            if (!departmentMatch) {
                return false;
            }

            if (lowercasedSearchTerm === '') {
                return true;
            }

            return (
                u.name.toLowerCase().includes(lowercasedSearchTerm) ||
                u.email.toLowerCase().includes(lowercasedSearchTerm) ||
                u.employeeId.toLowerCase().includes(lowercasedSearchTerm) ||
                u.department.toLowerCase().includes(lowercasedSearchTerm) ||
                u.role.toLowerCase().replace('_', ' ').includes(lowercasedSearchTerm)
            );
        });
    }, [users, searchTerm, departmentFilter]);
    
    const handleExport = () => {
        const dataToExport = filteredUsers.map(u => ({
            ID: u.employeeId,
            Name: u.name,
            Email: u.email,
            Department: u.department,
            Role: u.role,
            JoinedOn: new Date(u.joinedOn).toLocaleDateString(),
            Status: u.status
        }));
        exportToCSV(dataToExport, `${pageMode}s.csv`);
    };

    const getStatusClass = (status: User['status']) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800';
            case 'Inactive': return 'bg-gray-100 text-gray-800';
            case 'On Leave': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title={`Add New ${userType}`}>
                <AddUserModalContent userRole={user.role} pageMode={pageMode} onAddUser={handleAddUser} onBulkUpload={handleBulkAddUsers} onClose={() => setAddModalOpen(false)} />
            </Modal>
             {selectedUser && (
                <Modal isOpen={isEditModalOpen} onClose={() => { setEditModalOpen(false); setSelectedUser(null); }} title={`Edit ${userType}`}>
                   <EditUserForm userRole={user.role} pageMode={pageMode} onEditUser={handleEditUser} onClose={() => { setEditModalOpen(false); setSelectedUser(null); }} userToEdit={selectedUser} />
                </Modal>
            )}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-xl font-bold text-gray-800">{pageTitle} ({filteredUsers.length})</h1>
                <div className="flex items-center gap-2 w-full md:w-auto">
                     <button onClick={handleExport} className="bg-white text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-100 transition-colors shadow-sm border border-gray-200">
                        <Icon name="download" className="mr-2 text-sm" /> Export
                    </button>
                    <button onClick={() => setAddModalOpen(true)} className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-red-600 transition-colors shadow flex-shrink-0">
                        <Icon name="add" className="mr-2" /> Add {userType}
                    </button>
                </div>
            </div>
             <div className="flex items-center gap-2 mb-4 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, ID, role..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-black placeholder-gray-400"
                    />
                </div>
                <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="p-2 border rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500">
                    {departmentOptions.map(dept => (
                       <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
            <thead className="border-b-2 border-gray-200">
                <tr>
                    <th className="p-3 text-sm font-semibold text-gray-800 tracking-wider">{userType}</th>
                    <th className="p-3 text-sm font-semibold text-gray-800 tracking-wider">ID</th>
                    <th className="p-3 text-sm font-semibold text-gray-800 tracking-wider">Email</th>
                    <th className="p-3 text-sm font-semibold text-gray-800 tracking-wider">Department</th>
                    <th className="p-3 text-sm font-semibold text-gray-800 tracking-wider">Role</th>
                    <th className="p-3 text-sm font-semibold text-gray-800 tracking-wider">Joined On</th>
                    <th className="p-3 text-sm font-semibold text-gray-800 tracking-wider">Status</th>
                    <th className="p-3 text-sm font-semibold text-gray-800 tracking-wider">Actions</th>
                </tr>
            </thead>
                    <tbody>
                        {isLoading ? (
                             <tr><td colSpan={8} className="text-center p-6 text-gray-700">Loading...</td></tr>
                        ) : filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-3 text-gray-900 font-medium">
                                <div className="flex items-center">
                                    <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full mr-3 object-cover" />
                                    <span className="text-gray-900">{u.name}</span>
                                </div>
                            </td>
                            <td className="p-3 text-gray-800">{u.employeeId}</td>
                            <td className="p-3 text-gray-800">{u.email}</td>
                            <td className="p-3 text-gray-800">{u.department}</td>
                            <td className="p-3 text-gray-800">{u.role.replace('_', ' ')}</td>
                            <td className="p-3 text-gray-800">{new Date(u.joinedOn).toLocaleDateString()}</td>
                            <td className="p-3">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(u.status)}`}>
                                    {u.status}
                                </span>
                            </td>
                            <td className="p-3">
                                <ActionsMenu userToManage={u} onEdit={handleOpenEditModal} onDelete={handleDeleteUser} />
                            </td>
                        </tr>
                        ))}
                         {filteredUsers.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={8} className="text-center p-6 text-gray-700">
                                    No {userType}s found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Original export for backward compatibility with App.tsx if needed, but the new name is more descriptive.
export default UserManagementPage;
