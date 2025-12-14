
import React, { useState } from 'react';
import { View } from '../types';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Settings, 
  FileText, LogOut, Bell, Menu, Tags, Truck, CreditCard, PieChart,
  Wallet, Shield, ChevronLeft, ChevronRight, Search, BookOpen
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface LayoutProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, onLogout, children }) => {
  const { currentUser, roles } = useStore();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Get permissions for current user
  const userRole = roles.find(r => r.name === currentUser?.role);
  const permissions = userRole?.permissions || [];
  const hasPermission = (view: string) => {
      if (permissions.includes('ALL')) return true;
      return permissions.includes(view);
  };

  // Grouping navigation items for better UI
  const navGroups = [
    {
      title: 'Overview',
      items: [
        { view: View.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={18} />, req: 'DASHBOARD' },
        { view: View.POS, label: 'POS Terminal', icon: <CreditCard size={18} />, req: 'POS' },
      ]
    },
    {
      title: 'Inventory & Stock',
      items: [
        { view: View.PRODUCTS, label: 'Products', icon: <Package size={18} />, req: 'PRODUCTS' },
        { view: View.SUPPLIERS, label: 'Suppliers', icon: <Truck size={18} />, req: 'SUPPLIERS' },
        { view: View.PURCHASES, label: 'Purchases', icon: <Tags size={18} />, req: 'PURCHASES' },
      ]
    },
    {
      title: 'Finance',
      items: [
        { view: View.INVOICES, label: 'Invoices', icon: <FileText size={18} />, req: 'INVOICES' },
        { view: View.EXPENSES, label: 'Expenses', icon: <Wallet size={18} />, req: 'EXPENSES' },
        { view: View.LEDGER, label: 'General Ledger', icon: <BookOpen size={18} />, req: 'LEDGER' },
      ]
    },
    {
      title: 'Management',
      items: [
        { view: View.CUSTOMERS, label: 'Customers', icon: <Users size={18} />, req: 'CUSTOMERS' },
        { view: View.USERS, label: 'Users', icon: <Users size={18} />, req: 'USERS' },
        { view: View.ROLES, label: 'Roles', icon: <Shield size={18} />, req: 'ROLES' },
      ]
    },
    {
      title: 'System',
      items: [
        { view: View.REPORTS, label: 'Reports', icon: <PieChart size={18} />, req: 'REPORTS' },
        { view: View.SETTINGS, label: 'Settings', icon: <Settings size={18} />, req: 'SETTINGS' },
      ]
    }
  ];

  // Flatten for header usage lookup
  const flatNavItems = navGroups.flatMap(g => g.items);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans transition-colors duration-200">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-16'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 z-30 relative`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 dark:border-slate-800 mb-2">
           <div className={`flex items-center gap-3 w-full ${!isSidebarOpen && 'justify-center'}`}>
              <div className="h-8 w-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-slate-900 font-bold shadow-sm">
                P
              </div>
              {isSidebarOpen && (
                 <span className="font-bold text-slate-800 dark:text-white tracking-tight text-base">POS <span className="text-slate-400 font-normal">System</span></span>
              )}
           </div>
        </div>

        {/* Scrollable Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6 no-scrollbar">
            {navGroups.map((group, idx) => {
                const visibleItems = group.items.filter(item => hasPermission(item.req || ''));
                if (visibleItems.length === 0) return null;

                return (
                    <div key={idx}>
                        {isSidebarOpen && group.title && (
                            <h3 className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                                {group.title}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {visibleItems.map(item => {
                                const isActive = currentView === item.view;
                                return (
                                    <button
                                        key={item.view}
                                        onClick={() => onNavigate(item.view)}
                                        className={`
                                            w-full flex items-center py-2 px-3 rounded-lg transition-all duration-200 group relative
                                            ${isActive 
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium' 
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                                            }
                                            ${!isSidebarOpen ? 'justify-center px-0' : ''}
                                        `}
                                        title={!isSidebarOpen ? item.label : ''}
                                    >
                                        <span className={`transition-colors duration-200 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                                            {item.icon}
                                        </span>
                                        
                                        {isSidebarOpen && (
                                            <span className="ml-3 text-sm truncate">{item.label}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* User / Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            {isSidebarOpen ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 text-xs font-bold">
                             {currentUser?.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-none">{currentUser?.name}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{currentUser?.role}</span>
                        </div>
                    </div>
                    <button 
                        onClick={onLogout}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Sign Out"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            ) : (
                 <button 
                    onClick={onLogout}
                    className="w-full flex justify-center p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                    title="Sign Out"
                >
                    <LogOut size={18} />
                </button>
            )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setSidebarOpen(!isSidebarOpen)} 
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                >
                    {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                    {flatNavItems.find(n => n.view === currentView)?.label}
                </h2>
            </div>
            
            <div className="flex items-center gap-4">
                 {/* Search Global */}
                 <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600 focus:bg-white dark:focus:bg-slate-700 transition-all w-64 text-slate-700 dark:text-slate-200 placeholder-slate-400"
                    />
                 </div>

                <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
                    >
                        <Bell size={18} />
                        <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-slate-900 dark:bg-white rounded-full"></span>
                    </button>
                     {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</h3>
                                <button className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">Clear</button>
                            </div>
                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                <div className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 cursor-pointer">
                                    <div className="flex gap-3">
                                        <div className="mt-1 h-1.5 w-1.5 bg-slate-400 rounded-full shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Low Stock Alert</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Nike Air Max is below 5 units.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 overflow-auto p-6 scroll-smooth custom-scrollbar">
            <div className="max-w-6xl mx-auto h-full">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
};
