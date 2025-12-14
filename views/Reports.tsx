import React, { useState, useMemo } from 'react';
import { Card, Button, Select, Input, Table, Badge } from '../components/UIComponents';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../context/StoreContext';

export const Reports: React.FC = () => {
    const { invoices, expenses, settings } = useStore();
    const [reportType, setReportType] = useState('SALES');
    
    // --- Dynamic Data Calculation ---
    const stats = useMemo(() => {
        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        // Estimate Product Cost (Mock: assume 60% of revenue is cost for simplicity since items are complex)
        const productCosts = totalRevenue * 0.6; 
        const totalCosts = totalExpenses + productCosts;
        const netProfit = totalRevenue - totalCosts;
        
        return { totalRevenue, totalExpenses, netProfit, transactionCount: invoices.length };
    }, [invoices, expenses]);

    // Group Invoices by Date for Chart
    const chartData = useMemo(() => {
        const grouped: Record<string, {sales: number, profit: number}> = {};
        
        invoices.forEach(inv => {
            const date = new Date(inv.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            if (!grouped[date]) grouped[date] = { sales: 0, profit: 0 };
            grouped[date].sales += inv.total;
            grouped[date].profit += (inv.total * 0.4); // Mock 40% profit margin
        });

        // Fill in last 7 days if empty (optional, keeping it simple to just existing data)
        return Object.keys(grouped).map(key => ({
            name: key,
            sales: grouped[key].sales,
            profit: grouped[key].profit
        })).slice(-7); // Last 7 entries
    }, [invoices]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Reports Center</h1>
                <div className="flex gap-2">
                    <Button variant="secondary" icon={<Download size={16} />}>PDF</Button>
                    <Button variant="secondary" icon={<Download size={16} />}>Excel</Button>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
                {['SALES', 'STOCK', 'PURCHASE', 'EXPENSE'].map(type => (
                    <button 
                        key={type}
                        onClick={() => setReportType(type)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${reportType === type ? 'bg-white border-x border-t border-slate-200 text-primary-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        {type.charAt(0) + type.slice(1).toLowerCase()} Report
                    </button>
                ))}
            </div>

            {/* Filter Bar */}
            <Card className="p-4 flex flex-wrap gap-4 items-end bg-slate-50/50">
                <div className="w-48">
                    <Input label="Start Date" type="date" />
                </div>
                <div className="w-48">
                    <Input label="End Date" type="date" />
                </div>
                <div className="w-48">
                    <Select label="Filter By" options={[{value: 'all', label: 'All'}, {value: 'cat', label: 'Category'}]} />
                </div>
                <Button className="mb-[2px]">Generate</Button>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title={`${reportType.charAt(0) + reportType.slice(1).toLowerCase()} Analysis`} className="lg:col-span-2">
                     <div className="h-80">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} name="Sales" />
                                    <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Est. Profit" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                No data available for this period.
                            </div>
                        )}
                    </div>
                </Card>
                <Card title="Summary">
                    <div className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500">Total Revenue</span>
                            <span className="font-bold text-slate-900">{settings.currencySymbol}{stats.totalRevenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500">Total Expenses</span>
                            <span className="font-bold text-rose-600">{settings.currencySymbol}{stats.totalExpenses.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500">Net Profit (Est)</span>
                            <span className={`font-bold ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{settings.currencySymbol}{stats.netProfit.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between pt-2">
                            <span className="text-slate-500">Transactions</span>
                            <span className="font-bold text-slate-900">{stats.transactionCount}</span>
                        </div>
                    </div>
                </Card>
            </div>

            <Card title="Recent Transactions">
                <Table 
                    columns={[
                        { header: 'Date', accessor: 'date' }, 
                        { header: 'Invoice #', accessor: 'id' },
                        { header: 'Customer', accessor: 'customerName' },
                        { header: 'Amount', accessor: (i: any) => `${settings.currencySymbol}${i.total.toFixed(2)}` },
                        { header: 'Status', accessor: (i: any) => <Badge variant="success">{i.status}</Badge> }
                    ]}
                    data={invoices.slice(-5).reverse()} // Show last 5
                />
            </Card>
        </div>
    );
};