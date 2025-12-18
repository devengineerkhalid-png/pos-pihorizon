
import React, { useState, useMemo } from 'react';
import { Button, Input, Table, Modal, Badge, Card, Select } from '../components/UIComponents';
import { Search, Plus, Edit, Trash2, Eye, MapPin, Phone, History, CreditCard, ShoppingBag, Wallet, Printer } from 'lucide-react';
import { View, Supplier, Customer, Invoice, LedgerEntry, Purchase } from '../types';
import { useStore } from '../context/StoreContext';
import { generateInvoicePDF } from '../utils/pdfGenerator';

interface ManagerProps {
    type: View;
}

export const GenericManager: React.FC<ManagerProps> = ({ type }) => {
    const { 
        products, suppliers, customers, users, expenses, invoices, roles, settings, purchases, ledger,
        addItem, updateItem, deleteItem
    } = useStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
    const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
    const [detailTab, setDetailTab] = useState<'SUMMARY' | 'HISTORY' | 'PAYMENTS' | 'PRODUCTS' | 'LEDGER'>('SUMMARY');
    const [formData, setFormData] = useState<any>({});
    const [isModalOpen, setIsModalOpen] = useState(false);

    const title = type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ');

    const filteredData = useMemo(() => {
        const data = type === View.SUPPLIERS ? suppliers : type === View.CUSTOMERS ? customers : type === View.INVOICES ? invoices : type === View.USERS ? users : type === View.ROLES ? roles : [];
        const term = searchQuery.toLowerCase();
        return data.filter((item: any) => {
            const basicMatch = (item.name || item.businessName || item.id || "").toLowerCase().includes(term);
            // Deep search for invoices by product name
            const productMatch = type === View.INVOICES && item.items?.some((i: any) => i.name.toLowerCase().includes(term));
            return basicMatch || productMatch;
        });
    }, [type, searchQuery, suppliers, customers, invoices, users, roles]);

    const supplierStats = useMemo(() => {
        if (!viewSupplier) return null;
        const sPurchases = purchases.filter(p => p.supplierId === viewSupplier.id);
        const sPayments = ledger.filter(l => l.accountId === viewSupplier.id && l.type === 'DEBIT');
        const totalBuying = sPurchases.reduce((sum, p) => sum + p.total, 0);
        const totalPaid = sPayments.reduce((sum, l) => sum + l.amount, 0);
        const uniqueProducts = new Set<string>();
        sPurchases.forEach(p => p.items.forEach(i => uniqueProducts.add(i.productName)));
        return { totalBuying, totalPaid, balance: viewSupplier.balance, products: Array.from(uniqueProducts) };
    }, [viewSupplier, purchases, ledger]);

    const customerStats = useMemo(() => {
        if (!viewCustomer) return null;
        const cInvoices = invoices.filter(i => i.customerName === viewCustomer.name);
        const totalSales = cInvoices.reduce((sum, i) => sum + i.total, 0);
        const totalPaid = cInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0);
        return { totalSales, totalPaid, balance: totalSales - totalPaid, invoiceCount: cInvoices.length };
    }, [viewCustomer, invoices]);

    const handleSave = () => {
        const itemToSave = { ...formData, status: formData.status || 'Active' };
        formData.id ? updateItem(type, itemToSave) : addItem(type, itemToSave);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title} Management</h1>
                    <p className="text-sm text-slate-500">Record keeping and auditing for {title.toLowerCase()}.</p>
                </div>
                <Button onClick={() => { setFormData({}); setIsModalOpen(true); }} icon={<Plus size={18} />}>Add New</Button>
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input placeholder={`Search by Name, ID, or Product...`} className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>
                <Table 
                    columns={[
                        { header: 'ID / Ref', accessor: 'id' },
                        { header: 'Entity', accessor: (item: any) => item.businessName || item.name || 'Anonymous' },
                        { header: 'Details', accessor: (item: any) => (
                            <div className="text-xs text-slate-500">
                                {item.phone && <div><Phone size={10} className="inline mr-1"/> {item.phone}</div>}
                                {item.date && <div><History size={10} className="inline mr-1"/> {item.date}</div>}
                            </div>
                        )},
                        { header: 'Balance / Total', accessor: (item: any) => (
                            <span className="font-bold">
                                {settings.currencySymbol}{(item.balance !== undefined ? item.balance : item.total || 0).toFixed(2)}
                            </span>
                        )},
                        { header: 'Status', accessor: (item: any) => <Badge variant={item.status === 'Paid' || item.status === 'Active' ? 'success' : 'warning'}>{item.status}</Badge> }
                    ]} 
                    data={filteredData} 
                    actions={(item) => (
                        <div className="flex justify-end gap-1">
                             {type === View.SUPPLIERS && <button onClick={() => { setViewSupplier(item); setDetailTab('SUMMARY'); }} className="p-2 hover:bg-primary-50 rounded text-primary-600"><Eye size={18} /></button>}
                             {type === View.CUSTOMERS && <button onClick={() => { setViewCustomer(item); setDetailTab('SUMMARY'); }} className="p-2 hover:bg-primary-50 rounded text-primary-600"><Eye size={18} /></button>}
                             {type === View.INVOICES && <button onClick={() => generateInvoicePDF(item, settings)} className="p-2 hover:bg-slate-100 rounded text-slate-600"><Printer size={18} /></button>}
                             <button onClick={() => { setFormData(item); setIsModalOpen(true); }} className="p-2 hover:bg-slate-100 rounded text-slate-600"><Edit size={18} /></button>
                             <button onClick={() => deleteItem(type, item.id)} className="p-2 hover:bg-rose-50 rounded text-rose-500"><Trash2 size={18} /></button>
                        </div>
                    )}
                />
            </Card>

            {/* Entity Detail Modal (Supplier/Customer) */}
            <Modal isOpen={!!viewSupplier || !!viewCustomer} onClose={() => { setViewSupplier(null); setViewCustomer(null); }} title="Complete Ledger History">
                {(viewSupplier || viewCustomer) && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Volume</p>
                                <p className="text-xl font-bold">{settings.currencySymbol}{(viewSupplier ? supplierStats?.totalBuying : customerStats?.totalSales)?.toFixed(2)}</p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Total Paid</p>
                                <p className="text-xl font-bold text-emerald-700">{(viewSupplier ? supplierStats?.totalPaid : customerStats?.totalPaid)?.toFixed(2)}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Balance</p>
                                <p className="text-xl font-bold text-rose-600">{(viewSupplier ? supplierStats?.balance : customerStats?.balance)?.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
                            {['SUMMARY', 'HISTORY', 'PAYMENTS', 'PRODUCTS', 'LEDGER'].map((tab: any) => (
                                <button key={tab} onClick={() => setDetailTab(tab)} className={`pb-2 text-xs font-bold transition-colors ${detailTab === tab ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-400'}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="min-h-[200px] text-sm">
                            {detailTab === 'SUMMARY' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p><strong>Entity:</strong> {viewSupplier?.businessName || viewCustomer?.name}</p>
                                        <p><strong>Contact:</strong> {viewSupplier?.name || viewCustomer?.phone}</p>
                                        <p><strong>Email:</strong> {viewSupplier?.email || viewCustomer?.email}</p>
                                    </div>
                                    <div><p><strong>Address:</strong> {viewSupplier?.address || viewCustomer?.address}</p></div>
                                </div>
                            )}
                            {detailTab === 'PRODUCTS' && viewSupplier && (
                                <div className="flex flex-wrap gap-2">
                                    {supplierStats?.products.map(p => <Badge key={p} variant="neutral">{p}</Badge>)}
                                </div>
                            )}
                            {/* Further tab rendering for History/Payments would use filtered list components here */}
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Entity Details">
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Name / Business" value={formData.businessName || formData.name || ''} onChange={e => setFormData({...formData, businessName: e.target.value, name: e.target.value})} />
                    <Input label="Phone" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    <Input label="Email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <Input label="Address" className="col-span-2" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="flex justify-end mt-6 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Record</Button>
                </div>
            </Modal>
        </div>
    );
};
