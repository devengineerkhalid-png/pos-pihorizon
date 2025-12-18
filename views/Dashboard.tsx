
import React, { useState, useMemo } from 'react';
import { Card, Button, Modal, Input, Badge } from '../components/UIComponents';
import { 
  DollarSign, Users, Package, ShoppingCart, Lock, Unlock,
  Calendar, Clock, UserCheck, History, AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useStore } from '../context/StoreContext';

const CHART_COLORS: Record<string, string> = {
    blue: '#2563eb', indigo: '#4f46e5', emerald: '#10b981', rose: '#e11d48', amber: '#d97706', violet: '#7c3aed'
};

const MetricCard: React.FC<{ title: string; value: string; trend?: number; icon: React.ReactNode; color?: string }> = ({ title, value, trend, icon, color = "primary" }) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
                {trend !== undefined && (
                    <p className={`text-xs font-bold mt-2 ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend >= 0 ? '+' : ''}{trend}% vs last month
                    </p>
                )}
            </div>
            <div className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}>
                {icon}
            </div>
        </div>
    </div>
);

export const Dashboard: React.FC = () => {
  const { registerSession, openRegister, closeRegister, settings, invoices, customers, products, currentUser } = useStore();
  const [showRegModal, setShowRegModal] = useState(false);
  const [regAmount, setRegAmount] = useState('');

  const chartHex = CHART_COLORS[settings.accentColor] || CHART_COLORS['blue'];

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysInvoices = invoices.filter(inv => inv.date.startsWith(today));
    const revenue = todaysInvoices.reduce((sum, i) => sum + i.total, 0);
    const lowStock = products.filter(p => p.stock <= (p.minStockLevel || 10)).length;
    return { revenue, txCount: todaysInvoices.length, lowStock };
  }, [invoices, products]);

  const chartData = [
    { name: 'Mon', sales: 2400 }, { name: 'Tue', sales: 1398 }, { name: 'Wed', sales: 9800 },
    { name: 'Thu', sales: 3908 }, { name: 'Fri', sales: 4800 }, { name: 'Sat', sales: 3800 }, { name: 'Sun', sales: 4300 },
  ];

  const isOpen = registerSession?.status === 'OPEN';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Overview</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2 mt-1">
                <Calendar size={14} /> {new Date().toLocaleDateString()}
            </p>
        </div>
        <div className={`flex items-center gap-4 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900`}>
            <div className={`flex items-center gap-2 text-sm font-bold ${isOpen ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isOpen ? <Unlock size={18} /> : <Lock size={18} />} {isOpen ? 'Register Active' : 'Shift Closed'}
            </div>
            <Button size="sm" onClick={() => setShowRegModal(true)}>{isOpen ? 'Close Shift' : 'Start Shift'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Daily Revenue" value={`${settings.currencySymbol}${stats.revenue.toFixed(2)}`} trend={14} icon={<DollarSign size={22} />} />
        <MetricCard title="Transactions" value={stats.txCount.toString()} trend={8} icon={<ShoppingCart size={22} />} />
        <MetricCard title="Customers" value={customers.length.toString()} trend={5} icon={<Users size={22} />} />
        <MetricCard title="Low Stock Items" value={stats.lowStock.toString()} icon={<AlertCircle size={22} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Revenue Trends" className="lg:col-span-2 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartHex} stopOpacity={0.1}/>
                            <stop offset="95%" stopColor={chartHex} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="sales" stroke={chartHex} strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
            </ResponsiveContainer>
        </Card>

        <Card title="Shift Log" icon={<UserCheck size={18} />}>
            <div className="space-y-4">
                {registerSession ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                             <Badge variant={isOpen ? 'success' : 'neutral'}>{registerSession.status}</Badge>
                             <span className="text-[10px] text-slate-400 font-bold">{new Date(registerSession.openedAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm font-bold">{registerSession.openedBy || 'Unknown Staff'}</p>
                        <div className="flex justify-between text-xs text-slate-500 mt-2">
                            <span>Open Float</span>
                            <span>{settings.currencySymbol}{registerSession.openingBalance.toFixed(2)}</span>
                        </div>
                        {isOpen && (
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>Exp. Cash</span>
                                <span>{settings.currencySymbol}{registerSession.expectedBalance.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-10 text-center text-slate-400 text-sm">No shifts logged recently.</div>
                )}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button className="w-full py-2 text-xs font-bold text-slate-400 hover:text-primary-600 uppercase tracking-widest flex items-center justify-center gap-2">
                        <History size={14} /> View Shift History
                    </button>
                </div>
            </div>
        </Card>
      </div>

      <Modal isOpen={showRegModal} onClose={() => setShowRegModal(false)} title={isOpen ? 'Close Cash Shift' : 'Open Cash Shift'}>
            <div className="space-y-4">
                <Input label={isOpen ? "Final Cash Count" : "Starting Float"} type="number" value={regAmount} onChange={e => setRegAmount(e.target.value)} placeholder="0.00" autoFocus />
                {isOpen && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-xs text-slate-500 uppercase font-bold">System Expected</p>
                        <h4 className="text-2xl font-bold">{settings.currencySymbol}{registerSession?.expectedBalance.toFixed(2)}</h4>
                    </div>
                )}
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onClick={() => setShowRegModal(false)}>Cancel</Button>
                    <Button onClick={() => { if(isOpen) closeRegister(Number(regAmount)); else openRegister(Number(regAmount)); setShowRegModal(false); setRegAmount(''); }}>Confirm</Button>
                </div>
            </div>
      </Modal>
    </div>
  );
};
