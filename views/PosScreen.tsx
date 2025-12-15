
import React, { useState, useEffect } from 'react';
import { Input, Button, Badge, Modal, Select } from '../components/UIComponents';
import { Search, Trash2, Plus, Minus, User, PauseCircle, CreditCard, ShoppingCart, Layers, Tag, RotateCcw, PenTool, Badge as BadgeIcon, Printer, CheckCircle, ArrowRight, Truck, Clock, AlertCircle, PlusCircle, UserPlus, Gift, FileText, Reply } from 'lucide-react';
import { Product, CartItem, ProductVariant, HeldOrder, View, Invoice, ReturnItem } from '../types';
import { useStore } from '../context/StoreContext';
import { formatDistanceToNow } from 'date-fns';
import { generateInvoicePDF } from '../utils/pdfGenerator';

const CATEGORIES = ['All Items', 'Electronics', 'Apparel', 'Home', 'Beauty', 'Sports', 'Toys'];

export const PosScreen: React.FC = () => {
    const { products, customers, suppliers, addItem, settings, invoices, processSalesReturn } = useStore();

    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All Items');
    
    // Modals
    const [showPayment, setShowPayment] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showDiscount, setShowDiscount] = useState(false);
    const [showHeldOrders, setShowHeldOrders] = useState(false);
    const [showCustomItem, setShowCustomItem] = useState(false);
    const [showBorrowItem, setShowBorrowItem] = useState(false);
    const [showHoldDuration, setShowHoldDuration] = useState(false);
    
    // Return Modal State
    const [showReturns, setShowReturns] = useState(false);
    const [returnSearch, setReturnSearch] = useState('');
    const [foundInvoice, setFoundInvoice] = useState<Invoice | null>(null);
    const [returnSelection, setReturnSelection] = useState<ReturnItem[]>([]);
    
    // State
    const [cartDiscount, setCartDiscount] = useState(0); 
    const [selectedCustomer, setSelectedCustomer] = useState('Walk-in Customer');
    const [selectedSalesman, setSelectedSalesman] = useState('Admin');
    const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
    const [lastInvoiceId, setLastInvoiceId] = useState('');

    // Loyalty State
    const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
    const [pointsRedeemed, setPointsRedeemed] = useState(0);

    // Custom Item State
    const [customItem, setCustomItem] = useState({ name: '', price: '' });

    // Borrow Item State
    const [borrowStep, setBorrowStep] = useState(1);
    const [borrowItem, setBorrowItem] = useState({ name: '', price: '', cost: '', supplierId: '' });
    const [isNewSupplier, setIsNewSupplier] = useState(false);
    const [newSupplierData, setNewSupplierData] = useState({ name: '', phone: '' });

    // Variant Selection State
    const [variantModalOpen, setVariantModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Refresh time for expiry check
    const [, setTick] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setTick(t => t+1), 60000); // Update every min
        return () => clearInterval(timer);
    }, []);

    // Derived Loyalty Data
    const currentCustomerObj = customers.find(c => c.name === selectedCustomer);
    const availablePoints = currentCustomerObj?.loyaltyPoints || 0;
    // Simple Rule: 100 points = $10 discount (10 points = $1)
    const maxRedeemableCash = Math.floor(availablePoints / 10); 

    const handleProductClick = (product: Product) => {
        if (product.variants && product.variants.length > 0) {
            setSelectedProduct(product);
            setVariantModalOpen(true);
        } else {
            addToCart(product);
        }
    };

    const addCustomItem = () => {
        if(!customItem.name || !customItem.price) return;
        const newItem: CartItem = {
            id: `custom-${Date.now()}`,
            name: customItem.name,
            price: parseFloat(customItem.price),
            category: 'Custom',
            sku: 'CUSTOM',
            stock: 999,
            cartId: Date.now().toString(),
            quantity: 1,
            isCustom: true
        };
        setCart([...cart, newItem]);
        setShowCustomItem(false);
        setCustomItem({ name: '', price: '' });
    };

    const resetBorrow = () => {
        setBorrowItem({ name: '', price: '', cost: '', supplierId: '' });
        setBorrowStep(1);
        setShowBorrowItem(false);
        setIsNewSupplier(false);
        setNewSupplierData({ name: '', phone: '' });
    };

    const addBorrowItem = () => {
        // Validation handled in steps, but double check
        if(!borrowItem.name || !borrowItem.price || (!borrowItem.supplierId && !isNewSupplier)) return;

        let finalSupplierId = borrowItem.supplierId;

        // Create Supplier if New
        if (isNewSupplier) {
            finalSupplierId = `s-${Date.now()}`;
            addItem(View.SUPPLIERS, {
                id: finalSupplierId,
                name: newSupplierData.name,
                businessName: newSupplierData.name,
                phone: newSupplierData.phone,
                email: '',
                address: 'Added via POS',
                balance: 0
            });
        }

        const newItem: CartItem = {
            id: `borrow-${Date.now()}`,
            name: `${borrowItem.name} (Borrowed)`,
            price: parseFloat(borrowItem.price),
            category: 'Borrowed',
            sku: 'EXT-ITEM',
            stock: 1,
            cartId: Date.now().toString(),
            quantity: 1,
            isBorrowed: true,
            borrowedSupplierId: finalSupplierId,
            borrowedCost: parseFloat(borrowItem.cost) || 0
        };
        setCart([...cart, newItem]);
        resetBorrow();
    };

    const addToCart = (product: Product, variant?: ProductVariant) => {
        setCart(prev => {
            const existing = prev.find(p => 
                p.id === product.id && 
                ((!variant && !p.variantId) || (variant && p.variantId === variant.id))
            );

            if (existing) {
                return prev.map(p => 
                    (p.cartId === existing.cartId) ? { ...p, quantity: p.quantity + 1 } : p
                );
            }

            return [...prev, { 
                ...product, 
                price: variant ? variant.price : product.price,
                sku: variant ? variant.sku : product.sku,
                cartId: Date.now().toString(), 
                quantity: 1,
                variantId: variant?.id,
                variantName: variant?.name,
                itemDiscount: 0
            }];
        });
        
        if (variantModalOpen) {
            setVariantModalOpen(false);
            setSelectedProduct(null);
        }
    };

    const updateQuantity = (cartId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.cartId === cartId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (cartId: string) => {
        setCart(prev => prev.filter(item => item.cartId !== cartId));
    };

    const createHoldOrder = (durationHours: number) => {
        if(cart.length === 0) return;
        
        const now = new Date();
        const expiry = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

        const order: HeldOrder = {
            id: Date.now().toString(),
            customerName: selectedCustomer,
            items: [...cart],
            date: now,
            expiration: expiry,
            total: calculateTotal().total
        };
        setHeldOrders([...heldOrders, order]);
        setCart([]);
        setCartDiscount(0);
        setShowHoldDuration(false);
    };

    const retrieveOrder = (order: HeldOrder) => {
        setCart(order.items);
        setSelectedCustomer(order.customerName);
        setHeldOrders(prev => prev.filter(o => o.id !== order.id));
        setShowHeldOrders(false);
    };
    
    const deleteHeldOrder = (id: string) => {
         setHeldOrders(prev => prev.filter(o => o.id !== id));
    };

    const calculateTotal = () => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const taxRate = settings.taxRate / 100;
        const tax = subtotal * taxRate;
        let total = subtotal + tax - cartDiscount;

        // Apply Loyalty Discount if active
        let loyaltyDiscount = 0;
        if (useLoyaltyPoints) {
            // Can't redeem more than the total
            const applicableRedemption = Math.min(total, maxRedeemableCash);
            loyaltyDiscount = applicableRedemption;
            total = total - loyaltyDiscount;
        }

        total = Math.max(0, total);
        return { subtotal, tax, total, loyaltyDiscount };
    };

    const { subtotal, tax, total, loyaltyDiscount } = calculateTotal();

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'All Items' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const processPayment = (method: string) => {
        const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
        setLastInvoiceId(invoiceId);

        const newInvoice = {
            id: invoiceId,
            customerName: selectedCustomer,
            date: new Date().toISOString().split('T')[0],
            total: total,
            status: 'Paid',
            items: cart,
            paymentMethod: method,
            loyaltyPointsUsed: useLoyaltyPoints ? (loyaltyDiscount * 10) : 0,
            loyaltyPointsEarned: Math.floor(total) // 1 point per $1
        };

        addItem(View.INVOICES, newInvoice);
        
        setShowPayment(false);
        setShowSuccess(true);
    };

    const resetSale = () => {
        setShowSuccess(false);
        setCart([]);
        setCartDiscount(0);
        setUseLoyaltyPoints(false);
        setSelectedCustomer('Walk-in Customer');
    };

    const handlePrintReceipt = () => {
        const invoice = invoices.find(i => i.id === lastInvoiceId);
        if (invoice) {
            generateInvoicePDF(invoice, settings);
        } else {
            alert('Error: Invoice data not found.');
        }
    };

    // Return Logic
    const handleSearchInvoice = () => {
        const invoice = invoices.find(i => i.id.toLowerCase() === returnSearch.toLowerCase());
        if(invoice) {
            setFoundInvoice(invoice);
            // Initialize return selection with 0 qty
            const initItems = invoice.items?.map(item => ({
                productId: item.id,
                productName: item.name,
                quantity: 0,
                reason: 'Defective',
                refundAmount: 0
            })) || [];
            setReturnSelection(initItems);
        } else {
            alert("Invoice not found");
            setFoundInvoice(null);
        }
    };

    const updateReturnQty = (itemId: string, qty: number) => {
        if(!foundInvoice) return;
        const originalItem = foundInvoice.items?.find(i => i.id === itemId);
        if(!originalItem) return;

        // Max returnable = Original Qty - Already Returned Qty
        const maxReturn = originalItem.quantity - (originalItem.returnedQuantity || 0);
        const validQty = Math.min(Math.max(0, qty), maxReturn);

        setReturnSelection(prev => prev.map(item => {
            if (item.productId === itemId) {
                return { 
                    ...item, 
                    quantity: validQty,
                    refundAmount: validQty * originalItem.price // Simple refund calc
                };
            }
            return item;
        }));
    };

    const submitReturn = () => {
        if(!foundInvoice) return;
        const itemsToReturn = returnSelection.filter(i => i.quantity > 0);
        if(itemsToReturn.length === 0) return;

        processSalesReturn(foundInvoice.id, itemsToReturn);
        alert("Refund processed successfully.");
        setShowReturns(false);
        setFoundInvoice(null);
        setReturnSearch('');
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-6">
            {/* Left Side - Product Catalog */}
            <div className="flex-1 flex flex-col gap-4">
                {/* Search Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        <Input 
                            placeholder="Scan barcode or search products..." 
                            className="pl-10" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                         <Button 
                            variant={heldOrders.length > 0 ? 'secondary' : 'outline'} 
                            className={`relative ${heldOrders.length > 0 ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : ''}`}
                            onClick={() => setShowHeldOrders(true)} 
                            icon={<PauseCircle size={16} />}
                         >
                            Held Orders
                            {heldOrders.length > 0 && (
                                <span className="absolute -top-2 -right-2 h-5 w-5 bg-amber-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold shadow-sm">
                                    {heldOrders.length}
                                </span>
                            )}
                         </Button>
                         <Button variant="outline" onClick={() => setShowCustomItem(true)} icon={<PenTool size={16} />}>Custom</Button>
                         <Button variant="outline" onClick={() => setShowBorrowItem(true)} icon={<Truck size={16} />}>Borrow</Button>
                         <Button variant="danger" className="bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100" onClick={() => setShowReturns(true)} icon={<Reply size={16} />}>Returns</Button>
                    </div>
                </div>

                {/* Categories Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {CATEGORIES.map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm whitespace-nowrap ${
                                activeCategory === cat 
                                ? 'bg-primary-600 text-white shadow-primary-500/30' 
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                        {filteredProducts.map(product => (
                            <div 
                                key={product.id} 
                                onClick={() => handleProductClick(product)}
                                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md transition-all group relative hover:-translate-y-1"
                            >
                                <div className="h-32 w-full bg-slate-100 relative">
                                    <img src={product.image || 'https://via.placeholder.com/200'} alt={product.name} className="w-full h-full object-cover" />
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-primary-600 shadow-sm">
                                        {product.variants ? 'From ' : ''}{settings.currencySymbol}{product.price.toFixed(2)}
                                    </div>
                                    {product.variants && (
                                        <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold text-white flex items-center shadow-sm">
                                            <Layers size={10} className="mr-1" />
                                            {product.variants.length} Options
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <h3 className="font-medium text-slate-800 truncate">{product.name}</h3>
                                    <div className="flex justify-between items-center mt-1">
                                         <p className="text-xs text-slate-500">{product.category}</p>
                                         <p className={`text-xs font-medium ${product.stock < 10 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                            {product.stock} in stock
                                         </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Cart */}
            <div className="w-96 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-full flex-shrink-0">
                
                {/* Header: Customer & Salesman */}
                <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50 rounded-t-xl">
                    <div className="flex items-center justify-between">
                         <h2 className="font-bold text-slate-800">Order #{Date.now().toString().slice(-4)}</h2>
                         <Badge variant="warning">Walk-in</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer hover:border-primary-300 transition-colors shadow-sm group">
                            <div className="bg-primary-100 p-1.5 rounded-full text-primary-600"><User size={14} /></div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[10px] text-slate-500">Customer</p>
                                <select 
                                    className="text-xs font-medium text-slate-900 bg-transparent outline-none w-full cursor-pointer" 
                                    value={selectedCustomer}
                                    onChange={(e) => { setSelectedCustomer(e.target.value); setUseLoyaltyPoints(false); }}
                                >
                                    <option>Walk-in Customer</option>
                                    {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer hover:border-primary-300 transition-colors shadow-sm group">
                             <div className="bg-indigo-100 p-1.5 rounded-full text-indigo-600"><BadgeIcon size={14} /></div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[10px] text-slate-500">Salesman</p>
                                <select 
                                    className="text-xs font-medium text-slate-900 bg-transparent outline-none w-full cursor-pointer" 
                                    value={selectedSalesman}
                                    onChange={(e) => setSelectedSalesman(e.target.value)}
                                >
                                    <option>Admin</option>
                                    <option>John Doe</option>
                                    <option>Jane Smith</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    {/* Loyalty Banner */}
                    {selectedCustomer !== 'Walk-in Customer' && (
                         <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
                             <div className="flex items-center gap-2 text-indigo-700">
                                 <Gift size={14} />
                                 <span className="text-xs font-bold">{availablePoints} Points</span>
                             </div>
                             {availablePoints >= 10 && (
                                 <button 
                                     onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}
                                     className={`text-xs px-2 py-0.5 rounded border transition-colors ${useLoyaltyPoints ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-100'}`}
                                 >
                                     {useLoyaltyPoints ? 'Remove' : 'Redeem'}
                                 </button>
                             )}
                         </div>
                    )}
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                            <ShoppingCart className="h-16 w-16 mb-4 opacity-50" />
                            <p className="text-sm font-medium">Cart is empty</p>
                            <p className="text-xs mt-1">Select products to start sale</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.cartId} className="flex gap-3 group">
                                <div className="h-14 w-14 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center relative">
                                    {item.isCustom ? <PenTool className="text-slate-400" size={20} /> : 
                                     item.isBorrowed ? <Truck className="text-blue-500" size={20} /> :
                                     <img src={item.image} className="w-full h-full object-cover" />}
                                     
                                     {item.isBorrowed && (
                                         <div className="absolute top-0 right-0 bg-blue-500 h-3 w-3 rounded-bl-lg"></div>
                                     )}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0 pr-2">
                                            <h4 className="font-medium text-slate-900 text-sm line-clamp-1">{item.name}</h4>
                                            {item.variantName && (
                                                <div className="flex items-center mt-0.5">
                                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium border border-slate-200">
                                                        {item.variantName}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => removeFromCart(item.cartId)} className="text-slate-300 hover:text-rose-500 flex-shrink-0 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="flex justify-between items-end mt-1">
                                        <div className="flex items-center border border-slate-200 rounded-md bg-slate-50">
                                            <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 hover:bg-slate-200 rounded-l-md text-slate-600"><Minus size={12} /></button>
                                            <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 hover:bg-slate-200 rounded-r-md text-slate-600"><Plus size={12} /></button>
                                        </div>
                                        <span className="font-bold text-slate-800 text-sm">{settings.currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer: Totals & Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur rounded-b-xl space-y-3 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
                    <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>{settings.currencySymbol}{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Tax ({settings.taxRate}%)</span>
                            <span>{settings.currencySymbol}{tax.toFixed(2)}</span>
                        </div>
                        {cartDiscount > 0 && (
                            <div className="flex justify-between text-emerald-600 font-medium">
                                <span>Discount</span>
                                <span>-{settings.currencySymbol}{cartDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        {loyaltyDiscount > 0 && (
                            <div className="flex justify-between text-indigo-600 font-medium">
                                <div className="flex items-center gap-1"><Gift size={12} /> Points Redeemed</div>
                                <span>-{settings.currencySymbol}{loyaltyDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-slate-900 font-bold text-lg pt-3 border-t border-slate-200 mt-2">
                            <span>Total Payable</span>
                            <span>{settings.currencySymbol}{total.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 pt-1">
                        <Button 
                            variant="secondary" 
                            className="text-xs flex-col py-2 h-auto gap-1 border-dashed border-slate-300 text-slate-500 hover:text-primary-600 hover:border-primary-300" 
                            icon={<Tag size={16} />}
                            onClick={() => setShowDiscount(true)}
                        >
                            Disc
                        </Button>
                        <Button 
                            variant="secondary" 
                            className="text-xs flex-col py-2 h-auto gap-1 border-dashed border-slate-300 text-slate-500 hover:text-amber-600 hover:border-amber-300" 
                            icon={<Clock size={16} />}
                            onClick={() => setShowHoldDuration(true)}
                        >
                            Hold
                        </Button>
                        <Button 
                            variant="danger" 
                            className="text-xs flex-col py-2 h-auto gap-1 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 shadow-none" 
                            onClick={() => { setCart([]); setCartDiscount(0); setUseLoyaltyPoints(false); }} 
                            icon={<Trash2 size={16} />}
                        >
                            Clear
                        </Button>
                        <div className="col-span-1"></div>
                    </div>
                    
                    <Button 
                        size="lg" 
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 active:scale-[0.99] transition-all"
                        onClick={() => setShowPayment(true)}
                        disabled={cart.length === 0}
                    >
                        <div className="flex justify-between w-full items-center px-2">
                            <span className="font-semibold">Checkout</span>
                            <span className="bg-white/10 px-2 py-1 rounded text-sm font-mono">{settings.currencySymbol}{total.toFixed(2)}</span>
                        </div>
                    </Button>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={variantModalOpen} onClose={() => setVariantModalOpen(false)} title="Select Product Option">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                        <div className="h-20 w-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                             {selectedProduct?.image && <img src={selectedProduct.image} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">{selectedProduct?.name}</h3>
                            <div className="flex gap-2 mt-1">
                                <Badge variant="neutral">{selectedProduct?.category}</Badge>
                                <span className="text-sm text-slate-500 self-center">{selectedProduct?.sku}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {selectedProduct?.variants?.map(variant => (
                            <button 
                                key={variant.id}
                                onClick={() => addToCart(selectedProduct, variant)}
                                className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group text-left shadow-sm"
                            >
                                <div>
                                    <p className="font-bold text-slate-900 group-hover:text-primary-700">{variant.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 font-mono">SKU: {variant.sku}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-slate-900 group-hover:text-primary-700">{settings.currencySymbol}{variant.price}</p>
                                    <p className={`text-xs font-medium ${variant.stock < 5 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                        {variant.stock} available
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showCustomItem} onClose={() => setShowCustomItem(false)} title="Add Custom Item">
                <div className="space-y-4">
                    <Input label="Item Name" placeholder="e.g. Special Service" value={customItem.name} onChange={e => setCustomItem({...customItem, name: e.target.value})} />
                    <Input label="Price" type="number" placeholder="0.00" value={customItem.price} onChange={e => setCustomItem({...customItem, price: e.target.value})} />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setShowCustomItem(false)}>Cancel</Button>
                        <Button onClick={addCustomItem}>Add to Cart</Button>
                    </div>
                </div>
            </Modal>
            
            {/* STEP-BY-STEP BORROW MODAL */}
            <Modal isOpen={showBorrowItem} onClose={resetBorrow} title="Borrow Item Wizard">
                <div className="space-y-4">
                    <div className="flex gap-2 mb-4">
                         <div className={`h-1 flex-1 rounded-full ${borrowStep >= 1 ? 'bg-primary-600' : 'bg-slate-200'}`}></div>
                         <div className={`h-1 flex-1 rounded-full ${borrowStep >= 2 ? 'bg-primary-600' : 'bg-slate-200'}`}></div>
                         <div className={`h-1 flex-1 rounded-full ${borrowStep >= 3 ? 'bg-primary-600' : 'bg-slate-200'}`}></div>
                    </div>

                    {borrowStep === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <h3 className="text-lg font-bold">Step 1: Select Supplier</h3>
                            
                            <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                                <button 
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isNewSupplier ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                    onClick={() => setIsNewSupplier(false)}
                                >
                                    Existing List
                                </button>
                                <button 
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isNewSupplier ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                    onClick={() => setIsNewSupplier(true)}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <PlusCircle size={14} /> New Supplier
                                    </div>
                                </button>
                            </div>

                            {!isNewSupplier ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-slate-500">Select from your existing supplier database.</p>
                                    <Select 
                                        label="Existing Supplier" 
                                        options={suppliers.map(s => ({value: s.id, label: s.businessName}))}
                                        value={borrowItem.supplierId}
                                        onChange={e => setBorrowItem({...borrowItem, supplierId: e.target.value})}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-2 text-primary-600 mb-1">
                                        <UserPlus size={18} />
                                        <h4 className="font-semibold text-sm">New Supplier Details</h4>
                                    </div>
                                    <Input 
                                        label="Business Name" 
                                        placeholder="e.g. Quick Mart Wholesale" 
                                        value={newSupplierData.name}
                                        onChange={e => setNewSupplierData({...newSupplierData, name: e.target.value})}
                                    />
                                    <Input 
                                        label="Phone Number (Optional)" 
                                        placeholder="e.g. 555-0123" 
                                        value={newSupplierData.phone}
                                        onChange={e => setNewSupplierData({...newSupplierData, phone: e.target.value})}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button 
                                    onClick={() => setBorrowStep(2)} 
                                    disabled={(!isNewSupplier && !borrowItem.supplierId) || (isNewSupplier && !newSupplierData.name)}
                                >
                                    Next Step
                                </Button>
                            </div>
                        </div>
                    )}

                    {borrowStep === 2 && (
                         <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <h3 className="text-lg font-bold">Step 2: Item Details</h3>
                            <p className="text-sm text-slate-500">Define the cost (what you owe) and the price (what you sell for).</p>
                            <Input label="Item Name" placeholder="e.g. Special Order Item" value={borrowItem.name} onChange={e => setBorrowItem({...borrowItem, name: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Cost (Owed to Supplier)" type="number" value={borrowItem.cost} onChange={e => setBorrowItem({...borrowItem, cost: e.target.value})} />
                                <Input label="Sale Price (Customer)" type="number" value={borrowItem.price} onChange={e => setBorrowItem({...borrowItem, price: e.target.value})} />
                            </div>
                            <div className="flex justify-between pt-4">
                                <Button variant="secondary" onClick={() => setBorrowStep(1)}>Back</Button>
                                <Button onClick={() => (borrowItem.name && borrowItem.price && borrowItem.cost) && setBorrowStep(3)} disabled={!borrowItem.name || !borrowItem.price || !borrowItem.cost}>Review</Button>
                            </div>
                         </div>
                    )}

                    {borrowStep === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <h3 className="text-lg font-bold">Step 3: Confirm</h3>
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex gap-3">
                                <AlertCircle className="text-amber-600 shrink-0" size={24} />
                                <div className="text-sm text-amber-800">
                                    <p className="font-bold">Ledger Impact</p>
                                    <ul className="list-disc pl-4 mt-1 space-y-1">
                                        <li>An <strong>Auto-Purchase</strong> invoice will be generated.</li>
                                        <li>You will owe <strong>${borrowItem.cost}</strong> to {isNewSupplier ? newSupplierData.name : 'Selected Supplier'}.</li>
                                        {isNewSupplier && <li><strong>{newSupplierData.name}</strong> will be added to your Supplier database.</li>}
                                    </ul>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded border border-slate-200 text-sm">
                                <div className="flex justify-between mb-1"><span>Item:</span> <span className="font-medium">{borrowItem.name}</span></div>
                                <div className="flex justify-between mb-1"><span>Sell Price:</span> <span className="font-bold text-emerald-600">${borrowItem.price}</span></div>
                                <div className="flex justify-between"><span>Supplier Cost:</span> <span className="font-bold text-rose-600">${borrowItem.cost}</span></div>
                            </div>
                            <div className="flex justify-between pt-4">
                                <Button variant="secondary" onClick={() => setBorrowStep(2)}>Back</Button>
                                <Button onClick={addBorrowItem}>Confirm & Add to Cart</Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <Modal isOpen={showHoldDuration} onClose={() => setShowHoldDuration(false)} title="Create Proforma / Hold">
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">Create a temporary invoice. This will not affect stock until paid. Select how long to hold this order.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => createHoldOrder(1)} className="p-4 border border-slate-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all font-medium text-slate-700">1 Hour</button>
                        <button onClick={() => createHoldOrder(4)} className="p-4 border border-slate-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all font-medium text-slate-700">4 Hours</button>
                        <button onClick={() => createHoldOrder(24)} className="p-4 border border-slate-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all font-medium text-slate-700">1 Day</button>
                        <button onClick={() => createHoldOrder(48)} className="p-4 border border-slate-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all font-medium text-slate-700">2 Days</button>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setShowHoldDuration(false)}>Cancel</Button>
                    </div>
                </div>
            </Modal>

             <Modal isOpen={showDiscount} onClose={() => setShowDiscount(false)} title="Apply Discount">
                <div className="space-y-4">
                    <p className="text-slate-500 text-sm">Enter a fixed discount amount to apply to the total order.</p>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-slate-500 sm:text-sm">{settings.currencySymbol}</span>
                        </div>
                        <input
                            type="number"
                            className="block w-full pl-7 pr-12 py-3 border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            placeholder="0.00"
                            onChange={(e) => setCartDiscount(Number(e.target.value))}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => { setCartDiscount(0); setShowDiscount(false); }}>Reset</Button>
                        <Button onClick={() => setShowDiscount(false)}>Apply Discount</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showHeldOrders} onClose={() => setShowHeldOrders(false)} title={`Held Orders (${heldOrders.length})`}>
                {heldOrders.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3">
                             <PauseCircle className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">No active held orders</p>
                        <p className="text-xs text-slate-400 mt-1">Park an order to see it here</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                        {heldOrders.map(order => {
                            const isExpired = new Date() > new Date(order.expiration);
                            return (
                                <div key={order.id} className={`group relative flex flex-col p-4 border rounded-xl transition-all ${isExpired ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200 hover:border-primary-300 hover:shadow-md'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                                                    {order.customerName.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm">{order.customerName}</h4>
                                                    <p className="text-[10px] text-slate-500 font-mono">ID: {order.id.slice(-6)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={isExpired ? 'danger' : 'warning'}>
                                            {isExpired ? 'Expired' : 'On Hold'}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex justify-between items-end border-t border-slate-100 pt-3 mt-1">
                                        <div className="space-y-1">
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock size={12} /> Held {formatDistanceToNow(new Date(order.date))} ago
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {order.items.length} Items • <span className="font-bold text-slate-900">{settings.currencySymbol}{order.total.toFixed(2)}</span>
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full" onClick={() => deleteHeldOrder(order.id)}>
                                                <Trash2 size={16} />
                                            </Button>
                                            <Button size="sm" onClick={() => retrieveOrder(order)} disabled={isExpired} icon={<RotateCcw size={14} />}>
                                                Resume
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Modal>

            <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Select Payment Method">
                <div className="space-y-6">
                    <div className="bg-slate-900 p-6 rounded-xl text-center text-white shadow-xl shadow-slate-200">
                        <p className="text-slate-400 text-sm mb-1">Total Payable</p>
                        <h2 className="text-4xl font-bold">{settings.currencySymbol}{total.toFixed(2)}</h2>
                         {loyaltyDiscount > 0 && (
                            <p className="text-emerald-400 text-sm mt-1 flex items-center justify-center gap-1">
                                <Gift size={12} /> includes {settings.currencySymbol}{loyaltyDiscount.toFixed(2)} loyalty discount
                            </p>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                        {['Cash', 'Card', 'Online'].map(method => (
                            <button 
                                key={method} 
                                onClick={() => processPayment(method)}
                                className="flex flex-col items-center justify-center p-6 border border-slate-200 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition-all focus:ring-2 ring-primary-500 group"
                            >
                                <CreditCard className="mb-3 h-8 w-8 text-slate-400 group-hover:text-primary-600" />
                                <span className="text-base font-medium text-slate-700 group-hover:text-primary-700">{method}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* Sales Return Modal - NEW */}
            <Modal isOpen={showReturns} onClose={() => { setShowReturns(false); setFoundInvoice(null); setReturnSearch(''); }} title="Process Sales Return">
                <div className="space-y-6">
                    {!foundInvoice ? (
                        <div className="space-y-4">
                            <p className="text-slate-500 text-sm">Enter the Invoice ID (e.g. INV-123456) to start a return.</p>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Enter Invoice ID" 
                                    value={returnSearch} 
                                    onChange={e => setReturnSearch(e.target.value)} 
                                    autoFocus
                                />
                                <Button onClick={handleSearchInvoice}>Find</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                             <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                                 <div>
                                     <h4 className="font-bold text-slate-900">{foundInvoice.id}</h4>
                                     <p className="text-xs text-slate-500">{new Date(foundInvoice.date).toLocaleDateString()} • {foundInvoice.customerName}</p>
                                 </div>
                                 <Button variant="ghost" size="sm" onClick={() => { setFoundInvoice(null); setReturnSearch(''); }}>Change</Button>
                             </div>

                             <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-2">
                                 {foundInvoice.items?.map(item => {
                                     // Calculate how many are left to return
                                     const previouslyReturned = item.returnedQuantity || 0;
                                     const remainingQty = item.quantity - previouslyReturned;
                                     const currentReturn = returnSelection.find(r => r.productId === item.id)?.quantity || 0;
                                     
                                     if (remainingQty <= 0) return null;

                                     return (
                                         <div key={item.id} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center">
                                             <div>
                                                 <p className="font-medium text-sm">{item.name}</p>
                                                 <p className="text-xs text-slate-500">Sold: {item.quantity} | Prev. Returned: {previouslyReturned}</p>
                                             </div>
                                             <div className="flex items-center gap-3">
                                                 <span className="font-bold text-sm text-slate-700">{settings.currencySymbol}{(item.price * currentReturn).toFixed(2)}</span>
                                                 <div className="flex items-center border border-slate-200 rounded-md bg-white">
                                                     <button onClick={() => updateReturnQty(item.id, currentReturn - 1)} className="p-1 hover:bg-slate-100"><Minus size={14} /></button>
                                                     <span className="w-8 text-center text-sm font-medium">{currentReturn}</span>
                                                     <button onClick={() => updateReturnQty(item.id, currentReturn + 1)} className="p-1 hover:bg-slate-100"><Plus size={14} /></button>
                                                 </div>
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>

                             <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                 <div>
                                     <p className="text-sm text-slate-500">Total Refund</p>
                                     <p className="text-xl font-bold text-slate-900">{settings.currencySymbol}{returnSelection.reduce((acc, i) => acc + i.refundAmount, 0).toFixed(2)}</p>
                                 </div>
                                 <div className="flex gap-2">
                                     <Button variant="secondary" onClick={() => { setShowReturns(false); setFoundInvoice(null); }}>Cancel</Button>
                                     <Button variant="danger" onClick={submitReturn} disabled={returnSelection.every(i => i.quantity === 0)}>Confirm Refund</Button>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Success / Print Invoice Modal */}
            <Modal isOpen={showSuccess} onClose={resetSale} title="Payment Successful">
                <div className="text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-in zoom-in duration-300">
                            <CheckCircle size={48} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Sale Completed!</h2>
                        <p className="text-slate-500 mt-1">Invoice #{lastInvoiceId} has been generated.</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Customer</span>
                            <span className="font-medium text-slate-900">{selectedCustomer}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Items</span>
                            <span className="font-medium text-slate-900">{cart.length}</span>
                        </div>
                        <div className="flex justify-between text-base border-t border-slate-200 pt-2 mt-2">
                            <span className="font-bold text-slate-700">Total Paid</span>
                            <span className="font-bold text-slate-900">{settings.currencySymbol}{total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="secondary" icon={<Printer size={18} />} onClick={handlePrintReceipt}>Print Receipt</Button>
                        <Button onClick={resetSale} icon={<ArrowRight size={18} />}>New Sale</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
