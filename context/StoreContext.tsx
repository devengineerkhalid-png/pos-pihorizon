
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View, Product, User, Supplier, Expense, Invoice, Customer, Role, Purchase, AppSettings, CartItem, LedgerEntry, StockAdjustment, RegisterSession, ReturnItem, ReturnHistoryEntry } from '../types';

// Mock Initial Data (Used only if LocalStorage is empty)
const INITIAL_PRODUCTS: Product[] = Array.from({ length: 15 }).map((_, i) => ({
    id: `p-${i}`,
    name: i % 3 === 0 ? `Premium Item ${i}` : `Standard Item ${i}`,
    category: ['Electronics', 'Apparel', 'Home', 'Beauty'][i % 4],
    price: 49.99 + i * 10,
    costPrice: 20 + i * 5,
    stock: 20 + i,
    sku: `SKU-${1000 + i}`,
    image: `https://picsum.photos/200/200?random=${i}`,
    supplier: 'Acme Corp',
    variants: i % 3 === 0 ? [
        { id: `v-${i}-1`, name: 'Small', sku: `SKU-${i}-S`, price: 49.99 + i * 10, stock: 10 },
        { id: `v-${i}-2`, name: 'Large', sku: `SKU-${i}-L`, price: 59.99 + i * 10, stock: 5 },
    ] : undefined
}));

const INITIAL_CUSTOMERS: Customer[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `c-${i}`, name: `Customer ${i+1}`, phone: '555-010'+i, email: `cust${i}@mail.com`, totalPurchases: i*150, lastVisit: '2023-10-20', loyaltyPoints: i * 50
}));

const INITIAL_SUPPLIERS: Supplier[] = [
    { id: 's-1', name: 'John Doe', businessName: 'Acme Corp', phone: '555-9999', email: 'acme@biz.com', address: '123 Ind. Estate', balance: 0 },
    { id: 's-2', name: 'Jane Smith', businessName: 'Global Foods', phone: '555-8888', email: 'global@biz.com', address: '456 Food Lane', balance: 500 }
];

const INITIAL_USERS: User[] = [
    { id: 'u-1', name: 'Admin User', email: 'admin@pos.com', role: 'Admin', status: 'Active', pin: '1234' },
    { id: 'u-2', name: 'Staff User', email: 'staff@pos.com', role: 'Cashier', status: 'Active', pin: '1234' }
];

const INITIAL_INVOICES: Invoice[] = [
    { id: 'INV-1001', customerName: 'Walk-in Customer', date: '2023-10-25', total: 45.00, status: 'Paid', items: [], paymentMethod: 'Cash' },
    { id: 'INV-1002', customerName: 'Jane Doe', date: '2023-10-26', total: 120.50, status: 'Paid', items: [], paymentMethod: 'Card' }
];

const INITIAL_PURCHASES: Purchase[] = [
    { 
        id: '1', 
        type: 'INVOICE',
        date: '2023-10-24', 
        invoiceNumber: 'INV-9901', 
        supplierName: 'Acme Corp', 
        total: 1250.00, 
        status: 'Received', 
        items: [{ productId: 'p1', productName: 'Widget A', quantity: 50, receivedQuantity: 50, cost: 25 }], 
        supplierId: 's-1',
        receivedHistory: [],
        returnHistory: []
    }
];

const INITIAL_LEDGER: LedgerEntry[] = [
    { id: 'l-1', date: '2023-10-24', description: 'Opening Balance Adjustment', type: 'CREDIT', amount: 5000, accountId: 'CASH', accountName: 'Cash Drawer', category: 'ADJUSTMENT', userId: 'u-1', userName: 'Admin User' }
];

const DEFAULT_SETTINGS: AppSettings = {
    currency: 'PKR',
    currencySymbol: 'Rs',
    taxRate: 10,
    shopName: 'My POS Store',
    address: '123 Commerce St, New York, NY',
    phone: '+1 234 567 890',
    email: 'contact@store.com',
    themeMode: 'light',
    accentColor: 'blue' // Updated default to Blue
};

// Refined "Modern" Color Palettes
const THEME_COLORS = {
    // Professional Royal Blue (Trust, Calm)
    blue: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
    // Deep Digital Indigo (Tech, Modern)
    indigo: { 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
    // Mint / Emerald (Financial, Fresh)
    emerald: { 50: '#ecfdf5', 100: '#d1fae5', 500: '#10b981', 600: '#059669', 700: '#047857' },
    // Vibrant Rose (Action, Alert)
    rose: { 50: '#fff1f2', 100: '#ffe4e6', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c' },
    // Warm Amber (Energy, Retail)
    amber: { 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
    // Creative Violet (Premium, Artistic)
    violet: { 50: '#f5f3ff', 100: '#ede9fe', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9' },
};

interface StoreContextType {
    products: Product[];
    suppliers: Supplier[];
    customers: Customer[];
    users: User[];
    expenses: Expense[];
    invoices: Invoice[];
    roles: Role[];
    purchases: Purchase[];
    ledger: LedgerEntry[];
    settings: AppSettings;
    registerSession: RegisterSession | null;
    stockAdjustments: StockAdjustment[];
    currentUser: User | null;
    
    addItem: (type: View, item: any) => void;
    updateItem: (type: View, item: any) => void;
    deleteItem: (type: View, id: string) => void;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    returnInvoice: (invoiceId: string) => void; // Deprecated in favor of processSalesReturn but kept for compatibility
    processSalesReturn: (invoiceId: string, items: ReturnItem[]) => void;
    returnPurchase: (purchaseId: string, items: ReturnItem[]) => void;
    
    // New Methods
    addStockAdjustment: (adjustment: Omit<StockAdjustment, 'id' | 'date' | 'costAmount'>) => void;
    openRegister: (amount: number) => void;
    closeRegister: (actualAmount: number) => void;
    login: (email: string, pin: string) => boolean;
    logout: () => void;
    registerUser: (email: string, pin: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- STATE DEFINITIONS ---
    const [isLoaded, setIsLoaded] = useState(false);
    
    const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
    const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
    const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
    const [users, setUsers] = useState<User[]>(INITIAL_USERS);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
    const [purchases, setPurchases] = useState<Purchase[]>(INITIAL_PURCHASES);
    const [ledger, setLedger] = useState<LedgerEntry[]>(INITIAL_LEDGER);
    const [roles, setRoles] = useState<Role[]>([
        { id: 'r-1', name: 'Admin', permissions: ['ALL'] },
        // Updated Cashier permissions to include DASHBOARD
        { id: 'r-2', name: 'Cashier', permissions: ['POS', 'CUSTOMERS', 'DASHBOARD'] }
    ]);
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    
    // New States
    const [registerSession, setRegisterSession] = useState<RegisterSession | null>(null);
    const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // --- PERSISTENCE LOGIC ---
    useEffect(() => {
        const loadData = () => {
            const savedData = localStorage.getItem('POS_DATA_V1');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                setProducts(parsed.products || INITIAL_PRODUCTS);
                setSuppliers(parsed.suppliers || INITIAL_SUPPLIERS);
                setCustomers(parsed.customers || INITIAL_CUSTOMERS);
                setUsers(parsed.users || INITIAL_USERS);
                setExpenses(parsed.expenses || []);
                setInvoices(parsed.invoices || INITIAL_INVOICES);
                setPurchases(parsed.purchases || INITIAL_PURCHASES);
                setLedger(parsed.ledger || INITIAL_LEDGER);
                setRoles(parsed.roles);
                setSettings(parsed.settings || DEFAULT_SETTINGS);
                setRegisterSession(parsed.registerSession || null);
                setStockAdjustments(parsed.stockAdjustments || []);
                if (parsed.currentUser) {
                    setCurrentUser(parsed.currentUser);
                }
            }
            setIsLoaded(true);
        };
        loadData();
    }, []);

    useEffect(() => {
        if (isLoaded) {
            const dataToSave = {
                products, suppliers, customers, users, expenses, invoices, purchases, ledger, roles, settings, registerSession, stockAdjustments, currentUser
            };
            localStorage.setItem('POS_DATA_V1', JSON.stringify(dataToSave));
        }
    }, [products, suppliers, customers, users, expenses, invoices, purchases, ledger, roles, settings, registerSession, stockAdjustments, currentUser, isLoaded]);


    // --- THEME APPLIER ---
    useEffect(() => {
        if (settings.themeMode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        const colors = THEME_COLORS[settings.accentColor];
        if (colors) {
            const root = document.documentElement;
            root.style.setProperty('--color-primary-50', colors[50]);
            root.style.setProperty('--color-primary-100', colors[100]);
            root.style.setProperty('--color-primary-500', colors[500]);
            root.style.setProperty('--color-primary-600', colors[600]);
            root.style.setProperty('--color-primary-700', colors[700]);
        }
    }, [settings.themeMode, settings.accentColor]);

    const registerUser = (email: string, pin: string) => {
        setUsers(prev => {
            // Check if user exists
            const exists = prev.find(u => u.email === email);
            if (exists) {
                // Update PIN
                return prev.map(u => u.email === email ? { ...u, pin } : u);
            } else {
                // Create new user (Role defaults to Cashier for self-reg)
                const newUser: User = {
                    id: `u-${Date.now()}`,
                    name: email.split('@')[0],
                    email,
                    role: 'Cashier',
                    status: 'Active',
                    pin
                };
                return [...prev, newUser];
            }
        });
    };

    const login = (email: string, pin: string) => {
        const user = users.find(u => u.email === email);
        // Allow login if PIN matches OR if it's the master fallback '1234' (useful for demos)
        if (user && (user.pin === pin || pin === '1234')) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const addLedgerEntry = (entry: Omit<LedgerEntry, 'id' | 'userId' | 'userName'>) => {
        setLedger(prev => [{
            ...entry, 
            id: `L-${Date.now()}-${Math.random()}`,
            userId: currentUser?.id || 'sys',
            userName: currentUser?.name || 'System'
        }, ...prev]);
    };

    // --- REGISTER LOGIC ---
    const openRegister = (amount: number) => {
        setRegisterSession({
            id: `REG-${Date.now()}`,
            openedAt: new Date().toISOString(),
            openingBalance: amount,
            expectedBalance: amount,
            status: 'OPEN',
            salesCount: 0,
            totalSales: 0
        });
        addLedgerEntry({
            date: new Date().toISOString().split('T')[0],
            description: 'Register Opening Float',
            type: 'DEBIT',
            amount: amount,
            accountId: 'CASH',
            accountName: 'Cash Drawer',
            category: 'ADJUSTMENT'
        });
    };

    const closeRegister = (actualAmount: number) => {
        if(!registerSession) return;
        setRegisterSession({
            ...registerSession,
            closedAt: new Date().toISOString(),
            status: 'CLOSED',
            actualBalance: actualAmount,
            discrepancy: actualAmount - registerSession.expectedBalance
        });
    };

    // --- STOCK ADJUSTMENT LOGIC ---
    const addStockAdjustment = (adjustment: Omit<StockAdjustment, 'id' | 'date' | 'costAmount'>) => {
        const product = products.find(p => p.id === adjustment.productId);
        if(!product) return;

        const costVal = (product.costPrice || 0) * Math.abs(adjustment.quantity);
        
        const newAdj: StockAdjustment = {
            ...adjustment,
            id: `ADJ-${Date.now()}`,
            date: new Date().toISOString(),
            costAmount: costVal
        };

        setStockAdjustments(prev => [newAdj, ...prev]);

        // Update Product Stock
        const updatedProducts = products.map(p => {
            if(p.id === adjustment.productId) {
                return { ...p, stock: p.stock + adjustment.quantity }; // quantity is negative for loss
            }
            return p;
        });
        setProducts(updatedProducts);

        // Ledger: If quantity is negative (loss), Debit Expense, Credit Inventory
        if(adjustment.quantity < 0) {
            addLedgerEntry({
                date: new Date().toISOString().split('T')[0],
                description: `Stock Adj: ${adjustment.reason} (${product.name})`,
                type: 'DEBIT',
                amount: costVal,
                accountId: 'EXPENSE',
                accountName: 'Inventory Loss/Shrinkage',
                category: 'ADJUSTMENT'
            });
        }
    };

    const returnPurchase = (purchaseId: string, items: ReturnItem[]) => {
        const purchase = purchases.find(p => p.id === purchaseId);
        if (!purchase) return;

        const totalRefund = items.reduce((acc, item) => acc + item.refundAmount, 0);

        // 1. Update Purchase Return History
        const newHistory: ReturnHistoryEntry = {
            id: `RET-${Date.now()}`,
            date: new Date().toISOString(),
            items: items,
            totalRefund: totalRefund
        };

        const updatedPurchase: Purchase = {
            ...purchase,
            returnHistory: [newHistory, ...(purchase.returnHistory || [])]
        };

        setPurchases(prev => prev.map(p => p.id === purchaseId ? updatedPurchase : p));

        // 2. Reduce Stock
        let updatedProducts = [...products];
        items.forEach(item => {
            const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
            if(productIndex > -1) {
                // Ensure we don't go below zero, though validation should happen in UI
                updatedProducts[productIndex].stock = Math.max(0, updatedProducts[productIndex].stock - item.quantity);
            }
        });
        setProducts(updatedProducts);

        // 3. Update Supplier Balance (Reduce what we owe)
        setSuppliers(prev => prev.map(s => {
            if (s.id === purchase.supplierId) {
                return { ...s, balance: s.balance - totalRefund };
            }
            return s;
        }));

        // 4. Ledger Entries
        // Debit Supplier (Decrease Liability) or Cash (if cash return)
        addLedgerEntry({
            date: new Date().toISOString().split('T')[0],
            description: `Purchase Return for #${purchase.invoiceNumber}`,
            referenceId: purchaseId,
            type: 'DEBIT',
            amount: totalRefund,
            accountId: purchase.supplierId,
            accountName: purchase.supplierName,
            category: 'PURCHASE'
        });

        // Credit Inventory (Decrease Asset)
        addLedgerEntry({
            date: new Date().toISOString().split('T')[0],
            description: `Stock Return Value #${purchase.invoiceNumber}`,
            referenceId: purchaseId,
            type: 'CREDIT',
            amount: totalRefund,
            accountId: 'INVENTORY',
            accountName: 'Inventory Asset',
            category: 'ADJUSTMENT'
        });
    };

    const processSalesReturn = (invoiceId: string, items: ReturnItem[]) => {
        const invoice = invoices.find(i => i.id === invoiceId);
        if (!invoice) return;

        const totalRefund = items.reduce((acc, item) => acc + item.refundAmount, 0);

        // 1. Record Return in History
        const returnEntry: ReturnHistoryEntry = {
            id: `RET-SALE-${Date.now()}`,
            date: new Date().toISOString(),
            items: items,
            totalRefund: totalRefund
        };

        // 2. Update Invoice: Add to history, update status, increment returnedQuantity on items
        const updatedInvoice: Invoice = {
            ...invoice,
            returns: [returnEntry, ...(invoice.returns || [])],
            // Check if all items fully returned? Simplification: If any return, status = Partial Refund or Returned
            status: 'Partial Refund', 
            items: invoice.items?.map(invItem => {
                const returned = items.find(r => r.productId === invItem.id); // Note: assuming productId matches cartItem.id
                if (returned) {
                    return { ...invItem, returnedQuantity: (invItem.returnedQuantity || 0) + returned.quantity };
                }
                return invItem;
            })
        };

        // If total refunded >= total paid, mark as Returned
        const totalRefundedSoFar = (updatedInvoice.returns || []).reduce((acc, r) => acc + r.totalRefund, 0);
        if (totalRefundedSoFar >= updatedInvoice.total) {
            updatedInvoice.status = 'Returned';
        }

        setInvoices(prev => prev.map(i => i.id === invoiceId ? updatedInvoice : i));

        // 3. Restore Stock (Only for non-custom/borrowed items generally, but simplifed here)
        let updatedProducts = [...products];
        items.forEach(item => {
            const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
            if(productIndex > -1) {
                updatedProducts[productIndex].stock += item.quantity;
            }
        });
        setProducts(updatedProducts);

        // 4. Ledger: Debit Sales Returns, Credit Cash
        addLedgerEntry({
            date: new Date().toISOString().split('T')[0],
            description: `Sales Refund for #${invoiceId}`,
            referenceId: invoiceId,
            type: 'DEBIT',
            amount: totalRefund,
            accountId: 'SALES',
            accountName: 'Sales Returns',
            category: 'SALES'
        });
         addLedgerEntry({
            date: new Date().toISOString().split('T')[0],
            description: `Cash Refund Paid #${invoiceId}`,
            referenceId: invoiceId,
            type: 'CREDIT',
            amount: totalRefund,
            accountId: 'CASH',
            accountName: 'Cash Drawer',
            category: 'SALES'
        });

        // 5. Adjust Loyalty (Remove points earned on returned items)
        const customer = customers.find(c => c.name === invoice.customerName);
        if(customer) {
            // Approx: 1 point per $1.
            const pointsToRemove = Math.floor(totalRefund);
            setCustomers(prev => prev.map(c => 
                c.id === customer.id ? { ...c, loyaltyPoints: Math.max(0, c.loyaltyPoints - pointsToRemove) } : c
            ));
        }

        // 6. Update Register if Open (Cash Refund reduces cash)
        if (registerSession && registerSession.status === 'OPEN' && invoice.paymentMethod === 'Cash') {
             // Technically a refund should reduce expected balance
             // or track as a separate 'Refunds' line.
             // We'll reduce totalSales to keep it simple, or add a 'returns' field to session
             setRegisterSession({
                 ...registerSession,
                 expectedBalance: registerSession.expectedBalance - totalRefund
             });
        }
    };

    const addItem = (type: View, item: any) => {
        const itemWithId = { ...item, id: item.id || Date.now().toString() };
        const today = new Date().toISOString().split('T')[0];

        if (type === View.INVOICES) {
            const inv = item as Invoice;
            // Update Register if cash
            if (registerSession && registerSession.status === 'OPEN' && inv.paymentMethod === 'Cash') {
                setRegisterSession({
                    ...registerSession,
                    salesCount: registerSession.salesCount + 1,
                    totalSales: registerSession.totalSales + inv.total,
                    expectedBalance: registerSession.expectedBalance + inv.total
                });
            }

            // --- LOYALTY LOGIC ---
            const customer = customers.find(c => c.name === inv.customerName);
            if (customer) {
                let newPoints = customer.loyaltyPoints || 0;
                
                if (inv.loyaltyPointsUsed) {
                    newPoints -= inv.loyaltyPointsUsed;
                }

                const earned = Math.floor(inv.total);
                newPoints += earned;

                inv.loyaltyPointsEarned = earned;

                const updatedCustomers = customers.map(c => 
                    c.id === customer.id 
                    ? { ...c, loyaltyPoints: newPoints, totalPurchases: c.totalPurchases + inv.total, lastVisit: today } 
                    : c
                );
                setCustomers(updatedCustomers);
            }

            // Ledger Logic
            addLedgerEntry({
                date: today,
                description: `Sale Invoice #${inv.id}`,
                referenceId: inv.id,
                type: 'CREDIT',
                amount: inv.total,
                accountId: 'SALES',
                accountName: 'General Sales',
                category: 'SALES'
            });
            addLedgerEntry({
                date: today,
                description: `Payment for #${inv.id} (${inv.paymentMethod})`,
                referenceId: inv.id,
                type: 'DEBIT',
                amount: inv.total,
                accountId: 'CASH',
                accountName: 'Cash / Bank',
                category: 'SALES'
            });

             // Handle Stock Reduction
             if (inv.items) {
                const updatedProducts = [...products];
                inv.items.forEach(cartItem => {
                    if (cartItem.isCustom || cartItem.isBorrowed) return; 

                    const productIndex = updatedProducts.findIndex(p => p.id === cartItem.id);
                    if (productIndex > -1) {
                        if (cartItem.variantId) {
                             const variant = updatedProducts[productIndex].variants?.find(v => v.id === cartItem.variantId);
                             if(variant) variant.stock -= cartItem.quantity;
                        } else {
                             updatedProducts[productIndex].stock -= cartItem.quantity;
                        }
                    }
                });
                setProducts(updatedProducts);
            }

            // Handle Borrowed Items
            if (inv.items) {
                const borrowedItems = inv.items.filter(i => i.isBorrowed && i.borrowedSupplierId);
                
                if (borrowedItems.length > 0) {
                    const itemsBySupplier: Record<string, CartItem[]> = {};
                    borrowedItems.forEach(bi => {
                        const sid = bi.borrowedSupplierId!;
                        if(!itemsBySupplier[sid]) itemsBySupplier[sid] = [];
                        itemsBySupplier[sid].push(bi);
                    });

                    Object.keys(itemsBySupplier).forEach(sid => {
                        const sItems = itemsBySupplier[sid];
                        const supplier = suppliers.find(s => s.id === sid);
                        const totalCost = sItems.reduce((acc, si) => acc + (si.quantity * (si.borrowedCost || 0)), 0);

                        const purchase: Purchase = {
                            id: `AUTO-PUR-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                            type: 'INVOICE',
                            supplierId: sid,
                            supplierName: supplier?.businessName || 'Unknown',
                            date: today,
                            invoiceNumber: `AUTO-REF-${inv.id}`,
                            items: sItems.map(si => ({
                                productId: si.id,
                                productName: si.name,
                                quantity: si.quantity,
                                receivedQuantity: si.quantity,
                                cost: si.borrowedCost || 0
                            })),
                            total: totalCost,
                            status: 'Received', 
                            receivedHistory: [],
                            returnHistory: []
                        };
                        setPurchases(prev => [purchase, ...prev]);

                        addLedgerEntry({
                            date: today,
                            description: `Borrowed Items for Sale #${inv.id}`,
                            referenceId: purchase.id,
                            type: 'CREDIT',
                            amount: totalCost,
                            accountId: sid,
                            accountName: supplier?.businessName || 'Supplier',
                            category: 'PURCHASE'
                        });
                    });
                }
            }
        } 
        else if (type === View.PURCHASES) {
             const pur = item as Purchase;
             // Ensure returnHistory exists
             pur.returnHistory = [];
             
             addLedgerEntry({
                date: today,
                description: `Purchase Invoice ${pur.invoiceNumber}`,
                referenceId: pur.id,
                type: 'CREDIT',
                amount: pur.total,
                accountId: pur.supplierId,
                accountName: pur.supplierName,
                category: 'PURCHASE'
             });
        }
        else if (type === View.EXPENSES) {
            const exp = item as Expense;
            if (exp.status === 'Paid') {
                addLedgerEntry({
                    date: today,
                    description: `Expense: ${exp.title}`,
                    referenceId: exp.id,
                    type: 'DEBIT',
                    amount: exp.amount,
                    accountId: 'EXPENSE',
                    accountName: exp.category,
                    category: 'EXPENSE'
                });
                addLedgerEntry({
                    date: today,
                    description: `Payment for ${exp.title}`,
                    referenceId: exp.id,
                    type: 'CREDIT',
                    amount: exp.amount,
                    accountId: 'CASH',
                    accountName: 'Cash',
                    category: 'EXPENSE'
                });
            }
        }

        switch (type) {
            case View.PRODUCTS: setProducts([itemWithId, ...products]); break;
            case View.SUPPLIERS: setSuppliers([itemWithId, ...suppliers]); break;
            case View.CUSTOMERS: setCustomers([itemWithId, ...customers]); break;
            case View.USERS: setUsers([itemWithId, ...users]); break;
            case View.EXPENSES: setExpenses([itemWithId, ...expenses]); break;
            case View.INVOICES: setInvoices([itemWithId, ...invoices]); break;
            case View.ROLES: setRoles([itemWithId, ...roles]); break;
            case View.PURCHASES: setPurchases([itemWithId, ...purchases]); break;
        }
    };

    const updateItem = (type: View, updatedItem: any) => {
        const updateList = (list: any[]) => list.map(i => i.id === updatedItem.id ? updatedItem : i);
        switch (type) {
            case View.PRODUCTS: setProducts(updateList(products)); break;
            case View.SUPPLIERS: setSuppliers(updateList(suppliers)); break;
            case View.CUSTOMERS: setCustomers(updateList(customers)); break;
            case View.USERS: setUsers(updateList(users)); break;
            case View.EXPENSES: setExpenses(updateList(expenses)); break;
            case View.INVOICES: setInvoices(updateList(invoices)); break;
            case View.ROLES: setRoles(updateList(roles)); break;
            case View.PURCHASES: setPurchases(updateList(purchases)); break;
        }
    };

    const deleteItem = (type: View, id: string) => {
        const filterList = (list: any[]) => list.filter(i => i.id !== id);
        switch (type) {
            case View.PRODUCTS: setProducts(filterList(products)); break;
            case View.SUPPLIERS: setSuppliers(filterList(suppliers)); break;
            case View.CUSTOMERS: setCustomers(filterList(customers)); break;
            case View.USERS: setUsers(filterList(users)); break;
            case View.EXPENSES: setExpenses(filterList(expenses)); break;
            case View.INVOICES: setInvoices(filterList(invoices)); break;
            case View.ROLES: setRoles(filterList(roles)); break;
            case View.PURCHASES: setPurchases(filterList(purchases)); break;
        }
    };

    const returnInvoice = (invoiceId: string) => {
        // Deprecated simple toggle, but maintained for compatibility if called elsewhere.
        // It now redirects to a full return logic if possible, or just does a basic reversal.
        // For now, we will just use the new logic assuming full return.
        const inv = invoices.find(i => i.id === invoiceId);
        if(inv && inv.items) {
            const itemsToReturn = inv.items.map(i => ({
                productId: i.id,
                productName: i.name,
                quantity: i.quantity,
                reason: 'Full Return',
                refundAmount: i.price * i.quantity
            }));
            processSalesReturn(invoiceId, itemsToReturn);
        }
    };

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({...prev, ...newSettings}));
    };

    if (!isLoaded) return null; // Or a loading spinner

    return (
        <StoreContext.Provider value={{
            products, suppliers, customers, users, expenses, invoices, roles, purchases, settings, ledger, registerSession, stockAdjustments, currentUser,
            addItem, updateItem, deleteItem, updateSettings, returnInvoice, addStockAdjustment, openRegister, closeRegister, login, logout, registerUser, returnPurchase, processSalesReturn
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore must be used within a StoreProvider');
    return context;
};
