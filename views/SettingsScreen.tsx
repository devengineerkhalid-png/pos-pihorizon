
import React, { useState } from 'react';
import { Button, Input, Card, Select } from '../components/UIComponents';
import { Store, QrCode, Sliders, Printer, Save, Upload, Moon, Sun, Palette, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const SettingsScreen: React.FC = () => {
    const { settings, updateSettings } = useStore();
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'SYSTEM' | 'APPEARANCE' | 'QR'>('APPEARANCE');

    // Local state to handle form inputs before saving
    const [formData, setFormData] = useState(settings);

    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({...prev, [key]: value}));
    };

    const handleSave = () => {
        updateSettings(formData);
        alert('Settings updated successfully!');
    };

    const colors: {id: any, color: string}[] = [
        { id: 'indigo', color: '#6366f1' },
        { id: 'emerald', color: '#10b981' },
        { id: 'rose', color: '#f43f5e' },
        { id: 'amber', color: '#f59e0b' },
        { id: 'blue', color: '#3b82f6' },
        { id: 'violet', color: '#8b5cf6' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
            
            <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                 <button 
                    onClick={() => setActiveTab('APPEARANCE')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'APPEARANCE' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    <div className="flex items-center gap-2"><Palette size={18} /> Appearance</div>
                </button>
                <button 
                    onClick={() => setActiveTab('PROFILE')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'PROFILE' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    <div className="flex items-center gap-2"><Store size={18} /> Shop Profile</div>
                </button>
                <button 
                    onClick={() => setActiveTab('SYSTEM')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'SYSTEM' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    <div className="flex items-center gap-2"><Sliders size={18} /> System Preferences</div>
                </button>
                <button 
                    onClick={() => setActiveTab('QR')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'QR' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    <div className="flex items-center gap-2"><QrCode size={18} /> QR Codes</div>
                </button>
            </div>

            <div className="max-w-4xl">
                {activeTab === 'APPEARANCE' && (
                    <Card title="Interface Customization">
                        <div className="space-y-8">
                            {/* Theme Mode */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Color Theme</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <button 
                                        onClick={() => { handleChange('themeMode', 'light'); updateSettings({themeMode: 'light'}); }}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${formData.themeMode === 'light' ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                                    >
                                        <Sun size={32} className={`mb-3 ${formData.themeMode === 'light' ? 'text-primary-600' : 'text-slate-400'}`} />
                                        <span className={`font-medium ${formData.themeMode === 'light' ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>Light Mode</span>
                                    </button>
                                    <button 
                                        onClick={() => { handleChange('themeMode', 'dark'); updateSettings({themeMode: 'dark'}); }}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${formData.themeMode === 'dark' ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                                    >
                                        <Moon size={32} className={`mb-3 ${formData.themeMode === 'dark' ? 'text-primary-600' : 'text-slate-400'}`} />
                                        <span className={`font-medium ${formData.themeMode === 'dark' ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>Dark Mode</span>
                                    </button>
                                </div>
                            </div>

                            {/* Accent Color */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Accent Color</h4>
                                <div className="flex flex-wrap gap-4">
                                    {colors.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => { handleChange('accentColor', c.id); updateSettings({accentColor: c.id}); }}
                                            className={`h-12 w-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-${c.id}-500`}
                                            style={{ backgroundColor: c.color }}
                                        >
                                            {formData.accentColor === c.id && <Check className="text-white" size={20} />}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Choose a primary color for buttons, links, and highlights.</p>
                            </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'PROFILE' && (
                    <Card title="Business Information">
                        <div className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 bg-slate-100 dark:bg-slate-700 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                                    <Upload className="text-slate-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-900 dark:text-white">Shop Logo</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Recommended 500x500px</p>
                                    <Button size="sm" variant="secondary" className="mt-2">Upload New</Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Shop Name" value={formData.shopName} onChange={e => handleChange('shopName', e.target.value)} />
                                <Input label="Email" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                                <Input label="Phone" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
                                <Input label="Website" defaultValue="www.lumina.com" />
                                <Input label="Address" className="col-span-2" value={formData.address} onChange={e => handleChange('address', e.target.value)} />
                                <Input label="Tax ID / VAT" />
                            </div>
                            <div className="flex justify-end">
                                <Button icon={<Save size={16} />} onClick={handleSave}>Save Changes</Button>
                            </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'SYSTEM' && (
                    <Card title="System Configuration">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <Select 
                                    label="Currency Symbol" 
                                    options={[{value: '$', label: 'USD ($)'}, {value: '€', label: 'EUR (€)'}, {value: '£', label: 'GBP (£)'}]} 
                                    value={formData.currencySymbol}
                                    onChange={e => handleChange('currencySymbol', e.target.value)}
                                />
                                <Select label="Timezone" options={[{value: 'utc', label: 'UTC'}, {value: 'est', label: 'EST'}]} />
                                <Select label="Date Format" options={[{value: 'ymd', label: 'YYYY-MM-DD'}, {value: 'dmy', label: 'DD-MM-YYYY'}]} />
                                <Input 
                                    label="Default Tax Rate (%)" 
                                    type="number" 
                                    value={formData.taxRate}
                                    onChange={e => handleChange('taxRate', Number(e.target.value))} 
                                />
                            </div>
                            
                            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                                <h4 className="font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Printer size={18} /> Printer Settings</h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <Select label="Receipt Format" options={[{value: '80mm', label: 'Thermal 80mm'}, {value: '58mm', label: 'Thermal 58mm'}, {value: 'a4', label: 'A4 Invoice'}]} />
                                    <div className="flex items-center pt-6">
                                        <label className="flex items-center space-x-2">
                                            <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" defaultChecked />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">Auto-print after sale</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button icon={<Save size={16} />} onClick={handleSave}>Update Preferences</Button>
                            </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'QR' && (
                    <Card>
                        <div className="text-center py-10">
                            <div className="bg-white p-4 inline-block rounded-xl border-4 border-slate-900 mb-4">
                                <QrCode size={128} className="text-slate-900" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Scan to Pay</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">Show this QR code to customers for easy payment.</p>
                            <div className="flex justify-center gap-3">
                                <Button variant="secondary">Download PNG</Button>
                                <Button variant="secondary">Print QR</Button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};
