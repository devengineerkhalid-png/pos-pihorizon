
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

// Color map for charts to match StoreContext themes
const CHART_COLORS: Record<string, string> = {
    blue: '#2563eb',
    indigo: '#4f46e5',
    emerald: '#10b981',
    rose: '#e11d48',
    amber: '#d97706',
    violet: '#7c3aed'
};

// --- Professional Metric Card ---
const MetricCard: React.FC<{ 
    title: string; 
    value: string; 
    subValue?: string;
    trend?: number; 
    icon: React.ReactNode;
}> = ({ title, value, subValue, trend, icon }) => {
    
    // Enhanced: Colorful top border and hover effects
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:border-primary-100 dark:hover:border-primary-900/50 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-300 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">{value}</h3>
                </div>
                <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/50 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                    {icon}
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
                {trend !== undefined && (
                    <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${trend >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                        {trend >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                        {Math.abs(trend)}%
                    </div>
                )}
                {subValue && (
                    <span className="text-xs text-slate-400 font-medium">{subValue}</span>
                )}
            </div>
        </div>
    );
};

export const Dashboard: React.FC = () => {
  const { registerSession, openRegister, closeRegister, settings, invoices, customers, products } = useStore();
  const [showRegModal, setShowRegModal] = useState(false);
  const [regAmount, setRegAmount] = useState('');

  // Get active chart color based on settings
  const chartHex = CHART_COLORS[settings.accentColor] || CHART_COLORS['blue'];

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
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-2">
                <Calendar size={14} />
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
        </div>
        
        {/* Register Status Bar */}
        <div className={`flex items-center gap-4 px-4 py-2 rounded-xl border shadow-sm transition-all ${isOpen ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
            <div className={`flex items-center gap-2 ${isOpen ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {isOpen ? <Unlock size={18} /> : <Lock size={18} />}
                <span className="font-bold text-sm">{isOpen ? 'Register Open' : 'Register Closed'}</span>
            </div>
            {isOpen && (
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            )}
            {isOpen && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{settings.currencySymbol}{registerSession.expectedBalance.toFixed(2)}</span> exp.
                </div>
            )}
            <Button 
                size="sm" 
                variant={isOpen ? "secondary" : "primary"} 
                onClick={() => setShowRegModal(true)}
                className="ml-2 h-9 text-xs px-4"
            >
                {isOpen ? 'Close' : 'Open'}
            </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
            title="Today's Revenue" 
            value={`${settings.currencySymbol}${stats.todayRevenue.toFixed(2)}`} 
            trend={12.5} 
            icon={<DollarSign size={22} />} 
        />
        <MetricCard 
            title="Transactions" 
            value={stats.todayCount.toString()} 
            subValue={`${settings.currencySymbol}${stats.aov.toFixed(2)} Avg Order`}
            icon={<ShoppingCart size={22} />} 
        />
        <MetricCard 
            title="Total Customers" 
            value={customers.length.toString()} 
            trend={5.2} 
            icon={<Users size={22} />} 
        />
        <MetricCard 
            title="Low Stock Items" 
            value={stats.lowStockCount.toString()} 
            subValue="Action needed"
            icon={<AlertCircle size={22} />} 
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Charts & Analysis (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
            <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Sales Overview</h3>
                        <p className="text-xs text-slate-500 mt-1">Hourly sales performance</p>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button className="px-3 py-1 text-xs font-semibold bg-white dark:bg-slate-700 shadow-sm rounded-md text-slate-900 dark:text-white">Today</button>
                        <button className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900">Week</button>
                    </div>
                </div>
                <div className="h-80 w-full bg-white dark:bg-slate-900 p-4 pl-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={chartHex} stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor={chartHex} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `${settings.currencySymbol}${value}`} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                                cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}}
                            />
                            <Area type="monotone" dataKey="sales" stroke={chartHex} strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>

        {/* Right Column: Recent Activity & Quick Actions (1/3 width) */}
        <div className="space-y-6">
            <Card title="Recent Sales" className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl h-fit">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stats.todaysInvoices.length === 0 ? (
                         <div className="p-8 text-center text-slate-400 text-sm">No sales recorded today.</div>
                    ) : (
                        stats.todaysInvoices.slice(0, 5).reverse().map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 -mx-2 rounded-lg transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                        <Wallet size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[100px]">{inv.customerName}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">#{inv.id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{settings.currencySymbol}{inv.total.toFixed(2)}</p>
                                    <p className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded inline-block mt-0.5">{inv.paymentMethod}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                    <button className="w-full py-2 text-xs font-bold text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 flex items-center justify-center gap-1 transition-colors uppercase tracking-wide">
                        View All Transactions <ChevronRight size={14} />
                    </button>
                </div>
            </Card>

            {/* Quick Actions Card - Themed Gradient */}
            <div className={`rounded-xl p-6 text-white shadow-xl bg-gradient-to-br from-primary-800 to-primary-950 border border-primary-700 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                    <Package size={120} />
                </div>
                
                <h3 className="font-bold text-lg mb-1 relative z-10">Quick Actions</h3>
                <p className="text-primary-200 text-xs mb-5 relative z-10">Common management tasks</p>
                
                <div className="grid grid-cols-2 gap-3 relative z-10">
                    <button className="flex flex-col items-center justify-center p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/10 backdrop-blur-sm group">
                        <Package size={20} className="mb-2 text-primary-200 group-hover:text-white transition-colors" />
                        <span className="text-[10px] font-bold tracking-wide uppercase">Add Item</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/10 backdrop-blur-sm group">
                        <Users size={20} className="mb-2 text-primary-200 group-hover:text-white transition-colors" />
                        <span className="text-[10px] font-bold tracking-wide uppercase">Add Customer</span>
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Register Modal */}
      <Modal isOpen={showRegModal} onClose={() => setShowRegModal(false)} title={isOpen ? 'Close Register Session' : 'Open New Register Session'}>
            <div className="space-y-6">
                <div className={`p-4 rounded-xl border flex gap-4 ${isOpen ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-primary-50 border-primary-100 text-primary-900'}`}>
                    <div className="mt-1">
                        {isOpen ? <Lock size={20} className="text-amber-600" /> : <Unlock size={20} className="text-primary-600" />}
                    </div>
                    <div>
                        <h4 className="font-bold">
                            {isOpen ? 'End Shift & Close Register' : 'Start Shift & Open Register'}
                        </h4>
                        <p className="text-sm opacity-80 mt-1">
                            {isOpen 
                                ? 'Count cash in drawer. Discrepancies will be logged.' 
                                : 'Enter the opening float amount in the cash drawer.'}
                        </p>
                    </div>
                </div>
                
                <Input 
                    label={isOpen ? 'Ending Cash Count' : 'Opening Float Amount'} 
                    type="number" 
                    value={regAmount} 
                    onChange={e => setRegAmount(e.target.value)} 
                    placeholder="0.00"
                    className="text-lg font-bold font-mono"
                    autoFocus
                />

                {isOpen && (
                    <div className="bg-slate-50 p-4 rounded-xl text-sm flex justify-between items-center border border-slate-200">
                         <span className="text-slate-500 font-medium">System Expected Cash:</span>
                         <span className="font-bold font-mono text-xl text-slate-900">{settings.currencySymbol}{registerSession?.expectedBalance.toFixed(2)}</span>
                    </div>
                )}

                <div className="flex justify-end pt-4 gap-3">
                    <Button variant="secondary" onClick={() => setShowRegModal(false)}>Cancel</Button>
                    <Button onClick={handleRegisterAction} variant={isOpen ? "danger" : "primary"}>
                        {isOpen ? 'Close Shift' : 'Open Register'}
                    </Button>
                </div>
            </div>
      </Modal>
    </div>
  );
};
