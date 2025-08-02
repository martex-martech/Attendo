import React, { useState, useEffect } from 'react';
import { Settings, User, UserRole } from '../types';
import api from '../utils/api';

const Icon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-icons ${className || ''}`}>{name}</span>
);

const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string; isOpen: boolean }> = ({ children, onClose, title, isOpen }) => {
    if (!isOpen) return null;
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

const ChangePasswordForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        setIsSubmitting(true);
        try {
            await api.put('/users/profile/change-password', { oldPassword, newPassword });
            alert('Password changed successfully!');
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to change password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="mt-6 pt-4 flex justify-end border-t border-gray-200">
                <button type="button" onClick={onClose} className="mr-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-red-400">
                    {isSubmitting ? 'Saving...' : 'Save Password'}
                </button>
            </div>
        </form>
    );
};


const SettingsCard: React.FC<{ title: string; icon: string; children: React.ReactNode; iconColor?: string }> = ({ title, icon, children, iconColor = 'text-red-500' }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Icon name={icon} className={`mr-3 ${iconColor}`} />
            {title}
        </h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between">
        <span className="text-gray-700">{label}</span>
        <button
            onClick={() => onChange(!enabled)}
            className={`${enabled ? 'bg-red-500' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
        >
            <span
                className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
        </button>
    </div>
);

const SettingsPage: React.FC<{ user: User }> = ({ user }) => {
    const [settings, setSettings] = useState<Partial<Settings>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const res = await api.get('/settings');
                setSettings(res.data.data);
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
            fetchSettings();
        } else {
            setIsLoading(false);
        }
    }, [user.role]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.put('/settings', settings);
            alert('Settings saved successfully!');
        } catch (error) {
            console.error("Failed to save settings", error);
            alert('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    if (isLoading) {
        return <div className="text-center p-10">Loading settings...</div>
    }

    return (
        <div className="space-y-6">
            <Modal isOpen={isPasswordModalOpen} onClose={() => setPasswordModalOpen(false)} title="Change Password">
                <ChangePasswordForm onClose={() => setPasswordModalOpen(false)} />
            </Modal>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                        <SettingsCard title="General Settings" icon="tune">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input name="companyName" type="text" value={settings.companyName || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
                                <div className="flex items-center gap-4">
                                    <img src={settings.companyLogo || "/logo-placeholder.png"} alt="Company Logo" className="w-16 h-16 rounded-md bg-gray-200 p-1 object-contain" />
                                    <input type="file" className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
                                </div>
                            </div>
                        </SettingsCard>
                    )}
                     <SettingsCard title="Notification Settings" icon="notifications_active">
                        <ToggleSwitch label="Email Notifications" enabled={true} onChange={() => {}} />
                        <ToggleSwitch label="Push Notifications" enabled={false} onChange={() => {}} />
                        <p className="text-xs text-gray-500 mt-2">Control how you receive important updates. (UI only for now)</p>
                    </SettingsCard>
                </div>
                 <div className="space-y-6">
                    <SettingsCard title="Security" icon="security">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <button onClick={() => setPasswordModalOpen(true)} className="w-full text-left p-2 border border-gray-300 rounded-md bg-white text-black hover:bg-gray-50">Change Password</button>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Two-Factor Authentication</label>
                            <button className="w-full text-left p-2 border border-gray-300 rounded-md bg-white text-black hover:bg-gray-50">Enable 2FA (Coming Soon)</button>
                        </div>
                    </SettingsCard>
                    {(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                         <SettingsCard title="API Integration" icon="api">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your API Key</label>
                                 <div className="flex items-center gap-2">
                                    <input type="text" readOnly value="********************abcd" className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600" />
                                    <button className="p-2 rounded-md hover:bg-gray-100 text-gray-600"><Icon name="content_copy" className="text-sm"/></button>
                                </div>
                            </div>
                             <button className="w-full text-left p-2 border border-dashed rounded-md bg-white text-red-500 hover:bg-gray-50 text-center font-semibold">Regenerate API Key</button>
                        </SettingsCard>
                    )}
                </div>
            </div>

            {(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                <div className="flex justify-end pt-4 mt-6 border-t border-gray-200">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving} 
                        className="text-white px-6 py-2 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
