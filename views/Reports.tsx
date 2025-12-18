
import React, { useState, useMemo } from 'react';
import { Card, Button, Select, Input, Table, Badge } from '../components/UIComponents';
import { Download, Search, Package, ArrowUpRight, ArrowDownRight, History, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../context/StoreContext';

export const Reports: React.FC = () => {
    const { invoices, expenses, settings, purchases, stockAdjustments, products } = useStore();
    const [reportType, setReportType] = useState('SALES');
    
    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [stockSearch, setStockSearch] = useState('');

    // --- Dynamic Data Calculation ---
    const stats = useMemo(() => {
        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const productCosts = totalRevenue * 0.6; 
        const totalCosts = totalExpenses + productCosts;
        const netProfit = totalRevenue - totalCosts;
        
        return { totalRevenue, totalExpenses, netProfit, transactionCount: invoices.length };
    }, [invoices, expenses]);

    // --- Stock Ledger Aggregation ---
    const stockLedgerData = useMemo(() => {
        const movements: any[] = [];

        // 1. Sales (Out)
        invoices.forEach(inv => {
            inv.items?.forEach(item => {
                movements.push({
                    date: inv.date,
                    productId: item.id,
                    productName: item.name,
                    type: 'OUT',
                    action: 'Sale',
                    quantity: item.quantity,
                    reference: inv.id
                });
            });

            // Sales Returns (In)
            inv.returns?.forEach(ret => {
                ret.items.forEach(item => {
                    movements.push({
                        date: ret.date.split('T')[0],
                        productId: item.productId,
                        productName: item.productName,
                        type: 'IN',
                        action: 'Sales Return',
                        quantity: item.quantity,
                        reference: inv.id
                    });
                });
            });
        });

        // 2. Purchases (In)
        purchases.forEach(pur => {
            pur.receivedHistory?.forEach(history => {
                history.items.forEach(item => {
                    movements.push({
                        date: history.date.split('T')[0],
                        productId: item.productId,
                        productName: item.productName,
                        type: 'IN',
                        action: 'Purchase',
                        quantity: item.quantity,
                        reference: pur.invoiceNumber
                    });
                });
            });

            // Purchase Returns (Out)
            pur.returnHistory?.forEach(ret => {
                ret.items.forEach(item => {
                    movements.push({
                        date: ret.date.split('T')[0],
                        productId: item.productId,
                        productName: item.productName,
                        type: 'OUT',
                        action: 'Purchase Return',
                        quantity: item.quantity,
                        reference: pur.invoiceNumber
                    });
                });
            });
        });

        // 3. Adjustments
        stockAdjustments.forEach(adj => {
            movements.push({
                date: adj.date.split('T')[0],
                productId: adj.productId,
                productName: adj.productName,
                type: adj.quantity > 0 ? 'IN' : 'OUT',
                action: `Adjustment (${adj.reason})`,
                quantity: Math.abs(adj.quantity),
                reference: 'Internal'
            });
        });

        // Sort and Filter
        return movements
            .filter(m => {
                const matchesSearch = m.productName.toLowerCase().includes(stockSearch.toLowerCase()) || m.reference.toLowerCase().includes(stockSearch.toLowerCase());
                const matchesStart = !startDate || m.date >= startDate;
                const matchesEnd = !endDate || m.date <= endDate;
                return matchesSearch && matchesStart && matchesEnd;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices, purchases, stockAdjustments, stockSearch, startDate, endDate]);

    const stockStats = useMemo(() => {
        const totalIn = stockLedgerData.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.quantity, 0);
        const totalOut = stockLedgerData.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.quantity, 0);
        return { totalIn, totalOut, net: totalIn - totalOut };
    }, [stockLedgerData]);

    // Group Invoices by Date for Chart
    const chartData = useMemo(() => {
        const grouped: Record<string, {sales: number, profit: number}> = {};
        invoices.forEach(inv => {
            const date = new Date(inv.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            if (!grouped[date]) grouped[date] = { sales: 0, profit: 0 };
            grouped[date].sales += inv.total;
            grouped[date].profit += (inv.total * 0.4); 
        });
        return Object.keys(grouped).map(key => ({
            name: key,
            sales: grouped[key].sales,
            profit: grouped[key].profit
        })).slice(-7); 
    }, [invoices]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports Center</h1>
                <div className="flex gap-2">
                    <Button variant="secondary" icon={<Download size={16} />}>Export CSV</Button>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
                {['SALES', 'STOCK_LEDGER', 'PURCHASE', 'EXPENSE'].map(type => (
                    <button 
                        key={type}
                        onClick={() => setReportType(type)}
                        className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${reportType === type ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        {type.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Filter Bar */}
            <Card className="p-4 flex flex-wrap gap-4 items-end bg-slate-50/50">
                <div className="w-48">
                    <Input label="From Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="w-48">
                    <Input label="To Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                {reportType === 'STOCK_LEDGER' && (
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-9 h-4 w-4 text-slate-400" />
                            <Input label="Search Product / Ref" className="pl-9" value={stockSearch} onChange={e => setStockSearch(e.target.value)} />
                        </div>
                    </div>
                )}
                <Button variant="secondary" onClick={() => { setStartDate(''); setEndDate(''); setStockSearch(''); }}>Clear Filters</Button>
            </Card>

            {reportType === 'STOCK_LEDGER' ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-emerald-50 border-emerald-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Stock Incoming</p>
                                    <h3 className="text-2xl font-bold text-emerald-700">+{stockStats.totalIn} Units</h3>
                                </div>
                                <ArrowUpRight className="text-emerald-500" size={24} />
                            </div>
                        </Card>
                        <Card className="bg-rose-50 border-rose-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Stock Outgoing</p>
                                    <h3 className="text-2xl font-bold text-rose-700">-{stockStats.totalOut} Units</h3>
                                </div>
                                <ArrowDownRight className="text-rose-500" size={24} />
                            </div>
                        </Card>
                        <Card className="bg-primary-50 border-primary-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Net Change</p>
                                    <h3 className="text-2xl font-bold text-primary-700">{stockStats.net > 0 ? '+' : ''}{stockStats.net} Units</h3>
                                </div>
                                <History className="text-primary-500" size={24} />
                            </div>
                        </Card>
                    </div>

                    <Card title="Inventory Audit Trail" icon={<Package size={18}/>}>
                        <Table 
                            columns={[
                                { header: 'Date', accessor: (m: any) => <span className="text-xs font-medium text-slate-600">{m.date}</span> },
                                { header: 'Product Name', accessor: 'productName' },
                                { header: 'Action', accessor: (m: any) => {
                                    const variants: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
                                        'Sale': 'neutral',
                                        'Purchase': 'success',
                                        'Sales Return': 'success',
                                        'Purchase Return': 'danger',
                                        'Adjustment': 'warning'
                                    };
                                    const actionKey = m.action.split(' ')[0];
                                    return <Badge variant={variants[m.action] || variants[actionKey] || 'neutral'}>{m.action}</Badge>;
                                }},
                                { header: 'Ref / Invoice', accessor: (m: any) => <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded">{m.reference}</span> },
                                { header: 'Change', accessor: (m: any) => (
                                    <span className={`font-bold font-mono ${m.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {m.type === 'IN' ? '+' : '-'}{m.quantity}
                                    </span>
                                )}
                            ]}
                            data={stockLedgerData}
                        />
                        {stockLedgerData.length === 0 && (
                            <div className="py-20 text-center text-slate-400">
                                <Package className="mx-auto mb-2 opacity-20" size={48} />
                                <p>No stock movements found for this criteria.</p>
                            </div>
                        )}
                    </Card>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card title={`${reportType.charAt(0) + reportType.slice(1).toLowerCase()} Analysis`} className="lg:col-span-2">
                            <div className="h-80">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                            <Bar dataKey="sales" fill="var(--color-primary-600)" radius={[4, 4, 0, 0]} name="Sales" />
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
                        <Card title="Financial Summary">
                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500 text-sm">Total Revenue</span>
                                    <span className="font-bold text-slate-900">{settings.currencySymbol}{stats.totalRevenue.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500 text-sm">Total Expenses</span>
                                    <span className="font-bold text-rose-600">{settings.currencySymbol}{stats.totalExpenses.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500 text-sm">Net Profit (Est)</span>
                                    <span className={`font-bold ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{settings.currencySymbol}{stats.netProfit.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="text-slate-500 text-sm">Transactions</span>
                                    <span className="font-bold text-slate-900">{stats.transactionCount}</span>
                                </div>
                            </div>
                            <div className="mt-8 p-4 bg-primary-50 rounded-xl border border-primary-100 text-center">
                                <p className="text-xs text-primary-600 font-bold uppercase tracking-widest mb-1">Performance</p>
                                <p className="text-sm text-primary-800">Your average order value is <strong>{settings.currencySymbol}{(stats.totalRevenue / (stats.transactionCount || 1)).toFixed(2)}</strong></p>
                            </div>
                        </Card>
                    </div>

                    <Card title="Recent Activity Trail">
                        <Table 
                            columns={[
                                { header: 'Date', accessor: 'date' }, 
                                { header: 'Invoice #', accessor: 'id' },
                                { header: 'Customer', accessor: 'customerName' },
                                { header: 'Amount', accessor: (i: any) => `${settings.currencySymbol}${i.total.toFixed(2)}` },
                                { header: 'Status', accessor: (i: any) => <Badge variant="success">{i.status}</Badge> }
                            ]}
                            data={invoices.slice(-5).reverse()} 
                        />
                    </Card>
                </>
            )}
        </div>
    );
};
