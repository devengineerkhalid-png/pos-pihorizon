import React, { useState } from 'react';
import { Button, Input, Table, Modal, Badge, Select, Card } from '../components/UIComponents';
import { Plus, Search, Filter, Trash2, Calendar, User, Save, ArrowLeft, Package, Clock, CheckCircle, Truck, History } from 'lucide-react';
import { Purchase, PurchaseItem, PurchaseHistoryEntry, View } from '../types';
import { useStore } from '../context/StoreContext';

export const PurchaseManager: React.FC = () => {
    const { purchases, addItem, updateItem, suppliers } = useStore();
    const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'DETAIL'>('LIST');
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    
    // Create State
    const [createType, setCreateType] = useState<'INVOICE' | 'ORDER'>('ORDER');
    const [supplierId, setSupplierId] = useState('');
    const [invoiceNo, setInvoiceNo] = useState('');
    const [date, setDate] = useState('');
    const [items, setItems] = useState<PurchaseItem[]>([]);
    
    // Temp Item State for Create
    const [newItem, setNewItem] = useState<Partial<PurchaseItem>>({});

    // Receive Modal State
    const [receivingItems, setReceivingItems] = useState<{id: string, qty: number, batch: string, expiry: string}[]>([]);

    const handleAddItem = () => {
        if(!newItem.productName || !newItem.quantity || !newItem.cost) return;
        setItems([...items, {
            productId: Date.now().toString(),
            productName: newItem.productName,
            quantity: Number(newItem.quantity),
            receivedQuantity: createType === 'INVOICE' ? Number(newItem.quantity) : 0, // Invoices are auto-received
            cost: Number(newItem.cost),
            batchNo: newItem.batchNo,
            expiryDate: newItem.expiryDate
        } as PurchaseItem]);
        setNewItem({});
    };

    const handleSavePurchase = () => {
        const supplierObj = suppliers.find(s => s.id === supplierId);
        
        const newPurchase: Purchase = {
            id: Date.now().toString(),
            type: createType,
            supplierId: supplierId,
            supplierName: supplierObj ? supplierObj.businessName : 'Unknown Supplier',
            invoiceNumber: invoiceNo,
            date: date || new Date().toISOString().split('T')[0],
            items: items,
            total: items.reduce((sum, i) => sum + (i.quantity * i.cost), 0),
            status: createType === 'INVOICE' ? 'Received' : 'Ordered',
            receivedHistory: []
        };
        
        if(createType === 'INVOICE') {
             const historyEntry: PurchaseHistoryEntry = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                items: items.map(i => ({
                    productId: i.productId,
                    productName: i.productName,
                    quantity: i.quantity,
                    batchNo: i.batchNo,
                    expiryDate: i.expiryDate
                }))
             };
             newPurchase.receivedHistory.push(historyEntry);
        }

        addItem(View.PURCHASES, newPurchase);
        setViewMode('LIST');
        // Reset form
        setItems([]); setSupplierId(''); setInvoiceNo(''); setDate('');
    };

    const openReceiveModal = () => {
        if(!selectedPurchase) return;
        // Initialize receiving state with 0 for all incomplete items
        const initReceiving = selectedPurchase.items
            .filter(i => i.receivedQuantity < i.quantity)
            .map(i => ({
                id: i.productId,
                qty: 0,
                batch: '',
                expiry: ''
            }));
        setReceivingItems(initReceiving);
        setIsReceiveModalOpen(true);
    };

    const handleConfirmReceive = () => {
        if(!selectedPurchase) return;
        
        const validReceiving = receivingItems.filter(r => r.qty > 0);
        if(validReceiving.length === 0) return;

        // Create History Entry
        const historyEntry: PurchaseHistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            items: validReceiving.map(r => {
                const originalItem = selectedPurchase.items.find(i => i.productId === r.id);
                return {
                    productId: r.id,
                    productName: originalItem?.productName || 'Unknown',
                    quantity: r.qty,
                    batchNo: r.batch,
                    expiryDate: r.expiry
                };
            })
        };

        // Update Purchase Item Counts
        const updatedItems = selectedPurchase.items.map(item => {
            const received = validReceiving.find(r => r.id === item.productId);
            if(received) {
                return { ...item, receivedQuantity: item.receivedQuantity + received.qty };
            }
            return item;
        });

        // Determine New Status
        const totalOrdered = updatedItems.reduce((s, i) => s + i.quantity, 0);
        const totalReceived = updatedItems.reduce((s, i) => s + i.receivedQuantity, 0);
        const newStatus = totalReceived >= totalOrdered ? 'Completed' : 'Partial';

        const updatedPurchase = {
            ...selectedPurchase,
            items: updatedItems,
            status: newStatus as any,
            receivedHistory: [historyEntry, ...selectedPurchase.receivedHistory]
        };

        // Update Store
        updateItem(View.PURCHASES, updatedPurchase);
        setSelectedPurchase(updatedPurchase); // Update local view
        setIsReceiveModalOpen(false);
    };

    // --- RENDER HELPERS ---

    const renderProgressBar = (current: number, total: number) => {
        const percent = Math.min(100, Math.round((current / total) * 100));
        let color = 'bg-primary-600';
        if(percent >= 100) color = 'bg-emerald-500';
        else if (percent > 0) color = 'bg-amber-500';

        return (
            <div className="w-full">
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{current} / {total}</span>
                    <span className="text-slate-500">{percent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                </div>
            </div>
        );
    };

    if (viewMode === 'CREATE') {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => setViewMode('LIST')} icon={<ArrowLeft size={20} />}>Back</Button>
                    <h1 className="text-2xl font-bold text-slate-900">New Purchase</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card title="Purchase Details">
                            <div className="space-y-4">
                                <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="type" checked={createType === 'ORDER'} onChange={() => setCreateType('ORDER')} className="text-primary-600 focus:ring-primary-500" />
                                        <span className="font-medium">Purchase Order (Quotation)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="type" checked={createType === 'INVOICE'} onChange={() => setCreateType('INVOICE')} className="text-primary-600 focus:ring-primary-500" />
                                        <span className="font-medium">Direct Invoice (Instant Stock)</span>
                                    </label>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <Select 
                                        label="Supplier" 
                                        options={suppliers.map(s => ({value: s.id, label: s.businessName}))} 
                                        value={supplierId} 
                                        onChange={e => setSupplierId(e.target.value)} 
                                    />
                                    <Input label={createType === 'ORDER' ? "PO Number" : "Invoice Number"} value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                                    <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                                </div>
                            </div>
                        </Card>

                        <Card title="Product Entry">
                            <div className="grid grid-cols-6 gap-3 items-end mb-4">
                                <div className="col-span-2">
                                    <Input label="Product" placeholder="Search product..." value={newItem.productName || ''} onChange={e => setNewItem({...newItem, productName: e.target.value})} />
                                </div>
                                {createType === 'INVOICE' && (
                                    <>
                                        <div><Input label="Batch" placeholder="Opt" value={newItem.batchNo || ''} onChange={e => setNewItem({...newItem, batchNo: e.target.value})} /></div>
                                        <div><Input label="Expiry" type="date" value={newItem.expiryDate || ''} onChange={e => setNewItem({...newItem, expiryDate: e.target.value})} /></div>
                                    </>
                                )}
                                <div className={createType === 'ORDER' ? 'col-span-2' : ''}>
                                    <Input label="Cost" type="number" placeholder="0.00" value={newItem.cost || ''} onChange={e => setNewItem({...newItem, cost: Number(e.target.value)})} />
                                </div>
                                <div className={createType === 'ORDER' ? 'col-span-2' : ''}>
                                    <Input label="Qty" type="number" placeholder="0" value={newItem.quantity || ''} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                                </div>
                            </div>
                            <Button className="w-full mb-6" variant="secondary" onClick={handleAddItem} icon={<Plus size={16} />}>Add Line Item</Button>

                            {items.length > 0 && (
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Product</th>
                                            {createType === 'INVOICE' && <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Batch Info</th>}
                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Qty</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Cost</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Total</th>
                                            <th className="px-3 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-3 py-2 text-sm">{item.productName}</td>
                                                {createType === 'INVOICE' && <td className="px-3 py-2 text-sm text-slate-500">{item.batchNo || '-'} / {item.expiryDate || '-'}</td>}
                                                <td className="px-3 py-2 text-sm font-medium">{item.quantity}</td>
                                                <td className="px-3 py-2 text-sm">${item.cost}</td>
                                                <td className="px-3 py-2 text-sm font-bold">${(item.quantity * item.cost).toFixed(2)}</td>
                                                <td className="px-3 py-2 text-right">
                                                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-rose-500 hover:text-rose-700"><Trash2 size={14} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card title="Summary">
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Total Items</span>
                                    <span className="font-medium">{items.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Total Qty</span>
                                    <span className="font-medium">{items.reduce((s, i) => s + i.quantity, 0)}</span>
                                </div>
                                <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                                    <span className="font-bold text-slate-900">Total Amount</span>
                                    <span className="font-bold text-xl text-primary-600">${items.reduce((sum, i) => sum + (i.quantity * i.cost), 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <Button className="w-full" size="lg" icon={<Save size={20} />} onClick={handleSavePurchase}>
                                {createType === 'ORDER' ? 'Create Order' : 'Save Invoice'}
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (viewMode === 'DETAIL' && selectedPurchase) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => { setViewMode('LIST'); setSelectedPurchase(null); }} icon={<ArrowLeft size={20} />}>Back</Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{selectedPurchase.invoiceNumber}</h1>
                            <div className="flex gap-2 items-center text-sm text-slate-500">
                                <span className="flex items-center gap-1"><User size={14}/> {selectedPurchase.supplierName}</span>
                                <span>•</span>
                                <span>{selectedPurchase.date}</span>
                                <span>•</span>
                                <Badge variant={selectedPurchase.status === 'Completed' || selectedPurchase.status === 'Received' ? 'success' : 'warning'}>{selectedPurchase.status}</Badge>
                            </div>
                        </div>
                    </div>
                    {selectedPurchase.type === 'ORDER' && selectedPurchase.status !== 'Completed' && (
                        <Button onClick={openReceiveModal} icon={<Truck size={18} />}>Receive Stock</Button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                         {/* Order Progress */}
                        <Card title="Order Items & Progress">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cost</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-1/3">Receiving Status</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {selectedPurchase.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-4 text-sm font-medium text-slate-900">{item.productName}</td>
                                                <td className="px-4 py-4 text-sm text-slate-600">${item.cost.toFixed(2)}</td>
                                                <td className="px-4 py-4">
                                                    {renderProgressBar(item.receivedQuantity, item.quantity)}
                                                </td>
                                                <td className="px-4 py-4 text-sm font-bold text-right">${(item.quantity * item.cost).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* History */}
                        <Card title="Reception History" icon={<History size={18} />}>
                            {selectedPurchase.receivedHistory.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 text-sm">No stock received yet.</div>
                            ) : (
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                    {selectedPurchase.receivedHistory.map((history, idx) => (
                                        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                                <CheckCircle size={18} />
                                            </div>
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="flex items-center justify-between space-x-2 mb-1">
                                                    <div className="font-bold text-slate-900">Received Shipment</div>
                                                    <time className="font-mono text-xs text-slate-500">{new Date(history.date).toLocaleDateString()} {new Date(history.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                                                </div>
                                                <div className="text-sm text-slate-600 mb-2">
                                                    {history.items.map((hi, i) => (
                                                        <div key={i} className="flex justify-between border-b border-slate-50 last:border-0 py-1">
                                                            <span>{hi.productName}</span>
                                                            <span className="font-medium">+{hi.quantity} <span className="text-xs text-slate-400">({hi.batchNo})</span></span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card title="Order Summary">
                             <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Ordered Total</span>
                                    <span className="font-bold">${selectedPurchase.total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Supplier</span>
                                    <span className="font-medium">{selectedPurchase.supplierName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Order Date</span>
                                    <span className="font-medium">{selectedPurchase.date}</span>
                                </div>
                             </div>
                        </Card>
                    </div>
                </div>

                {/* Receive Modal */}
                <Modal isOpen={isReceiveModalOpen} onClose={() => setIsReceiveModalOpen(false)} title="Receive Partial Shipment">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500">Enter quantity, batch, and expiry for arriving items.</p>
                        <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4">
                            {selectedPurchase.items.map((item) => {
                                const remaining = item.quantity - item.receivedQuantity;
                                if(remaining <= 0) return null;
                                
                                const currentEntry = receivingItems.find(r => r.id === item.productId) || {qty: 0, batch: '', expiry: ''};

                                return (
                                    <div key={item.productId} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-medium text-sm text-slate-900">{item.productName}</span>
                                            <span className="text-xs text-slate-500">Remaining: {remaining}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Input 
                                                type="number" 
                                                placeholder="Qty" 
                                                value={currentEntry.qty || ''}
                                                onChange={(e) => {
                                                    const val = Math.min(remaining, Number(e.target.value));
                                                    setReceivingItems(receivingItems.map(r => r.id === item.productId ? {...r, qty: val} : r));
                                                }}
                                            />
                                            <Input 
                                                placeholder="Batch" 
                                                value={currentEntry.batch}
                                                onChange={(e) => setReceivingItems(receivingItems.map(r => r.id === item.productId ? {...r, batch: e.target.value} : r))}
                                            />
                                            <Input 
                                                type="date" 
                                                value={currentEntry.expiry}
                                                onChange={(e) => setReceivingItems(receivingItems.map(r => r.id === item.productId ? {...r, expiry: e.target.value} : r))}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => setIsReceiveModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleConfirmReceive}>Confirm Reception</Button>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    // Default LIST view
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Purchase Management</h1>
                <Button onClick={() => setViewMode('CREATE')} icon={<Plus size={18} />}>Create Order / Invoice</Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search PO or Supplier..." className="pl-9" />
                    </div>
                    <Select options={[{value: 'all', label: 'All Status'}, {value: 'pending', label: 'Pending'}, {value: 'partial', label: 'Partial'}]} className="max-w-[150px]" />
                    <Button variant="secondary" icon={<Filter size={16} />}>Filter</Button>
                </div>
                <Table 
                    columns={[
                        { header: 'Date', accessor: 'date' },
                        { header: 'Ref #', accessor: 'invoiceNumber' },
                        { header: 'Type', accessor: (i: Purchase) => <Badge variant="neutral">{i.type}</Badge> },
                        { header: 'Supplier', accessor: 'supplierName' },
                        { header: 'Total', accessor: (i: Purchase) => `$${i.total.toFixed(2)}` },
                        { header: 'Progress', accessor: (i: Purchase) => {
                             if(i.type === 'INVOICE') return <span className="text-xs text-slate-500">N/A</span>;
                             const totalQty = i.items.reduce((s, x) => s + x.quantity, 0);
                             const recvQty = i.items.reduce((s, x) => s + x.receivedQuantity, 0);
                             const pct = totalQty > 0 ? Math.round((recvQty/totalQty)*100) : 0;
                             return (
                                 <div className="w-24">
                                     <div className="text-[10px] text-right mb-0.5">{pct}%</div>
                                     <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                         <div className="h-full bg-primary-500" style={{width: `${pct}%`}}></div>
                                     </div>
                                 </div>
                             );
                        }},
                        { header: 'Status', accessor: (i: Purchase) => {
                            const map: Record<string, 'success' | 'warning' | 'neutral' | 'danger'> = {
                                'Completed': 'success', 'Received': 'success', 'Partial': 'warning', 'Ordered': 'neutral', 'Pending': 'neutral'
                            };
                            return <Badge variant={map[i.status] || 'neutral'}>{i.status}</Badge>;
                        }}
                    ]}
                    data={purchases}
                    actions={(item) => <Button variant="ghost" size="sm" onClick={() => { setSelectedPurchase(item); setViewMode('DETAIL'); }}>Manage</Button>}
                />
            </div>
        </div>
    );
};