
import React, { useState, useMemo } from 'react';
import { Card, Button, Modal, Input, Badge } from '../components/UIComponents';
import { 
  DollarSign, Users, Package, TrendingUp, TrendingDown, 
  ShoppingCart, Activity, ArrowUpRight, ArrowDownRight,
  Clock, Calendar, ChevronRight, Wallet, Lock, Unlock,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useStore } from '../context/StoreContext';
import { format } from 'date-fns'; // Assuming date-fns might be used, but using native JS for now to avoid deps

// --- Professional Metric Card ---
const MetricCard: React.FC<{ 
    title: string; 
    value: string; 
    subValue?: string;
    trend?: number; 
    icon: React.ReactNode;
    // Color prop kept for compatibility but ignored/remapped for professional look
    color?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue'; 
}> = ({ title, value, subValue, trend, icon }) => {
    
    // Professional Minimalist Style: 
    // Uniform icon background (Slate-100) and Text (Slate-900)
    // Trend colors preserved for semantic meaning (Red/Green)
    
    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">{value}</h3>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                    {icon}
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
                {trend !== undefined && (
                    <div className={`flex items-center text-xs font-medium ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {trend >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                        {Math.abs(trend)}%
                    </div>
                )}
                {subValue && (
                    <span className="text-xs text-slate-400">{subValue}</span>
                )}
            </div>
        </div>
    );
};

export const Dashboard: React.FC = () => {
  const { registerSession, openRegister, closeRegister, settings, invoices, customers, products } = useStore();
  const [showRegModal, setShowRegModal] = useState(false);
  const [regAmount, setRegAmount] = useState('');

  // --- Real-time Stats Calculation ---
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Today's Revenue & Count
    const todaysInvoices = invoices.filter(inv => inv.date.startsWith(today) && inv.status !== 'Returned');
    const todayRevenue = todaysInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const todayCount = todaysInvoices.length;

    // 2. Average Order Value
    const totalRevenue = invoices.reduce((sum, inv) => inv.status !== 'Returned' ? sum + inv.total : sum, 0);
    const totalCount = invoices.filter(inv => inv.status !== 'Returned').length;
    const aov = totalCount > 0 ? totalRevenue / totalCount : 0;

    // 3. Low Stock Items
    const lowStockCount = products.filter(p => p.stock < 10).length;

    return { todayRevenue, todayCount, aov, lowStockCount, todaysInvoices };
  }, [invoices, products]);

  // Mock Chart Data (In a real app, map 'invoices' to dates)
  const chartData = [
    { name: '09:00', sales: 120 },
    { name: '11:00', sales: 450 },
    { name: '13:00', sales: 980 },
    { name: '15:00', sales: 620 },
    { name: '17:00', sales: 1100 },
    { name: '19:00', sales: 850 },
    { name: '21:00', sales: 340 },
  ];

  const handleRegisterAction = () => {
      if(!regAmount) return;
      if (registerSession && registerSession.status === 'OPEN') {
          closeRegister(Number(regAmount));
      } else {
          openRegister(Number(regAmount));
      }
      setShowRegModal(false);
      setRegAmount('');
  };

  const isOpen = registerSession?.status === 'OPEN';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
        </div>
        
        {/* Register Status Bar */}
        <div className={`flex items-center gap-4 px-4 py-2 rounded-lg border shadow-sm transition-all ${isOpen ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
            <div className={`flex items-center gap-2 ${isOpen ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {isOpen ? <Unlock size={16} /> : <Lock size={16} />}
                <span className="font-medium text-sm">{isOpen ? 'Register Open' : 'Register Closed'}</span>
            </div>
            {isOpen && (
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            )}
            {isOpen && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">{settings.currencySymbol}{registerSession.expectedBalance.toFixed(2)}</span> exp.
                </div>
            )}
            <Button 
                size="sm" 
                variant={isOpen ? "secondary" : "primary"} 
                onClick={() => setShowRegModal(true)}
                className="ml-2 h-8 text-xs px-3"
            >
                {isOpen ? 'Close' : 'Open'}
            </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
            title="Revenue" 
            value={`${settings.currencySymbol}${stats.todayRevenue.toFixed(2)}`} 
            trend={12.5} 
            icon={<DollarSign size={20} />} 
        />
        <MetricCard 
            title="Transactions" 
            value={stats.todayCount.toString()} 
            subValue={`${settings.currencySymbol}${stats.aov.toFixed(2)} Avg`}
            icon={<ShoppingCart size={20} />} 
        />
        <MetricCard 
            title="Customers" 
            value={customers.length.toString()} 
            trend={5.2} 
            icon={<Users size={20} />} 
        />
        <MetricCard 
            title="Low Stock" 
            value={stats.lowStockCount.toString()} 
            subValue="Items"
            icon={<AlertCircle size={20} />} 
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Charts & Analysis (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
            <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Sales Overview</h3>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-1">
                        <button className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-700 shadow-sm rounded text-slate-900 dark:text-white">Today</button>
                        <button className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900">Week</button>
                    </div>
                </div>
                <div className="h-80 w-full bg-white dark:bg-slate-900 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                                cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}}
                            />
                            <Area type="monotone" dataKey="sales" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>

        {/* Right Column: Recent Activity & Quick Actions (1/3 width) */}
        <div className="space-y-6">
            <Card title="Recent Sales" className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stats.todaysInvoices.length === 0 ? (
                         <div className="p-8 text-center text-slate-400 text-sm">No sales today.</div>
                    ) : (
                        stats.todaysInvoices.slice(0, 5).reverse().map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between py-3 px-1">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                        <Wallet size={14} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[100px]">{inv.customerName}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">#{inv.id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{settings.currencySymbol}{inv.total.toFixed(2)}</p>
                                    <p className="text-[10px] text-slate-400">{inv.paymentMethod}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="pt-2">
                    <button className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1 transition-colors">
                        All Transactions <ChevronRight size={12} />
                    </button>
                </div>
            </Card>

            <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-5 text-white shadow-lg">
                <h3 className="font-semibold text-base mb-1">Actions</h3>
                <p className="text-slate-400 text-xs mb-4">Quick access tasks.</p>
                <div className="grid grid-cols-2 gap-3">
                    <button className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-md transition-colors border border-white/10">
                        <Package size={18} className="mb-2 text-slate-300" />
                        <span className="text-[10px] font-medium tracking-wide">ADD ITEM</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-md transition-colors border border-white/10">
                        <Users size={18} className="mb-2 text-slate-300" />
                        <span className="text-[10px] font-medium tracking-wide">ADD CUSTOMER</span>
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Register Modal */}
      <Modal isOpen={showRegModal} onClose={() => setShowRegModal(false)} title={isOpen ? 'Close Register Session' : 'Open New Register Session'}>
            <div className="space-y-6">
                <div className={`p-4 rounded-lg border flex gap-4 ${isOpen ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="mt-1 text-slate-600">
                        {isOpen ? <Lock size={20} /> : <Unlock size={20} />}
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900">
                            {isOpen ? 'End Shift' : 'Start Shift'}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">
                            {isOpen 
                                ? 'Count cash in drawer and close.' 
                                : 'Enter opening float amount.'}
                        </p>
                    </div>
                </div>
                
                <Input 
                    label={isOpen ? 'Ending Cash Count' : 'Opening Float'} 
                    type="number" 
                    value={regAmount} 
                    onChange={e => setRegAmount(e.target.value)} 
                    placeholder="0.00"
                    className="text-lg font-bold"
                />

                {isOpen && (
                    <div className="bg-slate-50 p-3 rounded text-sm flex justify-between items-center border border-slate-100">
                         <span className="text-slate-500">System Expected:</span>
                         <span className="font-bold font-mono text-slate-900">{settings.currencySymbol}{registerSession?.expectedBalance.toFixed(2)}</span>
                    </div>
                )}

                <div className="flex justify-end pt-2 gap-2">
                    <Button variant="secondary" onClick={() => setShowRegModal(false)}>Cancel</Button>
                    <Button onClick={handleRegisterAction} variant="primary">
                        {isOpen ? 'Close Shift' : 'Open Register'}
                    </Button>
                </div>
            </div>
      </Modal>
    </div>
  );
};
