
import React, { useState, useRef } from 'react';
import { Button, Input, Table, Modal, Badge, Select } from '../components/UIComponents';
import { Plus, Search, Filter, Edit, Trash2, Layers, UploadCloud, Barcode, RotateCcw, AlertOctagon, Download, Upload, Printer, QrCode, X } from 'lucide-react';
import { View, ProductVariant } from '../types';
import { useStore } from '../context/StoreContext';

interface ManagerProps {
    type: View;
}

export const GenericManager: React.FC<ManagerProps> = ({ type }) => {
    const { 
        products, suppliers, customers, users, expenses, invoices, roles, settings,
        addItem, updateItem, deleteItem, returnInvoice, addStockAdjustment
    } = useStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [showFilters, setShowFilters] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isStockAdjOpen, setIsStockAdjOpen] = useState(false);
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
    const [labelProduct, setLabelProduct] = useState<any>(null);

    const [formData, setFormData] = useState<any>({});
    
    // Product Variant State
    const [hasVariants, setHasVariants] = useState(false);
    const [tempVariants, setTempVariants] = useState<ProductVariant[]>([]);
    const [newVariant, setNewVariant] = useState({ name: '', sku: '', price: '', stock: '' });

    // Stock Adjustment State
    const [adjData, setAdjData] = useState({ productId: '', quantity: '', reason: 'Damaged' });

    // File Import
    const fileInputRef = useRef<HTMLInputElement>(null);

    const title = type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ');

    // Get current data list based on view
    const getCurrentData = () => {
        switch(type) {
            case View.PRODUCTS: return products;
            case View.SUPPLIERS: return suppliers;
            case View.CUSTOMERS: return customers;
            case View.USERS: return users;
            case View.EXPENSES: return expenses;
            case View.INVOICES: return invoices;
            case View.ROLES: return roles;
            default: return [];
        }
    };

    const data = getCurrentData();

    const handleOpenModal = (item?: any) => {
        if (item) {
            setFormData({ ...item });
            if (type === View.PRODUCTS && item.variants) {
                setTempVariants(item.variants);
                setHasVariants(true);
            } else {
                setHasVariants(false);
                setTempVariants([]);
            }
        } else {
            setFormData({});
            setHasVariants(false);
            setTempVariants([]);
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        const itemToSave = {
            ...formData,
            // Ensure defaults
            status: formData.status || 'Active',
            variants: hasVariants ? tempVariants : undefined
        };

        // Number conversions
        if(type === View.PRODUCTS) {
            itemToSave.stock = Number(itemToSave.stock || 0);
            itemToSave.price = Number(itemToSave.price || 0);
        } else if (type === View.EXPENSES) {
            itemToSave.amount = Number(itemToSave.amount || 0);
            if (!itemToSave.date) itemToSave.date = new Date().toISOString().split('T')[0];
        } else if (type === View.CUSTOMERS) {
            // Ensure loyalty defaults if not present
            itemToSave.loyaltyPoints = itemToSave.loyaltyPoints || 0;
            itemToSave.totalPurchases = itemToSave.totalPurchases || 0;
        }

        if (formData.id) {
            updateItem(type, itemToSave);
        } else {
            addItem(type, itemToSave);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if(confirm('Are you sure you want to delete this item?')) {
            deleteItem(type, id);
        }
    };

    const handleRefund = (id: string) => {
        if(confirm('Process full refund for this invoice? Stock will be restored.')) {
            returnInvoice(id);
        }
    };

    const submitAdjustment = () => {
        if(!adjData.productId || !adjData.quantity) return;
        const prod = products.find(p => p.id === adjData.productId);
        if(!prod) return;

        addStockAdjustment({
            productId: adjData.productId,
            productName: prod.name,
            quantity: -Math.abs(Number(adjData.quantity)), // Always negative for damage/loss in this simple UI
            reason: adjData.reason as any
        });
        setIsStockAdjOpen(false);
        setAdjData({ productId: '', quantity: '', reason: 'Damaged' });
    };

    const handleExportCSV = () => {
        if (data.length === 0) return alert('No data to export');
        
        // Flatten object for CSV
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        data.forEach((row: any) => {
            const values = headers.map(header => {
                const val = row[header];
                // Escape strings with commas
                const escaped = typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
                // Simple handling for objects (like variants array)
                return (typeof val === 'object' && val !== null) ? '[Object]' : escaped;
            });
            csvRows.push(values.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.toLowerCase()}_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n');
            if (lines.length < 2) return alert("Invalid CSV format");

            const headers = lines[0].split(',').map(h => h.trim());
            
            let successCount = 0;

            lines.slice(1).forEach(line => {
                if(!line.trim()) return;
                const values = line.split(',');
                const obj: any = {};
                
                headers.forEach((header, index) => {
                    let val = values[index]?.trim();
                    // Basic Type Conversion
                    if (header === 'price' || header === 'costPrice' || header === 'stock' || header === 'taxRate' || header === 'balance' || header === 'amount') {
                        obj[header] = Number(val) || 0;
                    } else {
                        obj[header] = val;
                    }
                });

                // Add valid object
                if (obj.name || obj.title || obj.invoiceNumber) { 
                    addItem(type, obj);
                    successCount++;
                }
            });
            alert(`Successfully imported ${successCount} items.`);
            if(fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        };
        reader.readAsText(file);
    };

    const handlePrintLabel = (product: any) => {
        setLabelProduct(product);
        setIsLabelModalOpen(true);
    };

    // --- FILTERING LOGIC ---
    const filteredData = data.filter((item: any) => {
        const term = searchQuery.toLowerCase();
        const matchesSearch = (
            (item.name && item.name.toLowerCase().includes(term)) ||
            (item.title && item.title.toLowerCase().includes(term)) ||
            (item.customerName && item.customerName.toLowerCase().includes(term)) ||
            (item.businessName && item.businessName.toLowerCase().includes(term)) ||
            (item.id && item.id.toLowerCase().includes(term))
        );

        let matchesCategory = true;
        if (showFilters && filterCategory !== 'All') {
            if (type === View.PRODUCTS) matchesCategory = item.category === filterCategory;
            if (type === View.USERS) matchesCategory = item.role === filterCategory;
            if (type === View.EXPENSES) matchesCategory = item.category === filterCategory;
            if (type === View.INVOICES) matchesCategory = item.status === filterCategory;
        }

        return matchesSearch && matchesCategory;
    });

    // Dynamic Filter Options
    const getFilterOptions = () => {
        const uniqueOptions = new Set<string>();
        data.forEach((item: any) => {
            if (type === View.PRODUCTS && item.category) uniqueOptions.add(item.category);
            if (type === View.USERS && item.role) uniqueOptions.add(item.role);
            if (type === View.EXPENSES && item.category) uniqueOptions.add(item.category);
            if (type === View.INVOICES && item.status) uniqueOptions.add(item.status);
        });
        return ['All', ...Array.from(uniqueOptions)];
    };

    // Dynamic Columns based on View
    const getColumns = () => {
        switch (type) {
            case View.USERS:
                return [
                    { header: 'Name', accessor: 'name' },
                    { header: 'Email', accessor: 'email' },
                    { header: 'Role', accessor: 'role' },
                    { header: 'Status', accessor: (item: any) => <Badge variant={item.status === 'Active' ? 'success' : 'neutral'}>{item.status}</Badge> }
                ];
            case View.ROLES:
                return [
                    { header: 'Role Name', accessor: 'name' },
                    { header: 'Permissions', accessor: (item: any) => <span className="text-xs text-slate-500">{item.permissions?.length || 0} modules allowed</span> }
                ];
            case View.SUPPLIERS:
                return [
                    { header: 'Business Name', accessor: 'businessName' },
                    { header: 'Contact Person', accessor: 'name' },
                    { header: 'Phone', accessor: 'phone' },
                    { header: 'Balance', accessor: (item: any) => <span className={item.balance > 0 ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium'}>{settings.currencySymbol}{Math.abs(item.balance).toFixed(2)} {item.balance > 0 ? 'Due' : 'Cr'}</span> }
                ];
            case View.EXPENSES:
                return [
                    { header: 'Expense Title', accessor: 'title' },
                    { header: 'Category', accessor: 'category' },
                    { header: 'Date', accessor: 'date' },
                    { header: 'Amount', accessor: (item: any) => <span className="font-bold text-slate-900">{settings.currencySymbol}{item.amount.toFixed(2)}</span> },
                    { header: 'Status', accessor: (item: any) => <Badge variant={item.status === 'Paid' ? 'success' : 'warning'}>{item.status}</Badge> }
                ];
            case View.PRODUCTS:
                return [
                    { header: 'Product', accessor: (item: any) => (
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Layers size={16} />}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
                                <span className="text-xs text-slate-400 font-mono">{item.sku}</span>
                            </div>
                        </div>
                    )},
                    { header: 'Stock', accessor: (item: any) => (
                        <div className="text-xs">
                            <div className="font-medium">{item.stock} {item.unit || 'pcs'}</div>
                            <div className="text-slate-500">{item.location || 'Main'}</div>
                        </div>
                    )},
                    { header: 'Price', accessor: (item: any) => <span className="font-medium">{settings.currencySymbol}{item.price?.toFixed(2)}</span> },
                    { header: 'Supplier', accessor: 'supplier' }
                ];
            case View.CUSTOMERS:
                return [
                    { header: 'Name', accessor: 'name' },
                    { header: 'Phone', accessor: 'phone' },
                    { header: 'Total Spent', accessor: (item: any) => `${settings.currencySymbol}${item.totalPurchases?.toFixed(2) || '0.00'}` },
                    { header: 'Loyalty Pts', accessor: (item: any) => <Badge variant="neutral">{item.loyaltyPoints || 0}</Badge> },
                    { header: 'Last Visit', accessor: 'lastVisit' }
                ];
            case View.INVOICES:
                return [
                    { header: 'Invoice #', accessor: 'id' },
                    { header: 'Customer', accessor: 'customerName' },
                    { header: 'Date', accessor: 'date' },
                    { header: 'Total', accessor: (item: any) => `${settings.currencySymbol}${item.total.toFixed(2)}` },
                    { header: 'Status', accessor: (item: any) => <Badge variant={item.status === 'Paid' ? 'success' : item.status === 'Returned' ? 'danger' : 'warning'}>{item.status}</Badge> }
                ];
            default: return [{ header: 'Name', accessor: 'name' }];
        }
    };

    const addVariant = () => {
        if (!newVariant.name || !newVariant.price) return;
        setTempVariants([...tempVariants, {
            id: Date.now().toString(),
            name: newVariant.name,
            sku: newVariant.sku,
            price: parseFloat(newVariant.price),
            stock: parseInt(newVariant.stock) || 0
        }]);
        setNewVariant({ name: '', sku: '', price: '', stock: '' });
    };

    const updateField = (key: string, value: any) => {
        setFormData((prev: any) => ({...prev, [key]: value}));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title} Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your store's {title.toLowerCase()}.</p>
                </div>
                <div className="flex gap-2">
                    {type === View.PRODUCTS && (
                         <Button variant="secondary" onClick={() => setIsStockAdjOpen(true)} icon={<AlertOctagon size={18} />}>Adjust Stock</Button>
                    )}
                    <Button onClick={() => handleOpenModal()} icon={<Plus size={18} />}>Add New</Button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder={`Search ${title.toLowerCase()}...`} 
                                className="pl-9 bg-white dark:bg-slate-800" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button 
                                variant={showFilters ? "primary" : "secondary"} 
                                icon={<Filter size={16} />} 
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                Filters
                            </Button>
                            
                            <input 
                                type="file" 
                                accept=".csv" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleImportCSV} 
                            />
                            <Button variant="secondary" icon={<Upload size={16} />} title="Import CSV" onClick={() => fileInputRef.current?.click()}>Import</Button>
                            <Button variant="secondary" icon={<Download size={16} />} title="Export CSV" onClick={handleExportCSV}>Export</Button>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex gap-4 items-center animate-in slide-in-from-top-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter By:</span>
                            <div className="w-48">
                                <Select 
                                    options={getFilterOptions().map(o => ({value: o, label: o}))} 
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                />
                            </div>
                            <button onClick={() => {setShowFilters(false); setFilterCategory('All');}} className="text-xs text-slate-500 hover:text-rose-500"><X size={14} /></button>
                        </div>
                    )}
                </div>

                <Table 
                    columns={getColumns()} 
                    data={filteredData} 
                    actions={(item) => (
                        <div className="flex justify-end gap-2">
                             {type === View.PRODUCTS && (
                                 <button onClick={() => handlePrintLabel(item)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 transition-colors" title="Print Label"><Printer size={16} /></button>
                             )}
                             {type === View.INVOICES && item.status !== 'Returned' && (
                                <button onClick={() => handleRefund(item.id)} className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded text-amber-600 transition-colors" title="Refund Invoice"><RotateCcw size={16} /></button>
                             )}
                             <button onClick={() => handleOpenModal(item)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-primary-600 transition-colors"><Edit size={16} /></button>
                             <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded text-rose-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                    )}
                />
            </div>

            <Modal isOpen={isStockAdjOpen} onClose={() => setIsStockAdjOpen(false)} title="Stock Adjustment (Shrinkage)">
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">Record damage, theft, or inventory correction. This will reduce stock.</p>
                    <Select 
                        label="Product" 
                        options={products.map(p => ({value: p.id, label: `${p.name} (Cur: ${p.stock})`}))} 
                        value={adjData.productId}
                        onChange={e => setAdjData({...adjData, productId: e.target.value})}
                    />
                    <Input 
                        label="Quantity to Remove" 
                        type="number" 
                        placeholder="e.g. 5" 
                        value={adjData.quantity} 
                        onChange={e => setAdjData({...adjData, quantity: e.target.value})} 
                    />
                    <Select 
                        label="Reason" 
                        options={[{value:'Damaged', label:'Damaged'}, {value:'Expired', label:'Expired'}, {value:'Theft', label:'Theft'}, {value:'Correction', label:'Correction'}]} 
                        value={adjData.reason}
                        onChange={e => setAdjData({...adjData, reason: e.target.value})}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setIsStockAdjOpen(false)}>Cancel</Button>
                        <Button onClick={submitAdjustment} variant="danger">Confirm Reduction</Button>
                    </div>
                </div>
            </Modal>

            {/* Label Print Modal */}
            <Modal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} title="Print Product Label">
                {labelProduct && (
                    <div className="space-y-6 text-center">
                        <div className="border-2 border-dashed border-slate-300 p-8 rounded-xl bg-white mx-auto w-64">
                            <div className="flex flex-col items-center">
                                <h3 className="font-bold text-lg text-slate-900 mb-1">{labelProduct.name}</h3>
                                <div className="p-2 bg-white">
                                    <QrCode size={120} className="text-slate-900" />
                                </div>
                                <p className="font-mono text-sm text-slate-500 mt-2">{labelProduct.sku}</p>
                                <p className="font-bold text-xl mt-1">{settings.currencySymbol}{labelProduct.price.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4">
                            <Button variant="secondary" onClick={() => setIsLabelModalOpen(false)}>Close</Button>
                            <Button icon={<Printer size={16} />} onClick={() => alert("Sending to label printer...")}>Print Label</Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${formData.id ? 'Edit' : 'Add'} ${title.slice(0, -1)}`}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* --- SUPPLIERS --- */}
                    {type === View.SUPPLIERS && (
                        <>
                            <Input label="Business Name" className="col-span-2" value={formData.businessName || ''} onChange={e => updateField('businessName', e.target.value)} />
                            <Input label="Contact Person" value={formData.name || ''} onChange={e => updateField('name', e.target.value)} />
                            <Input label="Phone" value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)} />
                            <Input label="Email" type="email" value={formData.email || ''} onChange={e => updateField('email', e.target.value)} />
                            <Input label="Opening Balance" type="number" placeholder="0.00" value={formData.balance || ''} onChange={e => updateField('balance', e.target.value)} />
                            <Input label="Address" className="col-span-2" value={formData.address || ''} onChange={e => updateField('address', e.target.value)} />
                        </>
                    )}

                    {/* --- ROLES --- */}
                    {type === View.ROLES && (
                        <>
                            <Input label="Role Name" className="col-span-2" value={formData.name || ''} onChange={e => updateField('name', e.target.value)} />
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Permissions</label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                                    {['Dashboard', 'POS', 'Products', 'Suppliers', 'Purchases', 'Expenses', 'Reports', 'Settings', 'Users'].map(perm => (
                                        <label key={perm} className="flex items-center space-x-2">
                                            <input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                            <span className="text-sm text-slate-700 dark:text-slate-200">{perm} Module</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- EXPENSES --- */}
                    {type === View.EXPENSES && (
                        <>
                            <Input label="Expense Title" className="col-span-2" value={formData.title || ''} onChange={e => updateField('title', e.target.value)} />
                            <Select label="Category" options={[{value:'ops', label:'Operations'}, {value:'rent', label:'Rent'}, {value:'salary', label:'Salary'}]} value={formData.category} onChange={e => updateField('category', e.target.value)} />
                            <Input label="Amount" type="number" value={formData.amount || ''} onChange={e => updateField('amount', e.target.value)} />
                            <div className="col-span-2 mt-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Attachment</label>
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center text-slate-500 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                                    Click to upload receipt
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- PRODUCTS --- */}
                    {type === View.PRODUCTS && (
                         <>
                            <div className="col-span-2 flex justify-center py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 mb-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                                <div className="text-center">
                                    <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                                    <span className="text-xs text-slate-500">Upload Image</span>
                                </div>
                            </div>
                            <Input label="Product Name" className="col-span-2" value={formData.name || ''} onChange={e => updateField('name', e.target.value)} />
                            <div className="relative">
                                <Input label="SKU / Barcode" value={formData.sku || ''} onChange={e => updateField('sku', e.target.value)} />
                                <Barcode className="absolute right-3 top-8 h-5 w-5 text-slate-400" />
                            </div>
                            <Select label="Category" options={[{value: 'Electronics', label: 'Electronics'}, {value: 'Apparel', label: 'Apparel'}, {value: 'Home', label: 'Home'}]} value={formData.category} onChange={e => updateField('category', e.target.value)} />
                            <Input label="Cost Price" type="number" />
                            <Input label="Sale Price" type="number" value={formData.price || ''} onChange={e => updateField('price', e.target.value)} />
                            <Input label="Tax (%)" type="number" placeholder="0" />
                            <Input label="Stock" type="number" value={formData.stock || ''} onChange={e => updateField('stock', e.target.value)} />
                            
                            <div className="col-span-2 border-t border-slate-100 dark:border-slate-700 my-2 pt-2">
                                <label className="flex items-center space-x-2 cursor-pointer select-none mb-2">
                                    <input 
                                        type="checkbox" 
                                        checked={hasVariants} 
                                        onChange={(e) => setHasVariants(e.target.checked)}
                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" 
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Has Variants (Size, Color)</span>
                                </label>
                            </div>

                            {hasVariants && (
                                <div className="col-span-2 space-y-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mt-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Variants</h4>
                                        <Badge variant="neutral">{tempVariants.length} Added</Badge>
                                    </div>
                                    {tempVariants.map(v => (
                                        <div key={v.id} className="flex items-center justify-between bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600 text-sm">
                                            <span className="dark:text-white">{v.name} ({v.sku})</span>
                                            <span className="font-bold dark:text-white">{settings.currencySymbol}{v.price}</span>
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-6 gap-2 items-end bg-white dark:bg-slate-700 p-3 rounded border border-slate-200 dark:border-slate-600">
                                        <div className="col-span-2"><Input placeholder="Name" value={newVariant.name} onChange={e=>setNewVariant({...newVariant, name: e.target.value})} className="h-8 text-sm" /></div>
                                        <div className="col-span-1"><Input placeholder="Price" type="number" value={newVariant.price} onChange={e=>setNewVariant({...newVariant, price: e.target.value})} className="h-8 text-sm" /></div>
                                        <div className="col-span-1"><Input placeholder="Qty" type="number" value={newVariant.stock} onChange={e=>setNewVariant({...newVariant, stock: e.target.value})} className="h-8 text-sm" /></div>
                                        <div className="col-span-2 flex gap-1"><Input placeholder="SKU" value={newVariant.sku} onChange={e=>setNewVariant({...newVariant, sku: e.target.value})} className="h-8 text-sm" /><Button size="sm" onClick={addVariant} icon={<Plus size={16} />} className="h-[34px] w-10 p-0" /></div>
                                    </div>
                                </div>
                            )}
                         </>
                    )}

                    {/* --- USERS --- */}
                    {type === View.USERS && (
                        <>
                            <Input label="Full Name" value={formData.name || ''} onChange={e => updateField('name', e.target.value)} />
                            <Input label="Email" type="email" value={formData.email || ''} onChange={e => updateField('email', e.target.value)} />
                            <Input label="Phone" />
                            <Select label="Role" options={roles.map(r => ({value: r.name, label: r.name}))} value={formData.role} onChange={e => updateField('role', e.target.value)} />
                            <Input label="Password" type="password" />
                            <Select label="Status" options={[{value: 'Active', label: 'Active'}, {value: 'Archived', label: 'Archived'}]} value={formData.status} onChange={e => updateField('status', e.target.value)} />
                        </>
                    )}

                    {/* --- CUSTOMERS --- */}
                    {type === View.CUSTOMERS && (
                        <>
                            <Input label="Full Name" value={formData.name || ''} onChange={e => updateField('name', e.target.value)} />
                            <Input label="Phone" value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)} />
                            <Input label="Email" value={formData.email || ''} onChange={e => updateField('email', e.target.value)} />
                            <Input label="Address" className="col-span-2" value={formData.address || ''} onChange={e => updateField('address', e.target.value)} />
                        </>
                    )}

                 </div>
                 <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                     <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                     <Button onClick={handleSave}>Save Item</Button>
                 </div>
            </Modal>
        </div>
    );
};
