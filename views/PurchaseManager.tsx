
import React, { useState } from 'react';
import { Button, Input, Table, Modal, Badge, Select, Card } from '../components/UIComponents';
import { Plus, Search, Filter, Trash2, Calendar, User, Save, ArrowLeft, Package, Clock, CheckCircle, Truck, History, RotateCcw, Reply, AlertTriangle, Download, LayoutGrid, Minus } from 'lucide-react';
import { Purchase, PurchaseItem, PurchaseHistoryEntry, View, Catalog, CatalogItem, ProductLot } from '../types';
import { useStore } from '../context/StoreContext';
import { generatePurchaseOrderPDF } from '../utils/pdfGenerator';

export const PurchaseManager: React.FC = () => {
    const { purchases, addItem, updateItem, suppliers, catalogs, returnPurchase, receivePurchaseItems, settings } = useStore();
    const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'DETAIL'>('LIST');
    
    // Changed from holding object to holding ID for reactivity
    const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
    const selectedPurchase = purchases.find(p => p.id === selectedPurchaseId) || null;

    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    
    // Create State
    const [createType, setCreateType] = useState<'INVOICE' | 'ORDER'>('ORDER');
    const [supplierId, setSupplierId] = useState('');
    const [invoiceNo, setInvoiceNo] = useState('');
    const [date, setDate] = useState('');
    const [items, setItems] = useState<PurchaseItem[]>([]);
    
    // Temp Item State for Create
    const [newItem, setNewItem] = useState<Partial<PurchaseItem>>({});

    // Catalog Selection State
    const [showCatalogSelector, setShowCatalogSelector] = useState(false);
    const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
    const [catalogQuantity, setCatalogQuantity] = useState('1');

    // Receive Modal State
    const [receivingItems, setReceivingItems] = useState<{id: string, qty: number, batch: string, expiry: string}[]>([]);

    // Return Modal State
    const [returnItems, setReturnItems] = useState<{id: string, qty: number, reason: string}[]>([]);

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

    const handleAddCatalogItem = (catalogItem: CatalogItem, quantity: number) => {
        setItems([...items, {
            productId: catalogItem.id,
            productName: catalogItem.name,
            quantity: quantity,
            receivedQuantity: createType === 'INVOICE' ? quantity : 0,
            cost: catalogItem.costPrice,
            batchNo: `NEW-${Date.now().toString().slice(-4)}`,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            catalogId: catalogItem.catalogId,
            catalogItemId: catalogItem.id
        } as PurchaseItem]);
        setShowCatalogSelector(false);
        setSelectedCatalogItem(null);
        setCatalogQuantity('1');
    };

    const handleSavePurchase = () => {
        if (!supplierId) {
            alert("Please select a supplier from the list.");
            return;
        }
        if (items.length === 0) {
            alert("Please add at least one item.");
            return;
        }

        const supplierObj = suppliers.find(s => s.id === supplierId);
        
        const newPurchase: Purchase = {
            id: Date.now().toString(),
            type: createType,
            supplierId: supplierId,
            supplierName: supplierObj ? supplierObj.businessName : 'Unknown Supplier',
            invoiceNumber: invoiceNo || `PO-${Date.now().toString().slice(-6)}`,
            date: date || new Date().toISOString().split('T')[0],
            items: items,
            total: items.reduce((sum, i) => sum + (i.quantity * i.cost), 0),
            status: createType === 'INVOICE' ? 'Received' : 'Ordered',
            receivedHistory: [],
            returnHistory: []
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
        // Initialize receiving state with 0 for all items
        const initReceiving = selectedPurchase.items
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

        const receivingPayload = validReceiving.map(r => {
            const originalItem = selectedPurchase.items.find(i => i.productId === r.id);
            return {
                productId: r.id,
                quantity: r.qty,
                batchNo: r.batch,
                expiryDate: r.expiry
            };
        });

        receivePurchaseItems(selectedPurchase.id, receivingPayload);
        setIsReceiveModalOpen(false);
        // Stay on detail view to show updates
    };

    const openReturnModal = () => {
        if (!selectedPurchase) return;
        // Init state for all received items
        const initReturns = selectedPurchase.items
            .filter(i => i.receivedQuantity > 0)
            .map(i => ({
                id: i.productId,
                qty: 0,
                reason: 'Damaged'
            }));
        setReturnItems(initReturns);
        setIsReturnModalOpen(true);
    };

    const handleConfirmReturn = () => {
        if(!selectedPurchase) return;
        
        const validReturns = returnItems.filter(r => r.qty > 0);
        if(validReturns.length === 0) return;

        const returnPayload = validReturns.map(r => {
            const originalItem = selectedPurchase.items.find(i => i.productId === r.id);
            return {
                productId: r.id,
                productName: originalItem?.productName || 'Unknown',
                quantity: r.qty,
                reason: r.reason,
                refundAmount: r.qty * (originalItem?.cost || 0)
            };
        });

        returnPurchase(selectedPurchase.id, returnPayload);
        setIsReturnModalOpen(false);
        // Stay on detail view
    };

    const handleDownloadPDF = () => {
        if(selectedPurchase) {
            generatePurchaseOrderPDF(selectedPurchase, settings);
        }
    };


    // --- RENDER HELPERS ---

    const renderProgressBar = (current: number, total: number) => {
        const percent = Math.min(100, Math.round((current / total) * 100));
        let color = 'bg-primary-600';
        if(current > total) color = 'bg-amber-500'; // Over-received
        else if(percent >= 100) color = 'bg-emerald-500';

        return (
            <div className="w-full">
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">
                        {current} / {total}
                        {current > total && <span className="text-amber-600 ml-1">(+{current - total} Excess)</span>}
                    </span>
                    <span className="text-slate-500">{Math.round((current/total)*100)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, (current/total)*100)}%` }}></div>
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
                                        options={[
                                            { value: '', label: 'Select Supplier' },
                                            ...suppliers.map(s => ({value: s.id, label: s.businessName}))
                                        ]} 
                                        value={supplierId} 
                                        onChange={e => setSupplierId(e.target.value)} 
                                    />
                                    <Input label={createType === 'ORDER' ? "PO Number" : "Invoice Number"} value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="Auto-generate" />
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
                                <div className={createType === 'ORDER' ? 'col-span-2' : 'col-span-1'}>
                                    <Input label="Qty" type="number" placeholder="0" value={newItem.quantity || ''} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                                </div>
                                <Button variant="outline" onClick={() => setShowCatalogSelector(true)} icon={<LayoutGrid size={16} />} title="Select from catalog">From Catalog</Button>
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
                        <Button variant="ghost" onClick={() => { setViewMode('LIST'); setSelectedPurchaseId(null); }} icon={<ArrowLeft size={20} />}>Back</Button>
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
                    <div className="flex gap-2">
                         <Button onClick={handleDownloadPDF} variant="secondary" icon={<Download size={18} />}>Download PDF</Button>
                         <Button onClick={openReturnModal} variant="secondary" icon={<Reply size={18} />} className="text-rose-600 border-rose-200 hover:bg-rose-50">Return Items</Button>
                         {selectedPurchase.type === 'ORDER' && selectedPurchase.status !== 'Completed' && (
                            <Button onClick={openReceiveModal} icon={<Truck size={18} />}>Receive Stock</Button>
                        )}
                        {selectedPurchase.type === 'ORDER' && selectedPurchase.status === 'Completed' && (
                            <Button onClick={openReceiveModal} icon={<Plus size={18} />} variant="secondary">Receive Extra</Button>
                        )}
                    </div>
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
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-primary-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
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

                        {/* Return History */}
                        {(selectedPurchase.returnHistory && selectedPurchase.returnHistory.length > 0) && (
                             <Card title="Return History" icon={<RotateCcw size={18} />} className="border-rose-100 bg-rose-50/10">
                                <div className="space-y-4">
                                     {selectedPurchase.returnHistory.map(ret => (
                                         <div key={ret.id} className="p-4 bg-white rounded-lg border border-rose-100 shadow-sm">
                                             <div className="flex justify-between mb-2 pb-2 border-b border-rose-50">
                                                 <div className="flex items-center gap-2">
                                                     <div className="bg-rose-100 p-1 rounded text-rose-600"><RotateCcw size={12} /></div>
                                                     <span className="font-bold text-rose-700">Returned Items</span>
                                                 </div>
                                                 <span className="text-xs text-slate-400">{new Date(ret.date).toLocaleString()}</span>
                                             </div>
                                             <div className="space-y-1">
                                                 {ret.items.map((item, idx) => (
                                                     <div key={idx} className="flex justify-between text-sm">
                                                         <span className="text-slate-700">{item.productName} <span className="text-xs text-slate-400 italic">- {item.reason}</span></span>
                                                         <span className="font-medium text-rose-600">-{item.quantity}</span>
                                                     </div>
                                                 ))}
                                             </div>
                                             <div className="mt-2 pt-2 border-t border-slate-50 flex justify-end">
                                                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mr-2">Refund Value:</span>
                                                 <span className="font-bold text-rose-600">${ret.totalRefund.toFixed(2)}</span>
                                             </div>
                                         </div>
                                     ))}
                                </div>
                             </Card>
                        )}
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
                <Modal isOpen={isReceiveModalOpen} onClose={() => setIsReceiveModalOpen(false)} title="Receive Shipment">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500">Enter quantity, batch, and expiry for arriving items. You can partial receive or over-receive.</p>
                        <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4">
                            {selectedPurchase.items.map((item) => {
                                const remaining = item.quantity - item.receivedQuantity;
                                const currentEntry = receivingItems.find(r => r.id === item.productId) || {qty: 0, batch: '', expiry: ''};
                                const isExcess = currentEntry.qty > remaining;

                                return (
                                    <div key={item.productId} className={`p-3 border rounded-lg ${isExcess ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex justify-between mb-2">
                                            <span className="font-medium text-sm text-slate-900">{item.productName}</span>
                                            <div className="text-right">
                                                <div className="text-xs text-slate-500">
                                                    Ordered: {item.quantity} | Received: {item.receivedQuantity}
                                                </div>
                                                <div className={`text-xs font-bold ${isExcess ? 'text-amber-600' : 'text-primary-600'}`}>
                                                    Remaining: {Math.max(0, remaining)} {isExcess && "(Excess!)"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Input 
                                                type="number" 
                                                placeholder="Qty" 
                                                value={currentEntry.qty || ''}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setReceivingItems(receivingItems.map(r => r.id === item.productId ? {...r, qty: val} : r));
                                                }}
                                                className={isExcess ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-200' : ''}
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

                {/* Return Modal */}
                <Modal isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} title="Return Purchased Items">
                    <div className="space-y-4">
                         <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 text-sm text-rose-800">
                             <p><strong>Warning:</strong> Returning items will deduct them from your current stock and adjust the supplier balance (Accounts Payable).</p>
                         </div>
                        <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4">
                            {selectedPurchase.items.map((item) => {
                                // Can only return what has been received
                                const returnable = item.receivedQuantity;
                                if(returnable <= 0) return null;
                                
                                const currentEntry = returnItems.find(r => r.id === item.productId) || {qty: 0, reason: 'Damaged'};

                                return (
                                    <div key={item.productId} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-medium text-sm text-slate-900">{item.productName}</span>
                                            <span className="text-xs text-slate-500">Received: {returnable}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input 
                                                type="number" 
                                                placeholder="Return Qty" 
                                                value={currentEntry.qty || ''}
                                                onChange={(e) => {
                                                    const val = Math.min(returnable, Number(e.target.value));
                                                    setReturnItems(returnItems.map(r => r.id === item.productId ? {...r, qty: val} : r));
                                                }}
                                            />
                                            <Select 
                                                options={[{value: 'Damaged', label: 'Damaged'}, {value: 'Wrong Item', label: 'Wrong Item'}, {value: 'Excess', label: 'Excess'}]}
                                                value={currentEntry.reason}
                                                onChange={(e) => setReturnItems(returnItems.map(r => r.id === item.productId ? {...r, reason: e.target.value} : r))}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
                            <Button variant="danger" onClick={handleConfirmReturn}>Confirm Return</Button>
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
                                         <div className="h-full bg-primary-500" style={{width: `${Math.min(100, pct)}%`}}></div>
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
                    actions={(item) => <Button variant="ghost" size="sm" onClick={() => { setSelectedPurchaseId(item.id); setViewMode('DETAIL'); }}>Manage</Button>}
                />
            </div>

            {/* Catalog Item Selector Modal */}
            <Modal isOpen={showCatalogSelector} onClose={() => { setShowCatalogSelector(false); setSelectedCatalogItem(null); setCatalogQuantity('1'); }} title="Select from Catalog">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto">
                        {catalogs.map(catalog => (
                            <div key={catalog.id} className="border-l-4 border-primary-500 pl-4 py-3">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{catalog.name} ({catalog.brand})</h3>
                                <div className="space-y-2">
                                    {catalog.items?.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedCatalogItem(item)}
                                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                                selectedCatalogItem?.id === item.id
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                                                    <p className="text-xs text-slate-500">{item.sku}</p>
                                                </div>
                                                <Badge variant="secondary">{settings.currencySymbol}{item.costPrice.toFixed(2)}</Badge>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedCatalogItem && (
                        <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border-2 border-primary-200 dark:border-primary-800 space-y-3">
                            <h4 className="font-bold text-slate-900 dark:text-white">Quantity to Purchase</h4>
                            <div className="flex items-end gap-3">
                                <div className="flex-1">
                                    <Input 
                                        label="Units" 
                                        type="number" 
                                        value={catalogQuantity} 
                                        onChange={(e) => setCatalogQuantity(Math.max(1, parseInt(e.target.value) || 1).toString())}
                                        min="1"
                                    />
                                </div>
                                <Button 
                                    variant="secondary" 
                                    onClick={() => setCatalogQuantity((Math.max(1, parseInt(catalogQuantity) - 1)).toString())}
                                >
                                    <Minus size={16} />
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    onClick={() => setCatalogQuantity((parseInt(catalogQuantity) + 1).toString())}
                                >
                                    <Plus size={16} />
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="secondary" onClick={() => { setShowCatalogSelector(false); setSelectedCatalogItem(null); setCatalogQuantity('1'); }}>Cancel</Button>
                        <Button 
                            onClick={() => selectedCatalogItem && handleAddCatalogItem(selectedCatalogItem, parseInt(catalogQuantity) || 1)}
                            disabled={!selectedCatalogItem}
                            icon={<Plus size={16} />}
                        >
                            Add {catalogQuantity} to Purchase
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
