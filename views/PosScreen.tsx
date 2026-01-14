
import React, { useState, useEffect, useMemo } from 'react';
import { Input, Button, Badge, Modal, Select } from '../components/UIComponents';
import { 
    Search, Trash2, Plus, Minus, PauseCircle, CreditCard, ShoppingCart, 
    Tag, RotateCcw, PenTool, Printer, CheckCircle, Truck, Reply, 
    Wallet, Info, ArrowRight, UserPlus, Handshake, X, PlusCircle, LayoutGrid 
} from 'lucide-react';
import { Product, CartItem, HeldOrder, View, Invoice, ReturnItem, PaymentSplit, Catalog, CatalogItem, ProductLot } from '../types';
import { useStore } from '../context/StoreContext';
import { generateInvoicePDF } from '../utils/pdfGenerator';

const CATEGORIES = ['All Items', 'Electronics', 'Apparel', 'Home', 'Beauty', 'Sports'];

interface ActiveCart {
    id: string;
    items: CartItem[];
    customerName: string;
    isWholesale: boolean;
    discount: number;
}

interface PosCartItem extends CartItem {
    lotId?: string;
    lotNumber?: string;
    expiryDate?: string;
}

export const PosScreen: React.FC = () => {
    const { products, catalogs, customers, suppliers, settings, invoices, addItem, processSalesReturn } = useStore();

    // --- Multi-Cart State ---
    const [activeCarts, setActiveCarts] = useState<ActiveCart[]>([
        { id: '1', items: [], customerName: 'Walk-in Customer', isWholesale: false, discount: 0 }
    ]);
    const [activeCartIndex, setActiveCartIndex] = useState(0);

    // Derived current cart data
    const currentCart = activeCarts[activeCartIndex];
    
    // UI Local States
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All Items');
    const [showLotSelector, setShowLotSelector] = useState(false);
    const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
    const [selectedLot, setSelectedLot] = useState<ProductLot | null>(null);
    
    // Modals
    const [showPayment, setShowPayment] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showHeldOrders, setShowHeldOrders] = useState(false);
    const [showReturns, setShowReturns] = useState(false);
    const [showBorrowWizard, setShowBorrowWizard] = useState(false);
    
    // Borrow Wizard State
    const [borrowStep, setBorrowStep] = useState(1);
    const [borrowData, setBorrowData] = useState({
        supplierId: '',
        newSupplierName: '',
        newSupplierPhone: '',
        itemName: '',
        costFromSupplier: '',
        priceToCustomer: '',
        quantity: '1'
    });

    // Payment State
    const [splits, setSplits] = useState<PaymentSplit[]>([]);
    const [currentSplitMethod, setCurrentSplitMethod] = useState<'Cash' | 'Card' | 'Online' | 'Store Credit'>('Cash');
    const [currentSplitAmount, setCurrentSplitAmount] = useState('');

    const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
    const [lastInvoiceId, setLastInvoiceId] = useState('');

    // --- Cart Actions ---
    const updateActiveCart = (updated: Partial<ActiveCart>) => {
        setActiveCarts(prev => prev.map((c, i) => i === activeCartIndex ? { ...c, ...updated } : c));
    };

    const addNewCart = () => {
        const newId = (Math.max(0, ...activeCarts.map(c => parseInt(c.id))) + 1).toString();
        const newCart = { id: newId, items: [], customerName: 'Walk-in Customer', isWholesale: false, discount: 0 };
        setActiveCarts([...activeCarts, newCart]);
        setActiveCartIndex(activeCarts.length);
    };

    const removeCart = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeCarts.length === 1) {
            // Just clear the only cart
            setActiveCarts([{ id: '1', items: [], customerName: 'Walk-in Customer', isWholesale: false, discount: 0 }]);
            return;
        }
        const newCarts = activeCarts.filter((_, i) => i !== index);
        setActiveCarts(newCarts);
        setActiveCartIndex(Math.max(0, activeCartIndex >= index ? activeCartIndex - 1 : activeCartIndex));
    };

    const addToCart = (product: Product) => {
        const existing = currentCart.items.find(p => p.id === product.id);
        let newItems: CartItem[];
        if (existing) {
            newItems = currentCart.items.map(p => p.cartId === existing.cartId ? { ...p, quantity: p.quantity + 1 } : p);
        } else {
            newItems = [...currentCart.items, { ...product, cartId: Date.now().toString(), quantity: 1 }];
        }
        updateActiveCart({ items: newItems });
    };

    const addCatalogItemToCart = (item: CatalogItem, lot: ProductLot) => {
        const newCartItem: PosCartItem = {
            id: item.id,
            cartId: Date.now().toString(),
            name: item.name,
            category: 'Catalog Item',
            price: item.price,
            costPrice: item.costPrice,
            wholesalePrice: item.wholesalePrice,
            stock: item.stock,
            sku: item.sku,
            quantity: 1,
            lotId: lot.id,
            lotNumber: lot.lotNumber,
            expiryDate: lot.expiryDate
        };
        updateActiveCart({ items: [...currentCart.items, newCartItem] });
        setShowLotSelector(false);
        setSelectedLot(null);
        setSelectedCatalogItem(null);
    };

    const updateQuantity = (cartId: string, delta: number) => {
        const newItems = currentCart.items.map(item => item.cartId === cartId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item);
        updateActiveCart({ items: newItems });
    };

    const calculateTotal = () => {
        const subtotal = currentCart.items.reduce((sum, item) => {
            const price = currentCart.isWholesale ? (item.wholesalePrice || item.price) : item.price;
            return sum + (price * item.quantity);
        }, 0);
        const taxRate = settings.taxRate / 100;
        const tax = subtotal * taxRate;
        const total = Math.max(0, subtotal + tax - currentCart.discount);
        return { subtotal, tax, total };
    };

    const { subtotal, tax, total } = calculateTotal();
    const remainingToPay = total - splits.reduce((acc, s) => acc + s.amount, 0);

    // --- Hold / Retrieve Actions ---
    const handleHoldOrder = () => {
        if (currentCart.items.length === 0) return;
        const order: HeldOrder = {
            id: `HOLD-${Date.now()}`,
            customerName: currentCart.customerName,
            items: [...currentCart.items],
            date: new Date(),
            expiration: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hr
            total: total
        };
        setHeldOrders([...heldOrders, order]);
        // Clear current cart but keep it active
        updateActiveCart({ items: [], customerName: 'Walk-in Customer', discount: 0 });
    };

    const retrieveOrder = (order: HeldOrder) => {
        // Instead of replacing current cart, we create a NEW cart for the retrieved order
        const newId = (Math.max(0, ...activeCarts.map(c => parseInt(c.id))) + 1).toString();
        const newCart: ActiveCart = { 
            id: newId, 
            items: order.items, 
            customerName: order.customerName, 
            isWholesale: false, 
            discount: 0 
        };
        setActiveCarts([...activeCarts, newCart]);
        setActiveCartIndex(activeCarts.length);
        
        setHeldOrders(prev => prev.filter(o => o.id !== order.id));
        setShowHeldOrders(false);
    };

    const handleBorrowSubmit = () => {
        let finalSupplierId = borrowData.supplierId;
        if (borrowData.supplierId === 'NEW') {
            finalSupplierId = `S-${Date.now()}`;
            addItem(View.SUPPLIERS, {
                id: finalSupplierId,
                name: borrowData.newSupplierName,
                businessName: borrowData.newSupplierName,
                phone: borrowData.newSupplierPhone,
                email: '',
                address: 'Market Borrowed',
                balance: 0
            });
        }

        const borrowedItem: CartItem = {
            id: `BORROW-${Date.now()}`,
            name: `${borrowData.itemName} (Borrowed)`,
            category: 'Market Borrowed',
            price: Number(borrowData.priceToCustomer),
            costPrice: Number(borrowData.costFromSupplier),
            stock: 999,
            sku: 'EXT-BRW',
            cartId: Date.now().toString(),
            quantity: Number(borrowData.quantity),
            isBorrowed: true,
            borrowedSupplierId: finalSupplierId,
            borrowedCost: Number(borrowData.costFromSupplier)
        };

        updateActiveCart({ items: [...currentCart.items, borrowedItem] });
        setShowBorrowWizard(false);
        setBorrowStep(1);
        setBorrowData({
            supplierId: '',
            newSupplierName: '',
            newSupplierPhone: '',
            itemName: '',
            costFromSupplier: '',
            priceToCustomer: '',
            quantity: '1'
        });
    };

    const addSplit = () => {
        const amt = parseFloat(currentSplitAmount);
        if (isNaN(amt) || amt <= 0 || amt > (remainingToPay + 0.01)) return;
        setSplits([...splits, { method: currentSplitMethod, amount: amt }]);
        setCurrentSplitAmount('');
    };

    const processFinalPayment = () => {
        const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
        setLastInvoiceId(invoiceId);
        const newInvoice: Invoice = {
            id: invoiceId,
            customerName: currentCart.customerName,
            date: new Date().toISOString().split('T')[0],
            total: total,
            status: 'Paid',
            items: currentCart.items,
            paymentMethod: splits.length > 1 ? 'Split' : splits[0]?.method || 'Cash',
            paymentSplits: splits
        };
        addItem(View.INVOICES, newInvoice);
        setShowPayment(false);
        setShowSuccess(true);
    };

    const resetSale = () => {
        setShowSuccess(false);
        setSplits([]);
        // Remove current cart and switch to previous or clear
        if (activeCarts.length > 1) {
            const indexToRemove = activeCartIndex;
            const newCarts = activeCarts.filter((_, i) => i !== indexToRemove);
            setActiveCarts(newCarts);
            setActiveCartIndex(Math.max(0, activeCartIndex - 1));
        } else {
            updateActiveCart({ items: [], customerName: 'Walk-in Customer', discount: 0 });
        }
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-6 animate-in fade-in duration-300">
            {/* Left Side */}
            <div className="flex-1 flex flex-col gap-4">
                {/* Tabs Bar */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {activeCarts.map((cart, idx) => (
                        <div 
                            key={cart.id}
                            onClick={() => setActiveCartIndex(idx)}
                            className={`
                                flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all whitespace-nowrap
                                ${activeCartIndex === idx 
                                    ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/20' 
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'}
                            `}
                        >
                            <ShoppingCart size={14} className={activeCartIndex === idx ? 'text-white' : 'text-slate-400'} />
                            <span className="text-sm font-bold">Cart {cart.id} {cart.items.length > 0 && `(${cart.items.length})`}</span>
                            <button onClick={(e) => removeCart(idx, e)} className={`p-0.5 rounded-full hover:bg-black/10 transition-colors ${activeCartIndex === idx ? 'text-white/70 hover:text-white' : 'text-slate-300 hover:text-slate-500'}`}>
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                    <button 
                        onClick={addNewCart}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-all border border-transparent hover:border-primary-200"
                        title="New Cart"
                    >
                        <PlusCircle size={20} />
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm flex items-center gap-4 border border-slate-200 dark:border-slate-800">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        <Input placeholder="Search products or scan barcode..." className="pl-10 h-11" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setShowBorrowWizard(true)} icon={<Truck size={18} />}>Borrow Item</Button>
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <button onClick={() => updateActiveCart({ isWholesale: false })} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!currentCart.isWholesale ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500'}`}>Retail</button>
                            <button onClick={() => updateActiveCart({ isWholesale: true })} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${currentCart.isWholesale ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500'}`}>Wholesale</button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button 
                        onClick={() => setActiveCategory('All Items')} 
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeCategory === 'All Items' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'}`}
                    >
                        All Items
                    </button>
                    {catalogs.map(cat => (
                        <button 
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.name)} 
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeCategory === cat.name ? 'bg-primary-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <LayoutGrid size={14} /> {cat.name}
                        </button>
                    ))}
                    {CATEGORIES.filter(c => c !== 'All Items').map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat ? 'bg-primary-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'}`}>{cat}</button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                        {/* Catalog Items */}
                        {catalogs.filter(c => activeCategory === 'All Items' || activeCategory === c.name).map(catalog =>
                            catalog.items?.map(item => (
                                <div key={item.id} onClick={() => { setSelectedCatalogItem(item); setShowLotSelector(true); }} className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl shadow-sm border-2 border-blue-200 dark:border-blue-800 overflow-hidden cursor-pointer hover:shadow-md transition-all group relative hover:-translate-y-1">
                                    <div className="h-32 w-full bg-blue-200 dark:bg-blue-900/30 flex items-center justify-center">
                                        <LayoutGrid className="text-blue-400" size={32} />
                                    </div>
                                    <div className="p-3">
                                        <Badge variant="primary" className="mb-2">{catalog.name}</Badge>
                                        <h3 className="font-bold text-slate-800 dark:text-white truncate text-sm">{item.name}</h3>
                                        <p className="text-xs text-slate-500 font-mono">{item.sku}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-blue-600 dark:text-blue-400 font-bold">{settings.currencySymbol}{item.price.toFixed(2)}</span>
                                            <Badge variant="secondary">Lots: {item.lots?.length || 0}</Badge>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Regular Products */}
                        {products.filter(p => (activeCategory === 'All Items' || p.category === activeCategory) && p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                            <div key={product.id} onClick={() => addToCart(product)} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer hover:shadow-md transition-all group relative hover:-translate-y-1">
                                <div className="h-32 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <Tag className="text-slate-300" size={32} />}
                                </div>
                                <div className="p-3">
                                    <h3 className="font-bold text-slate-800 dark:text-white truncate">{product.name}</h3>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-primary-600 font-bold">{settings.currencySymbol}{(currentCart.isWholesale ? (product.wholesalePrice || product.price) : product.price).toFixed(2)}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{product.stock} in stock</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Cart */}
            <div className="w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col h-full flex-shrink-0 relative">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                         <h2 className="font-bold text-lg">Order Summary</h2>
                         <div className="flex gap-1">
                            <button onClick={() => setShowHeldOrders(true)} className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative ${heldOrders.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} title="Parked Orders">
                                <PauseCircle size={20} />
                                {heldOrders.length > 0 && <span className="absolute top-1 right-1 h-3 w-3 bg-amber-500 border-2 border-white rounded-full"></span>}
                            </button>
                            <button onClick={handleHoldOrder} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors" title="Park Current Order">
                                <PlusCircle size={20} />
                            </button>
                         </div>
                    </div>
                    <Select 
                        options={[{value: 'Walk-in Customer', label: 'Walk-in Customer'}, ...customers.map(c => ({value: c.name, label: c.name}))]} 
                        value={currentCart.customerName} 
                        onChange={e => updateActiveCart({ customerName: e.target.value })} 
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {currentCart.items.map(item => {
                        const posItem = item as PosCartItem;
                        const isCatalogItem = !!posItem.lotNumber;
                        return (
                            <div key={item.cartId} className={`flex gap-3 items-start group p-3 rounded-lg border transition-all ${isCatalogItem ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate">{item.name}</h4>
                                        {item.isBorrowed && <Badge variant="warning">Borrowed</Badge>}
                                        {isCatalogItem && <Badge variant="primary" className="text-xs">Catalog</Badge>}
                                    </div>
                                    <p className="text-xs text-slate-500">{settings.currencySymbol}{(currentCart.isWholesale ? (item.wholesalePrice || item.price) : item.price).toFixed(2)} each</p>
                                    {isCatalogItem && (
                                        <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800 space-y-1 text-xs">
                                            <div className="flex gap-4">
                                                <div>
                                                    <span className="text-slate-500">Lot:</span>
                                                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 ml-1">{posItem.lotNumber}</span>
                                                </div>
                                                {posItem.expiryDate && (
                                                    <div>
                                                        <span className="text-slate-500">Expires:</span>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300 ml-1">{new Date(posItem.expiryDate).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                    <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 hover:text-primary-600"><Minus size={14} /></button>
                                    <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 hover:text-primary-600"><Plus size={14} /></button>
                                </div>
                                <button onClick={() => updateActiveCart({ items: currentCart.items.filter(c => c.cartId !== item.cartId) })} className="p-1 text-slate-300 hover:text-rose-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        );
                    })}
                    {currentCart.items.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                            <ShoppingCart size={48} />
                            <p className="mt-4 font-bold uppercase tracking-widest text-sm text-center">No items in Cart {currentCart.id}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl space-y-3">
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-slate-500 text-sm"><span>Subtotal</span><span>{settings.currencySymbol}{subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-slate-500 text-sm"><span>Tax ({settings.taxRate}%)</span><span>{settings.currencySymbol}{tax.toFixed(2)}</span></div>
                        <div className="flex justify-between text-slate-900 dark:text-white font-bold text-xl pt-2 border-t border-slate-200 dark:border-slate-700"><span>Total</span><span>{settings.currencySymbol}{total.toFixed(2)}</span></div>
                    </div>
                    <Button className="w-full h-12 text-lg shadow-xl shadow-primary-500/20" onClick={() => setShowPayment(true)} disabled={currentCart.items.length === 0}>Checkout</Button>
                </div>
            </div>

            {/* Held Orders Modal */}
            <Modal isOpen={showHeldOrders} onClose={() => setShowHeldOrders(false)} title="Parked (Held) Orders">
                <div className="space-y-4">
                    {heldOrders.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <PauseCircle size={48} className="mx-auto mb-4 opacity-10" />
                            <p>No parked orders found.</p>
                        </div>
                    ) : (
                        heldOrders.map(order => (
                            <div key={order.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">{order.customerName}</h4>
                                        <p className="text-xs text-slate-500">{new Date(order.date).toLocaleString()} • {order.items.length} items</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary-600">{settings.currencySymbol}{order.total.toFixed(2)}</p>
                                        <button onClick={() => setHeldOrders(heldOrders.filter(o => o.id !== order.id))} className="text-rose-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                                    </div>
                                </div>
                                <Button className="w-full h-8 text-xs" variant="secondary" onClick={() => retrieveOrder(order)}>Retrieve to New Tab</Button>
                            </div>
                        ))
                    )}
                </div>
            </Modal>

            {/* Borrow Item Wizard */}
            <Modal isOpen={showBorrowWizard} onClose={() => { setShowBorrowWizard(false); setBorrowStep(1); }} title="Borrow Item Wizard">
                <div className="space-y-6">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${borrowStep >= 1 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                        <div className="h-0.5 w-10 bg-slate-200" />
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${borrowStep >= 2 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                    </div>

                    {borrowStep === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            <h3 className="text-lg font-bold flex items-center gap-2"><Truck className="text-primary-600" /> Market Supplier</h3>
                            <Select 
                                label="Existing Supplier" 
                                options={[{value: '', label: 'Select Supplier'}, {value: 'NEW', label: '+ Add New Supplier'}, ...suppliers.map(s => ({value: s.id, label: s.businessName}))]} 
                                value={borrowData.supplierId}
                                onChange={e => setBorrowData({...borrowData, supplierId: e.target.value})}
                            />
                            {borrowData.supplierId === 'NEW' && (
                                <div className="grid grid-cols-2 gap-4 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-800">
                                    <Input label="Business Name" value={borrowData.newSupplierName} onChange={e => setBorrowData({...borrowData, newSupplierName: e.target.value})} />
                                    <Input label="Phone" value={borrowData.newSupplierPhone} onChange={e => setBorrowData({...borrowData, newSupplierPhone: e.target.value})} />
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <Button variant="secondary" onClick={() => setShowBorrowWizard(false)}>Cancel</Button>
                                <Button onClick={() => setBorrowStep(2)} disabled={!borrowData.supplierId} icon={<ArrowRight size={16} />}>Next</Button>
                            </div>
                        </div>
                    )}

                    {borrowStep === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            <h3 className="text-lg font-bold flex items-center gap-2"><Handshake className="text-primary-600" /> Pricing Agreement</h3>
                            <Input label="Item Name" placeholder="Borrowed Product Name" value={borrowData.itemName} onChange={e => setBorrowData({...borrowData, itemName: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Buy Cost" type="number" value={borrowData.costFromSupplier} onChange={e => setBorrowData({...borrowData, costFromSupplier: e.target.value})} />
                                <Input label="Sell Price" type="number" value={borrowData.priceToCustomer} onChange={e => setBorrowData({...borrowData, priceToCustomer: e.target.value})} />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <Button variant="secondary" onClick={() => setBorrowStep(1)}>Back</Button>
                                <Button onClick={handleBorrowSubmit} disabled={!borrowData.itemName || !borrowData.costFromSupplier || !borrowData.priceToCustomer} icon={<CheckCircle size={16} />}>Add</Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Lot Selector Modal */}
            <Modal isOpen={showLotSelector} onClose={() => { setShowLotSelector(false); setSelectedCatalogItem(null); setSelectedLot(null); }} title={`Select Lot - ${selectedCatalogItem?.name}`}>
                <div className="space-y-4">
                    {!selectedCatalogItem ? (
                        <p className="text-slate-500 text-center py-8">No item selected</p>
                    ) : selectedCatalogItem.lots && selectedCatalogItem.lots.length > 0 ? (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-3 gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Lot Number</h4>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Qty Available</h4>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Expiry Date</h4>
                            </div>
                            {selectedCatalogItem.lots.map(lot => (
                                <button
                                    key={lot.id}
                                    onClick={() => setSelectedLot(lot)}
                                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                        selectedLot?.id === lot.id
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
                                    }`}
                                >
                                    <div className="grid grid-cols-3 gap-3 items-center">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{lot.lotNumber}</p>
                                        </div>
                                        <div>
                                            <Badge variant={lot.quantity > 0 ? 'success' : 'warning'}>
                                                {lot.quantity} units
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    {lot.location && <p className="text-xs text-slate-500 mt-2">📍 {lot.location}</p>}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-8">No lots available for this item</p>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="secondary" onClick={() => { setShowLotSelector(false); setSelectedCatalogItem(null); setSelectedLot(null); }}>Cancel</Button>
                        <Button 
                            onClick={() => selectedCatalogItem && selectedLot && addCatalogItemToCart(selectedCatalogItem, selectedLot)}
                            disabled={!selectedLot}
                            icon={<Plus size={16} />}
                        >
                            Add to Cart
                        </Button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Complete Transaction">
                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-6 rounded-2xl text-center">
                        <p className="text-sm opacity-60 uppercase tracking-widest">Balance Due</p>
                        <h2 className="text-4xl font-bold mt-1">{settings.currencySymbol}{remainingToPay.toFixed(2)}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Select 
                            label="Method" 
                            options={[{value: 'Cash', label: 'Cash'}, {value: 'Card', label: 'Card'}, {value: 'Online', label: 'Online Payment'}]} 
                            value={currentSplitMethod}
                            onChange={e => setCurrentSplitMethod(e.target.value as any)}
                        />
                        <div className="flex items-end gap-2">
                            <Input label="Amount" type="number" value={currentSplitAmount} onChange={e => setCurrentSplitAmount(e.target.value)} />
                            <Button onClick={addSplit}>Add</Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {splits.map((s, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2">
                                    <Badge variant="neutral">{s.method}</Badge>
                                    <span className="font-bold">{settings.currencySymbol}{s.amount.toFixed(2)}</span>
                                </div>
                                <button onClick={() => setSplits(splits.filter((_, idx) => idx !== i))} className="text-rose-50"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="secondary" onClick={() => setShowPayment(false)}>Back</Button>
                        <Button onClick={processFinalPayment} disabled={remainingToPay > 0.05}>Finalize</Button>
                    </div>
                </div>
            </Modal>

            {/* Success Modal */}
            <Modal isOpen={showSuccess} onClose={resetSale} title="Transaction Successful">
                <div className="text-center space-y-4 py-6">
                    <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={40} />
                    </div>
                    <h3 className="text-xl font-bold">Payment Received</h3>
                    <div className="flex gap-2">
                        <Button className="flex-1" variant="secondary" icon={<Printer size={18} />} onClick={() => generateInvoicePDF(invoices.find(i => i.id === lastInvoiceId)!, settings)}>Receipt</Button>
                        <Button className="flex-1" onClick={resetSale}>Next Sale</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
