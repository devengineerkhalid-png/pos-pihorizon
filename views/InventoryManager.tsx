
import React, { useState, useMemo } from 'react';
import { Button, Input, Table, Modal, Badge, Card, Select } from '../components/UIComponents';
import { Search, Plus, Edit, Trash2, Package, TrendingUp, DollarSign, AlertTriangle, Layers, Filter } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { View, Product } from '../types';

export const InventoryManager: React.FC = () => {
    const { products, settings, stockAdjustments, addItem, updateItem, deleteItem, addStockAdjustment } = useStore();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Product>>({});
    const [activeTab, setActiveTab] = useState<'ALL' | 'LOW' | 'ADJUST'>('ALL');

    const filteredProducts = useMemo(() => {
        return products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
            .filter(p => activeTab === 'LOW' ? p.stock <= (p.minStockLevel || 10) : true);
    }, [products, search, activeTab]);

    const totalValuation = useMemo(() => {
        return products.reduce((acc, p) => acc + (p.stock * (p.costPrice || 0)), 0);
    }, [products]);

    const handleSave = () => {
        const item = { ...formData, id: formData.id || Date.now().toString() };
        formData.id ? updateItem(View.PRODUCTS, item) : addItem(View.PRODUCTS, item);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory & Stock</h1>
                    <p className="text-sm text-slate-500">Real-time valuation: <span className="font-bold text-slate-900 dark:text-white">{settings.currencySymbol}{totalValuation.toLocaleString()}</span></p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setActiveTab('ADJUST')} icon={<Filter size={16}/>}>History</Button>
                    <Button onClick={() => { setFormData({}); setIsModalOpen(true); }} icon={<Plus size={18}/>}>Add Product</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-primary-600 uppercase">Stock Valuation</p>
                            <h3 className="text-2xl font-bold text-primary-700">{settings.currencySymbol}{totalValuation.toLocaleString()}</h3>
                        </div>
                        <DollarSign size={24} className="text-primary-500" />
                    </div>
                </Card>
                <Card onClick={() => setActiveTab('LOW')} className={`cursor-pointer transition-all ${activeTab === 'LOW' ? 'ring-2 ring-rose-500' : ''}`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-rose-500 uppercase">Alerts</p>
                            <h3 className="text-2xl font-bold text-rose-600">{products.filter(p => p.stock <= (p.minStockLevel || 10)).length} Items</h3>
                        </div>
                        <AlertTriangle size={24} className="text-rose-500" />
                    </div>
                </Card>
                <Card>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Units</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{products.reduce((acc, p) => acc + p.stock, 0)}</h3>
                        </div>
                        <Package size={24} className="text-slate-400" />
                    </div>
                </Card>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search SKU or Product..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('ALL')} className={`px-4 py-1.5 text-xs font-bold rounded-md ${activeTab === 'ALL' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500'}`}>All Items</button>
                        <button onClick={() => setActiveTab('LOW')} className={`px-4 py-1.5 text-xs font-bold rounded-md ${activeTab === 'LOW' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-500'}`}>Low Stock</button>
                    </div>
                </div>
                
                {activeTab === 'ADJUST' ? (
                     <Table 
                        columns={[
                            { header: 'Date', accessor: 'date' },
                            { header: 'Product', accessor: 'productName' },
                            { header: 'Reason', accessor: 'reason' },
                            { header: 'Qty', accessor: (a: any) => <span className={a.quantity > 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{a.quantity > 0 ? '+' : ''}{a.quantity}</span> }
                        ]}
                        data={stockAdjustments}
                     />
                ) : (
                    <Table 
                        columns={[
                            { header: 'Product Info', accessor: (p: Product) => (
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                        {p.image ? <img src={p.image} className="w-full h-full object-cover rounded-lg" /> : <Layers size={18} className="text-slate-400" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</p>
                                        <p className="text-[10px] font-mono text-slate-500 uppercase">{p.sku}</p>
                                    </div>
                                </div>
                            )},
                            { header: 'Category', accessor: 'category' },
                            { header: 'Stock', accessor: (p: Product) => (
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${p.stock <= (p.minStockLevel || 10) ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{p.stock}</span>
                                    {p.stock <= (p.minStockLevel || 10) && <Badge variant="warning">Low</Badge>}
                                </div>
                            )},
                            { header: 'Cost', accessor: (p: Product) => `${settings.currencySymbol}${p.costPrice?.toFixed(2) || '0.00'}` },
                            { header: 'Retail', accessor: (p: Product) => <span className="font-bold text-primary-600">{settings.currencySymbol}{p.price.toFixed(2)}</span> },
                            { header: 'Valuation', accessor: (p: Product) => <span className="text-xs font-mono text-slate-500">{settings.currencySymbol}{(p.stock * (p.costPrice || 0)).toFixed(2)}</span> }
                        ]}
                        data={filteredProducts}
                        actions={(p) => (
                            <div className="flex gap-1 justify-end">
                                <button onClick={() => { setFormData(p); setIsModalOpen(true); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Edit size={16}/></button>
                                <button onClick={() => deleteItem(View.PRODUCTS, p.id)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                        )}
                    />
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Product Master Entry">
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Name" className="col-span-2" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <Input label="SKU / Barcode" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} />
                    <Select label="Category" options={['Electronics', 'Apparel', 'Home', 'Beauty', 'Sports'].map(c => ({value: c, label: c}))} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                    <Input label="Cost Price" type="number" value={formData.costPrice || ''} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} />
                    <Input label="Retail Price" type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    <Input label="Wholesale Price" type="number" value={formData.wholesalePrice || ''} onChange={e => setFormData({...formData, wholesalePrice: Number(e.target.value)})} />
                    <Input label="Initial Stock" type="number" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                    <Input label="Min Alert Level" type="number" value={formData.minStockLevel || ''} onChange={e => setFormData({...formData, minStockLevel: Number(e.target.value)})} />
                </div>
                <div className="flex justify-end mt-6 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Item</Button>
                </div>
            </Modal>
        </div>
    );
};
