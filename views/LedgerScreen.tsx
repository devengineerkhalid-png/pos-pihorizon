import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Card, Table, Select, Button, Input, Badge } from '../components/UIComponents';
import { Download, Filter, BookOpen } from 'lucide-react';
import { LedgerEntry } from '../types';

export const LedgerScreen: React.FC = () => {
    const { ledger, suppliers, settings } = useStore();
    const [filterAccount, setFilterAccount] = useState('all');
    const [search, setSearch] = useState('');

    const accounts = [
        { value: 'all', label: 'All Accounts' },
        { value: 'CASH', label: 'Cash / Bank' },
        { value: 'SALES', label: 'General Sales' },
        { value: 'EXPENSE', label: 'Expenses' },
        ...suppliers.map(s => ({ value: s.id, label: `Supplier: ${s.businessName}` }))
    ];

    const filteredLedger = ledger.filter(entry => {
        const matchesAccount = filterAccount === 'all' || entry.accountId === filterAccount;
        const matchesSearch = 
            entry.description.toLowerCase().includes(search.toLowerCase()) || 
            entry.accountName.toLowerCase().includes(search.toLowerCase());
        return matchesAccount && matchesSearch;
    });

    // Calculate dynamic balance for the filtered view (simple running balance visualization)
    let runningBalance = 0;
    const ledgerWithBalance = [...filteredLedger].reverse().map(entry => {
        // Simplified Logic: Credit increases liability/income, Debit increases asset/expense
        // For a general view, we might just track cash flow or supplier balance.
        // Here we just display amounts. 
        return entry;
    }).reverse();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-lg text-white">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">General Ledger</h1>
                        <p className="text-sm text-slate-500">Financial transaction history and journals.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" icon={<Download size={16} />}>Export CSV</Button>
                </div>
            </div>

            <Card className="p-4 bg-slate-50/50">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <Select 
                            label="Filter by Account" 
                            options={accounts} 
                            value={filterAccount}
                            onChange={(e) => setFilterAccount(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                         <Input 
                            label="Search Descriptions" 
                            placeholder="e.g. Invoice #1001" 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                         />
                    </div>
                    <Button variant="secondary" icon={<Filter size={16} />}>Apply</Button>
                </div>
            </Card>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table 
                    columns={[
                        { header: 'Date', accessor: 'date' },
                        { header: 'Account', accessor: (l: LedgerEntry) => <span className="font-medium text-slate-700">{l.accountName}</span> },
                        { header: 'Description', accessor: 'description' },
                        { header: 'Type', accessor: (l: LedgerEntry) => <Badge variant={l.type === 'CREDIT' ? 'success' : 'neutral'}>{l.type}</Badge> },
                        { header: 'Category', accessor: (l: LedgerEntry) => <span className="text-xs uppercase font-bold text-slate-500">{l.category}</span> },
                        { header: 'Amount', accessor: (l: LedgerEntry) => (
                            <span className={`font-mono font-bold ${l.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                {l.type === 'DEBIT' ? '-' : '+'}{settings.currencySymbol}{l.amount.toFixed(2)}
                            </span>
                        )}
                    ]}
                    data={ledgerWithBalance}
                />
            </div>
        </div>
    );
};
