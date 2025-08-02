
import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Icon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-icons ${className || ''}`}>{name}</span>
);

const SettingsCard: React.FC<{ title: string; icon: string; children: React.ReactNode; }> = ({ title, icon, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Icon name={icon} className="mr-3 text-red-500" />
            {title}
        </h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const CompanySettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Local state for forms
    const [newOverride, setNewOverride] = useState({ date: '', clockIn: '11:00' });
    const [newHoliday, setNewHoliday] = useState({ name: '', date: '' });

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const res = await api.get('/company-settings');
                setSettings(res.data.data);
            } catch (error) {
                console.error("Failed to fetch company settings", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, section: string, field: string) => {
        setSettings((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: e.target.value
            }
        }));
    };
    
    const handleAddOverride = () => {
        if (!newOverride.date || !newOverride.clockIn) {
            alert("Please provide both a date and a clock-in time for the override.");
            return;
        }
        setSettings((prev: any) => ({
            ...prev,
            dateOverrides: [...prev.dateOverrides, newOverride]
        }));
        setNewOverride({ date: '', clockIn: '11:00' });
    };

    const handleRemoveOverride = (index: number) => {
        setSettings((prev: any) => ({
            ...prev,
            dateOverrides: prev.dateOverrides.filter((_: any, i: number) => i !== index)
        }));
    };
    
    const handleAddHoliday = () => {
        if (!newHoliday.date || !newHoliday.name) {
            alert("Please provide both a name and a date for the holiday.");
            return;
        }
        setSettings((prev: any) => ({
            ...prev,
            holidays: [...prev.holidays, newHoliday]
        }));
        setNewHoliday({ name: '', date: '' });
    };

    const handleRemoveHoliday = (index: number) => {
        setSettings((prev: any) => ({
            ...prev,
            holidays: prev.holidays.filter((_: any, i: number) => i !== index)
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.put('/company-settings', settings);
            alert('Company settings saved successfully!');
        } catch (error) {
            console.error("Failed to save company settings", error);
            alert('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading || !settings) {
        return <div className="text-center p-10">Loading Company Settings...</div>;
    }

    return (
        <div className="space-y-6">
            <SettingsCard title="Leave Policies" icon="event_note">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Annual Leave Days</label>
                        <input type="number" value={settings.leavePolicies.annual} onChange={e => handleInputChange(e, 'leavePolicies', 'annual')} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medical Leave Days</label>
                        <input type="number" value={settings.leavePolicies.medical} onChange={e => handleInputChange(e, 'leavePolicies', 'medical')} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Other Leave Days</label>
                        <input type="number" value={settings.leavePolicies.other} onChange={e => handleInputChange(e, 'leavePolicies', 'other')} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" />
                    </div>
                </div>
            </SettingsCard>
            
            <SettingsCard title="Working Hours & Punctuality" icon="schedule">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Standard Clock-In Time</label>
                        <input type="time" value={settings.workingHours.clockIn} onChange={e => handleInputChange(e, 'workingHours', 'clockIn')} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Late Grace Period (minutes)</label>
                        <input type="number" value={settings.workingHours.lateGraceMinutes} onChange={e => handleInputChange(e, 'workingHours', 'lateGraceMinutes')} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" />
                    </div>
                </div>
                 <div className="pt-4 border-t">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">Date-Specific Clock-In Overrides</h3>
                    <div className="space-y-2">
                        {settings.dateOverrides.map((override: any, index: number) => (
                            <div key={index} className="flex items-center justify-between bg-slate-100 p-2 rounded-md">
                                <p className="text-sm text-gray-800">On <span className="font-semibold">{new Date(override.date + 'T00:00:00').toLocaleDateString()}</span>, clock-in is at <span className="font-semibold">{override.clockIn}</span></p>
                                <button onClick={() => handleRemoveOverride(index)} className="p-1 rounded-full text-red-500 hover:bg-red-100"><Icon name="delete_outline" /></button>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-end gap-2 mt-3">
                         <div className="flex-grow"><label className="block text-xs font-medium text-gray-700 mb-1">Date</label><input type="date" value={newOverride.date} onChange={e => setNewOverride({...newOverride, date: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" /></div>
                         <div className="flex-grow"><label className="block text-xs font-medium text-gray-700 mb-1">New Clock-In Time</label><input type="time" value={newOverride.clockIn} onChange={e => setNewOverride({...newOverride, clockIn: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" /></div>
                         <button onClick={handleAddOverride} className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700"><Icon name="add" /></button>
                    </div>
                </div>
            </SettingsCard>

            <SettingsCard title="Holiday Management" icon="celebration">
                 <div className="space-y-2">
                    {settings.holidays.map((holiday: any, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-slate-100 p-2 rounded-md">
                            <p className="text-sm text-gray-800"><span className="font-semibold">{holiday.name}</span> on <span className="font-semibold">{new Date(holiday.date + 'T00:00:00').toLocaleDateString()}</span></p>
                            <button onClick={() => handleRemoveHoliday(index)} className="p-1 rounded-full text-red-500 hover:bg-red-100"><Icon name="delete_outline" /></button>
                        </div>
                    ))}
                 </div>
                 <div className="flex items-end gap-2 mt-3">
                    <div className="flex-grow"><label className="block text-xs font-medium text-gray-700 mb-1">Holiday Name</label><input type="text" placeholder="e.g. New Year's Day" value={newHoliday.name} onChange={e => setNewHoliday({...newHoliday, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" /></div>
                    <div className="flex-grow"><label className="block text-xs font-medium text-gray-700 mb-1">Date</label><input type="date" value={newHoliday.date} onChange={e => setNewHoliday({...newHoliday, date: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md bg-white text-black" /></div>
                    <button onClick={handleAddHoliday} className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700"><Icon name="add" /></button>
                </div>
            </SettingsCard>
            
            <div className="flex justify-end pt-4 mt-6 border-t border-gray-200">
                <button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="text-white px-6 py-2 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600"
                >
                    <Icon name="save" className="mr-2" />
                    {isSaving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>
        </div>
    );
};

export default CompanySettingsPage;