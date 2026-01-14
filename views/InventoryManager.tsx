
import React, { useState, useMemo } from 'react';
import { Button, Input, Table, Modal, Badge, Card, Select } from '../components/UIComponents';
import { Search, Plus, Edit, Trash2, Package, TrendingUp, DollarSign, AlertTriangle, Layers, Filter, Boxes, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { View, Product, ProductVariant, ProductLot } from '../types';
import { CatalogManager } from '../components/CatalogManager';

export const InventoryManager: React.FC = () => {
    const { products, settings, stockAdjustments, addItem, updateItem, deleteItem, addStockAdjustment } = useStore();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [selectedProductForCatalog, setSelectedProductForCatalog] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>({});
    const [activeTab, setActiveTab] = useState<'ALL' | 'LOW' | 'ADJUST'>('ALL');
    const [showVariations, setShowVariations] = useState(false);
    const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({});
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
    const [newLot, setNewLot] = useState<Partial<ProductLot>>({});
    const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());

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
        resetForm();
    };

    const resetForm = () => {
        setFormData({});
        setShowVariations(false);
        setNewVariant({});
        setSelectedVariantId(null);
        setNewLot({});
        setExpandedVariants(new Set());
    };

    const handleAddVariant = () => {
        if (!newVariant.name || !newVariant.sku) {
            alert('Please fill in variant name and SKU');
            return;
        }
        const variant: ProductVariant = {
            id: Date.now().toString(),
            name: newVariant.name,
            sku: newVariant.sku,
            price: newVariant.price || formData.price || 0,
            costPrice: newVariant.costPrice || formData.costPrice || 0,
            stock: newVariant.stock || 0,
            lots: []
        };
        const variants = formData.variants || [];
        setFormData({...formData, variants: [...variants, variant]});
        setNewVariant({});
        setSelectedVariantId(variant.id);
    };

    const handleAddLot = () => {
        const variants = formData.variants || [];
        const selectedVariant = variants.find(v => v.id === selectedVariantId);
        
        if (!selectedVariant || !newLot.lotNumber || newLot.quantity === undefined) {
            alert('Please fill in lot number and quantity');
            return;
        }

        const lot: ProductLot = {
            id: Date.now().toString(),
            lotNumber: newLot.lotNumber,
            quantity: newLot.quantity,
            expiryDate: newLot.expiryDate,
            manufacturingDate: newLot.manufacturingDate,
            costPrice: newLot.costPrice || selectedVariant.costPrice || 0,
            receivedDate: newLot.receivedDate || new Date().toISOString().split('T')[0],
            status: 'Active'
        };

        const updatedVariants = variants.map(v => {
            if (v.id === selectedVariant.id) {
                const lots = v.lots || [];
                const totalQuantity = lots.reduce((acc, l) => acc + l.quantity, 0) + lot.quantity;
                return {
                    ...v,
                    lots: [...lots, lot],
                    stock: totalQuantity
                };
            }
            return v;
        });

        setFormData({...formData, variants: updatedVariants});
        setNewLot({});
    };

    const handleDeleteVariant = (variantId: string) => {
        const variants = (formData.variants || []).filter(v => v.id !== variantId);
        setFormData({...formData, variants});
        if (selectedVariantId === variantId) {
            setSelectedVariantId(null);
        }
    };

    const handleDeleteLot = (lotId: string) => {
        const variants = formData.variants || [];
        const updatedVariants = variants.map(v => {
            if (v.id === selectedVariantId && v.lots) {
                const deletedLot = v.lots.find(l => l.id === lotId);
                const newStock = v.stock - (deletedLot?.quantity || 0);
                return {
                    ...v,
                    lots: v.lots.filter(l => l.id !== lotId),
                    stock: newStock
                };
            }
            return v;
        });
        setFormData({...formData, variants: updatedVariants});
    };

    const handleUpdateLot = (lotId: string, updates: Partial<ProductLot>) => {
        const variants = formData.variants || [];
        const updatedVariants = variants.map(v => {
            if (v.id === selectedVariantId && v.lots) {
                const oldQuantity = v.lots.find(l => l.id === lotId)?.quantity || 0;
                const newQuantity = updates.quantity !== undefined ? updates.quantity : oldQuantity;
                const quantityDiff = newQuantity - oldQuantity;

                return {
                    ...v,
                    lots: v.lots.map(l => l.id === lotId ? { ...l, ...updates } : l),
                    stock: v.stock + quantityDiff
                };
            }
            return v;
        });
        setFormData({...formData, variants: updatedVariants});
    };

    const toggleVariantExpanded = (variantId: string) => {
        const newExpanded = new Set(expandedVariants);
        if (newExpanded.has(variantId)) {
            newExpanded.delete(variantId);
        } else {
            newExpanded.add(variantId);
        }
        setExpandedVariants(newExpanded);
    };

    const handleOpenCatalog = (product: Product) => {
        setSelectedProductForCatalog(product);
        setIsCatalogOpen(true);
    };

    const handleSaveCatalog = (product: Product) => {
        updateItem(View.PRODUCTS, product);
        setIsCatalogOpen(false);
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
                                <button onClick={() => handleOpenCatalog(p)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg" title="Manage Catalog & Variants"><Boxes size={16}/></button>
                                <button onClick={() => { setFormData(p); setIsModalOpen(true); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Edit size={16}/></button>
                                <button onClick={() => deleteItem(View.PRODUCTS, p.id)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                        )}
                    />
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title="Product Master Entry">
                <div className="max-h-[80vh] overflow-y-auto space-y-6">
                    {/* Basic Product Info */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Product Information</h3>
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
                    </div>

                    {/* Variations Section */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Product Variations & Lots</h3>
                            <button 
                                onClick={() => setShowVariations(!showVariations)}
                                className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1"
                            >
                                {showVariations ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {showVariations ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        {showVariations && (
                            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                {/* Add Variant Section */}
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Add Variant</h4>
                                    <Input
                                        label="Variant Name"
                                        placeholder="e.g., Red XL, Size M"
                                        value={newVariant.name || ''}
                                        onChange={e => setNewVariant({ ...newVariant, name: e.target.value })}
                                    />
                                    <Input
                                        label="Variant SKU"
                                        placeholder="Unique SKU"
                                        value={newVariant.sku || ''}
                                        onChange={e => setNewVariant({ ...newVariant, sku: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            label="Price"
                                            type="number"
                                            value={newVariant.price?.toString() || ''}
                                            onChange={e => setNewVariant({ ...newVariant, price: Number(e.target.value) })}
                                        />
                                        <Input
                                            label="Cost Price"
                                            type="number"
                                            value={newVariant.costPrice?.toString() || ''}
                                            onChange={e => setNewVariant({ ...newVariant, costPrice: Number(e.target.value) })}
                                        />
                                    </div>
                                    <Button size="sm" onClick={handleAddVariant}>Add Variant</Button>
                                </div>

                                {/* Variants List */}
                                {formData.variants && formData.variants.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Variants</h4>
                                        {formData.variants.map(variant => (
                                            <div key={variant.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                                <div
                                                    onClick={() => toggleVariantExpanded(variant.id)}
                                                    className={`p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 flex justify-between items-center ${
                                                        selectedVariantId === variant.id ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <button className="p-0">
                                                            {expandedVariants.has(variant.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{variant.name}</p>
                                                            <p className="text-xs text-slate-500 font-mono">{variant.sku}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-slate-500">Stock: <span className="font-bold text-slate-900 dark:text-white">{variant.stock}</span></span>
                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                setSelectedVariantId(variant.id);
                                                            }}
                                                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded text-blue-600"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                handleDeleteVariant(variant.id);
                                                            }}
                                                            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded text-rose-600"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {expandedVariants.has(variant.id) && (
                                                    <div className="border-t border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                                                        <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase">Lot Numbers</h5>

                                                        {/* Add Lot Form */}
                                                        {selectedVariantId === variant.id && (
                                                            <div className="bg-white dark:bg-slate-700 p-3 rounded border border-slate-200 dark:border-slate-600 space-y-2">
                                                                <Input
                                                                    label="Lot Number"
                                                                    placeholder="LOT-2024-001"
                                                                    value={newLot.lotNumber || ''}
                                                                    onChange={e => setNewLot({ ...newLot, lotNumber: e.target.value })}
                                                                    className="text-sm"
                                                                />
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <Input
                                                                        label="Qty"
                                                                        type="number"
                                                                        value={newLot.quantity?.toString() || ''}
                                                                        onChange={e => setNewLot({ ...newLot, quantity: Number(e.target.value) })}
                                                                        className="text-sm"
                                                                    />
                                                                    <Input
                                                                        label="Cost"
                                                                        type="number"
                                                                        value={newLot.costPrice?.toString() || ''}
                                                                        onChange={e => setNewLot({ ...newLot, costPrice: Number(e.target.value) })}
                                                                        className="text-sm"
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <Input
                                                                        label="Mfg Date"
                                                                        type="date"
                                                                        value={newLot.manufacturingDate || ''}
                                                                        onChange={e => setNewLot({ ...newLot, manufacturingDate: e.target.value })}
                                                                        className="text-sm"
                                                                    />
                                                                    <Input
                                                                        label="Exp Date"
                                                                        type="date"
                                                                        value={newLot.expiryDate || ''}
                                                                        onChange={e => setNewLot({ ...newLot, expiryDate: e.target.value })}
                                                                        className="text-sm"
                                                                    />
                                                                </div>
                                                                <Button size="sm" onClick={handleAddLot}>Add Lot</Button>
                                                            </div>
                                                        )}

                                                        {/* Lots Table */}
                                                        {variant.lots && variant.lots.length > 0 ? (
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-xs">
                                                                    <thead>
                                                                        <tr className="border-b border-slate-200 dark:border-slate-600">
                                                                            <th className="text-left py-1 px-2 font-bold">Lot</th>
                                                                            <th className="text-right py-1 px-2 font-bold">Qty</th>
                                                                            <th className="text-center py-1 px-2 font-bold">Exp</th>
                                                                            <th className="text-right py-1 px-2 font-bold">Action</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {variant.lots.map(lot => (
                                                                            <tr key={lot.id} className="border-b border-slate-100 dark:border-slate-700">
                                                                                <td className="py-1 px-2 font-mono text-xs">{lot.lotNumber}</td>
                                                                                <td className="py-1 px-2 text-right font-bold">{lot.quantity}</td>
                                                                                <td className="py-1 px-2 text-center text-xs text-slate-500">
                                                                                    {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString() : 'N/A'}
                                                                                </td>
                                                                                <td className="py-1 px-2 text-right">
                                                                                    <button
                                                                                        onClick={() => handleDeleteLot(lot.id)}
                                                                                        className="text-rose-600 hover:text-rose-700"
                                                                                    >
                                                                                        <Trash2 size={12} />
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-slate-500 text-center py-2">No lots. Click + to add.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end mt-6 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</Button>
                    <Button onClick={handleSave}>Save Item</Button>
                </div>
            </Modal>

            {selectedProductForCatalog && isCatalogOpen && (
                <CatalogManager 
                    product={selectedProductForCatalog} 
                    onSave={handleSaveCatalog}
                    onClose={() => setIsCatalogOpen(false)}
                    settings={settings}
                />
            )}
        </div>
    );
};
