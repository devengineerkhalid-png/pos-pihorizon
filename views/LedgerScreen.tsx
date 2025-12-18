
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Card, Table, Select, Button, Input, Badge } from '../components/UIComponents';
import { Download, Filter, BookOpen, Search, ExternalLink } from 'lucide-react';
import { LedgerEntry, View } from '../types';
import { generateLedgerPDF, generateInvoicePDF } from '../utils/pdfGenerator';

export const LedgerScreen: React.FC = () => {
    const { ledger, suppliers, settings, users, invoices, purchases } = useStore();
    const [filterAccount, setFilterAccount] = useState('all');
    const [filterUser, setFilterUser] = useState('all');
    const [search, setSearch] = useState('');

    const accounts = [
        { value: 'all', label: 'All Accounts' },
        { value: 'CASH', label: 'Cash / Bank' },
        { value: 'SALES', label: 'General Sales' },
        { value: 'EXPENSE', label: 'Expenses' },
        { value: 'INVENTORY', label: 'Inventory Assets' },
        ...suppliers.map(s => ({ value: s.id, label: `Vendor: ${s.businessName}` }))
    ];

    const userOptions = [
        { value: 'all', label: 'All Staff' },
        ...users.map(u => ({ value: u.id, label: u.name }))
    ];

    const filteredLedger = ledger.filter(entry => {
        const matchesAccount = filterAccount === 'all' || entry.accountId === filterAccount;
        const matchesUser = filterUser === 'all' || entry.userId === filterUser;
        const matchesSearch = 
            entry.description.toLowerCase().includes(search.toLowerCase()) || 
            entry.accountName.toLowerCase().includes(search.toLowerCase()) ||
            (entry.referenceId && entry.referenceId.toLowerCase().includes(search.toLowerCase()));
        return matchesAccount && matchesSearch && matchesUser;
    });

    const handleViewReference = (entry: LedgerEntry) => {
        if (!entry.referenceId) return;
        
        // Find if it's an Invoice
        const inv = invoices.find(i => i.id === entry.referenceId);
        if (inv) {
            generateInvoicePDF(inv, settings);
            return;
        }

        // Find if it's a Purchase
        const pur = purchases.find(p => p.id === entry.referenceId || p.invoiceNumber === entry.referenceId);
        if (pur) {
            alert(`Purchase Ref: ${pur.invoiceNumber}\nStatus: ${pur.status}\nTotal: ${settings.currencySymbol}${pur.total}`);
            return;
        }

        alert(`Reference: ${entry.referenceId}`);
    };

    const handleDownloadPDF = () => {
        generateLedgerPDF(filteredLedger, settings, `General Ledger Export`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-900 rounded-xl text-white shadow-lg"><BookOpen size={20} /></div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Ledger</h1>
                        <p className="text-sm text-slate-500">Audit trail for all accounting transactions.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleDownloadPDF} icon={<Download size={16} />}>Export PDF</Button>
                </div>
            </div>

            <Card className="p-4 bg-slate-50/50">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <Select label="Account" options={accounts} value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                         <div className="relative">
                             <Search className="absolute left-3 top-9 h-4 w-4 text-slate-400" />
                             <Input 
                                label="Search Reference / Invoice #" 
                                placeholder="INV-1234..." 
                                className="pl-9"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                             />
                         </div>
                    </div>
                    <div className="w-48">
                        <Select label="Staff Audit" options={userOptions} value={filterUser} onChange={(e) => setFilterUser(e.target.value)} />
                    </div>
                </div>
            </Card>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table 
                    columns={[
                        { header: 'Date', accessor: 'date' },
                        { header: 'Account / Journal', accessor: (l: LedgerEntry) => (
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-xs">{l.accountName}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{l.category}</span>
                            </div>
                        )},
                        { header: 'Description', accessor: (l: LedgerEntry) => (
                            <div className="flex flex-col">
                                <span className="text-sm text-slate-700">{l.description}</span>
                                {l.referenceId && <span className="text-[10px] text-primary-600 font-mono">Ref: {l.referenceId}</span>}
                            </div>
                        )},
                        { header: 'Type', accessor: (l: LedgerEntry) => <Badge variant={l.type === 'CREDIT' ? 'success' : 'neutral'}>{l.type}</Badge> },
                        { header: 'Amount', accessor: (l: LedgerEntry) => (
                            <span className={`font-mono font-bold ${l.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                {l.type === 'DEBIT' ? '-' : '+'}{settings.currencySymbol}{l.amount.toFixed(2)}
                            </span>
                        )}
                    ]}
                    data={filteredLedger}
                    actions={(l) => (
                        l.referenceId ? (
                            <button onClick={() => handleViewReference(l)} className="p-2 hover:bg-slate-50 rounded text-slate-400 hover:text-primary-600" title="View Source">
                                <ExternalLink size={16} />
                            </button>
                        ) : null
                    )}
                />
            </div>
        </div>
    );
};
