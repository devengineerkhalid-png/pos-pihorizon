
import React, { useState, useRef, useMemo } from 'react';
import { Button, Input, Table, Modal, Badge, Select, Card } from '../components/UIComponents';
import { Plus, Search, Filter, Edit, Trash2, Layers, UploadCloud, Barcode, AlertOctagon, Download, Upload, Printer, AlertTriangle, ArrowRight, History, Package, TrendingUp, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { View, Product, ProductVariant } from '../types';
import { useStore } from '../context/StoreContext';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#6366f1'];

export const InventoryManager: React.FC = () => {
    const { 
        products, suppliers, settings, stockAdjustments,
        addItem, updateItem, deleteItem, addStockAdjustment
    } = useStore();

    const [activeTab, setActiveTab] = useState<'LIST' | 'ADJUSTMENTS' | 'ALERTS'>('LIST');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterSupplier, setFilterSupplier] = useState('All');
    
    // Modal States
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isStockAdjOpen, setIsStockAdjOpen] = useState(false);
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
    
    // Data States
    const [formData, setFormData] = useState<Partial<Product>>({});
    const [labelProduct, setLabelProduct] = useState<Product | null>(null);
    const [adjData, setAdjData] = useState({ productId: '', quantity: '', reason: 'Correction' });

    // Product Variant State
    const [hasVariants, setHasVariants] = useState(false);
    const [tempVariants, setTempVariants] = useState<ProductVariant[]>([]);
    const [newVariant, setNewVariant] = useState({ name: '', sku: '', price: '', stock: '' });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Computed Stats ---
    const stats = useMemo(() => {
        const totalItems = products.length;
        const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
        const totalValue = products.reduce((acc, p) => acc + (p.stock * (p.costPrice || 0)), 0);
        const totalRetailValue = products.reduce((acc, p) => acc + (p.stock * p.price), 0);
        const lowStockItems = products.filter(p => p.stock <= (p.minStockLevel || 10));
        
        // Category Distribution
        const catMap: Record<string, number> = {};
        products.forEach(p => {
            const val = p.stock * (p.costPrice || 0);
            catMap[p.category] = (catMap[p.category] || 0) + val;
        });
        const categoryData = Object.keys(catMap).map(key => ({ name: key, value: catMap[key] }));

        return { totalItems, totalStock, totalValue, totalRetailValue, lowStockItems, categoryData };
    }, [products]);

    // --- Product Handlers ---
    const handleOpenProductModal = (product?: Product) => {
        if (product) {
            setFormData({ ...product });
            setTempVariants(product.variants || []);
            setHasVariants(!!product.variants && product.variants.length > 0);
        } else {
            setFormData({});
            setTempVariants([]);
            setHasVariants(false);
        }
        setIsProductModalOpen(true);
    };

    const handleSaveProduct = () => {
        const productToSave = {
            ...formData,
            stock: Number(formData.stock || 0),
            price: Number(formData.price || 0),
            costPrice: Number(formData.costPrice || 0),
            minStockLevel: Number(formData.minStockLevel || 10),
            variants: hasVariants ? tempVariants : undefined,
            id: formData.id || Date.now().toString()
        };

        if (formData.id) {
            updateItem(View.PRODUCTS, productToSave);
        } else {
            addItem(View.PRODUCTS, productToSave);
        }
        setIsProductModalOpen(false);
    };

    const handleDeleteProduct = (id: string) => {
        if(confirm('Are you sure you want to delete this product?')) {
            deleteItem(View.PRODUCTS, id);
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

    // --- Adjustment Handlers ---
    const openAdjustmentModal = (product?: Product) => {
        if(product) {
            setAdjData({ productId: product.id, quantity: '', reason: 'Correction' });
        } else {
            setAdjData({ productId: '', quantity: '', reason: 'Correction' });
        }
        setIsStockAdjOpen(true);
    };

    const submitAdjustment = () => {
        if(!adjData.productId || !adjData.quantity) return;
        const prod = products.find(p => p.id === adjData.productId);
        if(!prod) return;

        addStockAdjustment({
            productId: adjData.productId,
            productName: prod.name,
            quantity: Number(adjData.quantity), // Can be positive or negative
            reason: adjData.reason as any
        });
        setIsStockAdjOpen(false);
        setAdjData({ productId: '', quantity: '', reason: 'Correction' });
    };

    // --- Export/Import ---
    const handleExport = () => {
        const headers = ['ID', 'Name', 'Category', 'SKU', 'Price', 'Cost', 'Stock', 'Min Stock'];
        const rows = products.map(p => [p.id, `"${p.name}"`, p.category, p.sku, p.price, p.costPrice, p.stock, p.minStockLevel]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // --- Filtering ---
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
        const matchesSupplier = filterSupplier === 'All' || p.supplier === filterSupplier;
        return matchesSearch && matchesCategory && matchesSupplier;
    });

    const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
    const supplierOptions = ['All', ...suppliers.map(s => s.businessName)];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
                    <p className="text-sm text-slate-500">Track stock, manage products, and audit inventory.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleExport} icon={<Download size={16} />}>Export</Button>
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()} icon={<Upload size={16} />}>Import</Button>
                    <input type="file" className="hidden" ref={fileInputRef} accept=".csv" />
                    <Button onClick={() => handleOpenProductModal()} icon={<Plus size={16} />}>Add Product</Button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card className="p-4 border-l-4 border-l-primary-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase">Total Items</p>
                            <h3 className="text-xl font-bold text-slate-900">{stats.totalItems}</h3>
                        </div>
                        <Package className="text-primary-500" size={20} />
                    </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-emerald-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase">Total Value (Cost)</p>
                            <h3 className="text-xl font-bold text-slate-900">{settings.currencySymbol}{stats.totalValue.toLocaleString()}</h3>
                        </div>
                        <div className="text-emerald-500 font-bold">$</div>
                    </div>
                </Card>
                 <Card className="p-4 border-l-4 border-l-indigo-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase">Retail Value</p>
                            <h3 className="text-xl font-bold text-slate-900">{settings.currencySymbol}{stats.totalRetailValue.toLocaleString()}</h3>
                        </div>
                        <TrendingUp className="text-indigo-500" size={20} />
                    </div>
                </Card>
                 <Card className="p-4 border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase">Stock Qty</p>
                            <h3 className="text-xl font-bold text-slate-900">{stats.totalStock}</h3>
                        </div>
                        <Layers className="text-amber-500" size={20} />
                    </div>
                </Card>
                <Card className={`p-4 border-l-4 ${stats.lowStockItems.length > 0 ? 'border-l-rose-500 bg-rose-50' : 'border-l-slate-300'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase">Low Stock</p>
                            <h3 className={`text-xl font-bold ${stats.lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{stats.lowStockItems.length}</h3>
                        </div>
                        <AlertTriangle className={stats.lowStockItems.length > 0 ? 'text-rose-500' : 'text-slate-300'} size={20} />
                    </div>
                </Card>
            </div>

            {/* Content Area with Side Chart */}
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Main Tabbed Content */}
                <div className="flex-1 space-y-4">
                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2">
                        <button 
                            onClick={() => setActiveTab('LIST')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'LIST' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Inventory List
                        </button>
                        <button 
                            onClick={() => setActiveTab('ADJUSTMENTS')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ADJUSTMENTS' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Stock Adjustments
                        </button>
                        <button 
                            onClick={() => setActiveTab('ALERTS')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ALERTS' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Alerts 
                            {stats.lowStockItems.length > 0 && <span className="bg-rose-100 text-rose-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{stats.lowStockItems.length}</span>}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-slate-200 min-h-[500px]">
                        {activeTab === 'LIST' && (
                            <>
                                <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4">
                                    <div className="relative flex-1 min-w-[200px]">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input placeholder="Search name or SKU..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                    </div>
                                    <div className="w-40">
                                        <Select options={categories.map(c => ({value: c, label: c}))} value={filterCategory} onChange={e => setFilterCategory(e.target.value)} />
                                    </div>
                                    <div className="w-40">
                                        <Select options={supplierOptions.map(s => ({value: s, label: s}))} value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} />
                                    </div>
                                    <Button variant="secondary" onClick={() => openAdjustmentModal()} icon={<AlertOctagon size={16} />}>Quick Adjust</Button>
                                </div>

                                <Table 
                                    columns={[
                                        { header: 'Product', accessor: (p: Product) => (
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 bg-slate-100 rounded flex items-center justify-center overflow-hidden border border-slate-200">
                                                    {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <Layers className="text-slate-400" size={16} />}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900 text-sm">{p.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{p.sku}</div>
                                                </div>
                                            </div>
                                        )},
                                        { header: 'Category', accessor: 'category' },
                                        { header: 'Supplier', accessor: (p: Product) => <span className="text-xs text-slate-600">{p.supplier || '-'}</span> },
                                        { header: 'Cost', accessor: (p: Product) => <span className="text-slate-600">{settings.currencySymbol}{(p.costPrice || 0).toFixed(2)}</span> },
                                        { header: 'Price', accessor: (p: Product) => <span className="font-medium text-slate-900">{settings.currencySymbol}{p.price.toFixed(2)}</span> },
                                        { header: 'Stock', accessor: (p: Product) => (
                                            <div className="flex items-center gap-2">
                                                <div className={`h-1.5 w-1.5 rounded-full ${p.stock <= (p.minStockLevel || 10) ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                                <span className={`font-bold text-sm ${p.stock <= (p.minStockLevel || 10) ? 'text-rose-600' : 'text-slate-700'}`}>{p.stock}</span>
                                            </div>
                                        )},
                                        { header: 'Value', accessor: (p: Product) => <span className="text-slate-500 text-xs font-mono">{settings.currencySymbol}{(p.stock * (p.costPrice || 0)).toLocaleString()}</span> }
                                    ]}
                                    data={filteredProducts}
                                    actions={(p) => (
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => openAdjustmentModal(p)} className="p-1.5 hover:bg-amber-50 rounded text-amber-600 transition-colors" title="Adjust Stock"><AlertOctagon size={16}/></button>
                                            <button onClick={() => { setLabelProduct(p); setIsLabelModalOpen(true); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors" title="Print Label"><Printer size={16}/></button>
                                            <button onClick={() => handleOpenProductModal(p)} className="p-1.5 hover:bg-primary-50 rounded text-primary-600 transition-colors"><Edit size={16}/></button>
                                            <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 hover:bg-rose-50 rounded text-rose-500 transition-colors"><Trash2 size={16}/></button>
                                        </div>
                                    )}
                                />
                            </>
                        )}

                        {activeTab === 'ADJUSTMENTS' && (
                            <div className="overflow-hidden">
                                <Table 
                                    columns={[
                                        { header: 'Date', accessor: (a: any) => <span className="text-xs text-slate-600">{new Date(a.date).toLocaleString()}</span> },
                                        { header: 'Product', accessor: 'productName' },
                                        { header: 'Type', accessor: (a: any) => <Badge variant={a.quantity < 0 ? 'danger' : 'success'}>{a.quantity < 0 ? 'Reduction' : 'Addition'}</Badge> },
                                        { header: 'Change', accessor: (a: any) => <span className={`font-bold font-mono ${a.quantity < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{a.quantity > 0 ? '+' : ''}{a.quantity}</span> },
                                        { header: 'Reason', accessor: 'reason' },
                                        { header: 'Value Impact', accessor: (a: any) => <span className="text-xs font-mono">{settings.currencySymbol}{a.costAmount.toFixed(2)}</span> }
                                    ]}
                                    data={stockAdjustments}
                                />
                                {stockAdjustments.length === 0 && <div className="p-12 text-center text-slate-400">No stock adjustments recorded yet.</div>}
                            </div>
                        )}

                        {activeTab === 'ALERTS' && (
                            <div className="p-4">
                                {stats.lowStockItems.length === 0 ? (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-12 text-center">
                                        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Package size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-emerald-800">All Stock Levels Healthy</h3>
                                        <p className="text-emerald-600 mt-1">No items are below their minimum stock level.</p>
                                    </div>
                                ) : (
                                     <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                        <Table 
                                            columns={[
                                                { header: 'Product', accessor: 'name' },
                                                { header: 'SKU', accessor: 'sku' },
                                                { header: 'Supplier', accessor: 'supplier' },
                                                { header: 'Current Stock', accessor: (p: Product) => <span className="text-rose-600 font-bold">{p.stock}</span> },
                                                { header: 'Min Level', accessor: (p: Product) => <span className="text-slate-500">{p.minStockLevel || 10}</span> },
                                                { header: 'Deficit', accessor: (p: Product) => <span className="text-amber-600 font-medium">{(p.minStockLevel || 10) - p.stock} needed</span> }
                                            ]}
                                            data={stats.lowStockItems}
                                            actions={() => (
                                                <Button size="sm" variant="secondary" icon={<ArrowRight size={14} />}>Order</Button>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Visual Analytics */}
                <div className="w-full lg:w-80 space-y-6">
                    <Card title="Value by Category">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(val: number) => `${settings.currencySymbol}${val.toLocaleString()}`} />
                                    <Legend wrapperStyle={{fontSize: '12px'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><DollarSign size={16} /> Inventory Summary</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-indigo-700">Cost Value</span>
                                <span className="font-bold text-indigo-900">{settings.currencySymbol}{stats.totalValue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-indigo-700">Retail Value</span>
                                <span className="font-bold text-indigo-900">{settings.currencySymbol}{stats.totalRetailValue.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-indigo-200 pt-2 flex justify-between">
                                <span className="text-indigo-700">Est. Margin</span>
                                <span className="font-bold text-emerald-600">
                                    {stats.totalRetailValue > 0 
                                        ? Math.round(((stats.totalRetailValue - stats.totalValue) / stats.totalRetailValue) * 100) 
                                        : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={formData.id ? 'Edit Product' : 'New Product'}>
                <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 flex justify-center">
                             <div className="h-24 w-24 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-200">
                                 {formData.image ? <img src={formData.image} className="w-full h-full object-cover rounded-lg" /> : <UploadCloud className="text-slate-400" />}
                             </div>
                        </div>
                        <Input label="Product Name" className="col-span-2" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <Input label="SKU" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} />
                        <Input label="Barcode" value={formData.id ? formData.id : ''} placeholder="Auto-generated" disabled />
                        <div className="col-span-2 grid grid-cols-3 gap-4">
                            <Input label="Cost Price" type="number" value={formData.costPrice || ''} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} />
                            <Input label="Sell Price" type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                            <div className="pt-8 text-xs font-bold text-slate-500">
                                Margin: {formData.price && formData.costPrice ? Math.round(((formData.price - formData.costPrice) / formData.price) * 100) : 0}%
                            </div>
                        </div>
                        <Select label="Category" options={['Electronics', 'Apparel', 'Home', 'Beauty', 'Sports'].map(c => ({value: c, label: c}))} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                        <Select label="Supplier" options={suppliers.map(s => ({value: s.businessName, label: s.businessName}))} value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
                        
                        <div className="col-span-2 p-4 bg-slate-50 rounded-lg border border-slate-200 mt-2">
                            <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2"><Layers size={14}/> Inventory Control</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Current Stock" type="number" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                                <Input label="Low Stock Alert Level" type="number" value={formData.minStockLevel || ''} onChange={e => setFormData({...formData, minStockLevel: Number(e.target.value)})} />
                                <Input label="Location / Shelf" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
                                <Input label="Unit (e.g. pcs, kg)" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} />
                            </div>
                        </div>

                         <div className="col-span-2 border-t border-slate-100 pt-4">
                             <label className="flex items-center space-x-2 cursor-pointer mb-2">
                                <input type="checkbox" checked={hasVariants} onChange={e => setHasVariants(e.target.checked)} className="rounded border-slate-300 text-primary-600" />
                                <span className="font-medium text-sm">Enable Variants</span>
                            </label>
                            {hasVariants && (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                     <div className="space-y-2 mb-3">
                                        {tempVariants.map(v => (
                                            <div key={v.id} className="flex justify-between text-sm bg-white p-2 rounded border border-slate-200">
                                                <span>{v.name} ({v.sku})</span>
                                                <span className="font-mono">${v.price} | Qty: {v.stock}</span>
                                            </div>
                                        ))}
                                     </div>
                                     <div className="grid grid-cols-4 gap-2 items-end">
                                         <Input placeholder="Var Name" className="text-sm" value={newVariant.name} onChange={e => setNewVariant({...newVariant, name: e.target.value})} />
                                         <Input placeholder="Price" type="number" className="text-sm" value={newVariant.price} onChange={e => setNewVariant({...newVariant, price: e.target.value})} />
                                         <Input placeholder="Qty" type="number" className="text-sm" value={newVariant.stock} onChange={e => setNewVariant({...newVariant, stock: e.target.value})} />
                                         <Button size="sm" onClick={addVariant} icon={<Plus size={14} />} />
                                     </div>
                                </div>
                            )}
                         </div>
                     </div>
                     <div className="flex justify-end gap-2 pt-4">
                         <Button variant="secondary" onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
                         <Button onClick={handleSaveProduct}>Save Product</Button>
                     </div>
                </div>
            </Modal>

            <Modal isOpen={isStockAdjOpen} onClose={() => setIsStockAdjOpen(false)} title="Stock Adjustment">
                <div className="space-y-4">
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-2">
                        <p className="text-sm text-amber-800">
                            <strong>Note:</strong> This will manually update the stock level. For purchases, use the Purchase module to track supplier invoices.
                        </p>
                    </div>
                    {/* If pre-selected, show product details, else allow select */}
                    {adjData.productId ? (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                             <div className="h-10 w-10 bg-white rounded flex items-center justify-center border border-slate-200">
                                 <Package className="text-slate-400" size={20} />
                             </div>
                             <div>
                                 <p className="font-bold text-slate-900">{products.find(p => p.id === adjData.productId)?.name}</p>
                                 <p className="text-xs text-slate-500">Current Stock: {products.find(p => p.id === adjData.productId)?.stock}</p>
                             </div>
                        </div>
                    ) : (
                        <Select 
                            label="Select Product" 
                            options={products.map(p => ({value: p.id, label: `${p.name} (Cur: ${p.stock})`}))} 
                            value={adjData.productId}
                            onChange={e => setAdjData({...adjData, productId: e.target.value})}
                        />
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Quantity Change" 
                            type="number" 
                            placeholder="+10 or -5" 
                            value={adjData.quantity} 
                            onChange={e => setAdjData({...adjData, quantity: e.target.value})} 
                        />
                         <Select 
                            label="Reason" 
                            options={[{value:'Correction', label:'Correction (Count)'}, {value:'Damaged', label:'Damaged (Loss)'}, {value:'Theft', label:'Theft (Loss)'}, {value:'Gift', label:'Bonus/Gift (Add)'}]} 
                            value={adjData.reason}
                            onChange={e => setAdjData({...adjData, reason: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setIsStockAdjOpen(false)}>Cancel</Button>
                        <Button onClick={submitAdjustment}>Confirm Adjustment</Button>
                    </div>
                </div>
            </Modal>

             <Modal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} title="Print Product Label">
                {labelProduct && (
                    <div className="space-y-6 text-center">
                        <div className="border-2 border-dashed border-slate-300 p-8 rounded-xl bg-white mx-auto w-64">
                            <div className="flex flex-col items-center">
                                <h3 className="font-bold text-lg text-slate-900 mb-1">{labelProduct.name}</h3>
                                <div className="p-2 bg-white">
                                    <Barcode size={120} className="text-slate-900" />
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
        </div>
    );
};
