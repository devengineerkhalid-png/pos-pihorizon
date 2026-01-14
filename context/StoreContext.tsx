
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View, Product, User, Supplier, Expense, Invoice, Customer, Role, Purchase, AppSettings, CartItem, LedgerEntry, StockAdjustment, RegisterSession, ReturnItem, ReturnHistoryEntry, PaymentSplit, Catalog } from '../types';

const INITIAL_PRODUCTS: Product[] = Array.from({ length: 15 }).map((_, i) => ({
    id: `p-${i}`,
    name: i % 3 === 0 ? `Premium Item ${i}` : `Standard Item ${i}`,
    category: ['Electronics', 'Apparel', 'Home', 'Beauty'][i % 4],
    price: 49.99 + i * 10,
    wholesalePrice: 40 + i * 8,
    costPrice: 20 + i * 5,
    stock: 20 + i,
    minStockLevel: 10,
    sku: `SKU-${1000 + i}`,
    image: `https://picsum.photos/200/200?random=${i}`,
    supplier: 'Acme Corp',
}));

const INITIAL_CATALOGS: Catalog[] = [
  {
    id: 'cat-1',
    name: 'Premium T-Shirts',
    brand: 'StyleBrand',
    category: 'Apparel',
    description: 'High-quality cotton t-shirts',
    items: [
      {
        id: 'item-1',
        catalogId: 'cat-1',
        itemId: 'ITEM-TSH-001',
        sku: 'TSH-RED-M',
        name: 'Red T-Shirt Medium',
        price: 29.99,
        costPrice: 12.50,
        wholesalePrice: 18.00,
        stock: 150,
        location: 'Shelf A1',
        lots: [
          {
            id: 'lot-1',
            lotNumber: 'ABC-001',
            quantity: 100,
            location: 'Shelf A1',
            expiryDate: '2027-12-31',
            manufacturingDate: '2024-01-10',
            costPrice: 12.50,
            receivedDate: '2024-01-12',
            status: 'Active'
          },
          {
            id: 'lot-2',
            lotNumber: 'ABC-002',
            quantity: 50,
            location: 'Shelf A2',
            expiryDate: '2028-06-30',
            manufacturingDate: '2024-06-15',
            costPrice: 13.00,
            receivedDate: '2024-06-17',
            status: 'Active'
          }
        ]
      },
      {
        id: 'item-2',
        catalogId: 'cat-1',
        itemId: 'ITEM-TSH-002',
        sku: 'TSH-BLUE-L',
        name: 'Blue T-Shirt Large',
        price: 29.99,
        costPrice: 12.50,
        wholesalePrice: 18.00,
        stock: 200,
        location: 'Shelf B1',
        lots: [
          {
            id: 'lot-3',
            lotNumber: 'BCD-001',
            quantity: 200,
            location: 'Shelf B1',
            expiryDate: '2027-12-31',
            manufacturingDate: '2024-02-05',
            costPrice: 12.50,
            receivedDate: '2024-02-07',
            status: 'Active'
          }
        ]
      }
    ],
    attributes: [
      {
        id: 'attr-1',
        name: 'Color',
        values: ['Red', 'Blue', 'Black', 'White']
      },
      {
        id: 'attr-2',
        name: 'Size',
        values: ['Small', 'Medium', 'Large', 'XL']
      }
    ]
  },
  {
    id: 'cat-2',
    name: 'Electronics Accessories',
    brand: 'TechGear',
    category: 'Electronics',
    description: 'Mobile and laptop accessories',
    items: [
      {
        id: 'item-3',
        catalogId: 'cat-2',
        itemId: 'ITEM-ACC-001',
        sku: 'CHARGER-USB-C',
        name: 'USB-C Charger 65W',
        price: 49.99,
        costPrice: 18.00,
        wholesalePrice: 30.00,
        stock: 85,
        location: 'Shelf C1',
        lots: [
          {
            id: 'lot-4',
            lotNumber: 'EFG-001',
            quantity: 50,
            location: 'Shelf C1',
            expiryDate: '2026-12-31',
            manufacturingDate: '2024-01-01',
            costPrice: 18.00,
            receivedDate: '2024-01-05',
            status: 'Active'
          },
          {
            id: 'lot-5',
            lotNumber: 'EFG-002',
            quantity: 35,
            location: 'Shelf C2',
            expiryDate: '2026-12-31',
            manufacturingDate: '2024-05-20',
            costPrice: 18.50,
            receivedDate: '2024-05-22',
            status: 'Active'
          }
        ]
      },
      {
        id: 'item-4',
        catalogId: 'cat-2',
        itemId: 'ITEM-ACC-002',
        sku: 'CABLE-HDMI-2M',
        name: 'HDMI Cable 2M',
        price: 19.99,
        costPrice: 6.50,
        wholesalePrice: 10.00,
        stock: 250,
        location: 'Shelf D1',
        lots: [
          {
            id: 'lot-6',
            lotNumber: 'HIJ-001',
            quantity: 250,
            location: 'Shelf D1',
            expiryDate: '2027-12-31',
            manufacturingDate: '2024-03-10',
            costPrice: 6.50,
            receivedDate: '2024-03-12',
            status: 'Active'
          }
        ]
      }
    ],
    attributes: [
      {
        id: 'attr-3',
        name: 'Type',
        values: ['Charger', 'Cable', 'Adapter']
      },
      {
        id: 'attr-4',
        name: 'Connector',
        values: ['USB-C', 'Micro USB', 'Lightning', 'HDMI']
      }
    ]
  }
];

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

const DEFAULT_SETTINGS: AppSettings = {
    currency: 'USD',
    currencySymbol: '$',
    taxRate: 10,
    shopName: 'ProPOS Desktop',
    address: '123 Main Street, New York, NY',
    phone: '+1 800 555 1234',
    email: 'hello@propos.com',
    themeMode: 'light',
    accentColor: 'indigo'
};

const THEME_COLORS = {
    blue: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
    indigo: { 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
    emerald: { 50: '#ecfdf5', 100: '#d1fae5', 500: '#10b981', 600: '#059669', 700: '#047857' },
    rose: { 50: '#fff1f2', 100: '#ffe4e6', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c' },
    amber: { 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
    violet: { 50: '#f5f3ff', 100: '#ede9fe', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9' },
};

interface StoreContextType {
    products: Product[];
    catalogs: Catalog[];
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
    addCatalog: (catalog: Catalog) => void;
    updateCatalog: (catalog: Catalog) => void;
    deleteCatalog: (catalogId: string) => void;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    processSalesReturn: (invoiceId: string, items: ReturnItem[]) => void;
    returnPurchase: (purchaseId: string, items: ReturnItem[]) => void;
    receivePurchaseItems: (purchaseId: string, items: {productId: string, quantity: number, batchNo?: string, expiryDate?: string}[]) => void;
    addStockAdjustment: (adjustment: Omit<StockAdjustment, 'id' | 'date' | 'costAmount'>) => void;
    openRegister: (amount: number) => void;
    closeRegister: (actualAmount: number) => void;
    login: (email: string, pin: string) => boolean;
    logout: () => void;
    registerUser: (email: string, pin: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
    const [catalogs, setCatalogs] = useState<Catalog[]>(INITIAL_CATALOGS);
    const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
    const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
    const [users, setUsers] = useState<User[]>(INITIAL_USERS);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [roles, setRoles] = useState<Role[]>([
        { id: 'r-1', name: 'Admin', permissions: ['ALL'] },
        { id: 'r-2', name: 'Cashier', permissions: ['POS', 'CUSTOMERS', 'DASHBOARD'] }
    ]);
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [registerSession, setRegisterSession] = useState<RegisterSession | null>(null);
    const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const savedData = localStorage.getItem('POS_DATA_FINAL');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            setProducts(parsed.products);
            setSuppliers(parsed.suppliers);
            setCustomers(parsed.customers);
            setUsers(parsed.users);
            setExpenses(parsed.expenses);
            setInvoices(parsed.invoices);
            setPurchases(parsed.purchases);
            setLedger(parsed.ledger);
            setRoles(parsed.roles);
            setSettings(parsed.settings);
            setRegisterSession(parsed.registerSession);
            setStockAdjustments(parsed.stockAdjustments);
            if (parsed.currentUser) setCurrentUser(parsed.currentUser);
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            const dataToSave = { products, suppliers, customers, users, expenses, invoices, purchases, ledger, roles, settings, registerSession, stockAdjustments, currentUser };
            localStorage.setItem('POS_DATA_FINAL', JSON.stringify(dataToSave));
        }
    }, [products, suppliers, customers, users, expenses, invoices, purchases, ledger, roles, settings, registerSession, stockAdjustments, currentUser, isLoaded]);

    useEffect(() => {
        if (settings.themeMode === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
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

    const addLedgerEntry = (entry: Omit<LedgerEntry, 'id' | 'userId' | 'userName'>) => {
        setLedger(prev => [{
            ...entry, 
            id: `L-${Date.now()}-${Math.random()}`,
            userId: currentUser?.id || 'sys',
            userName: currentUser?.name || 'System'
        }, ...prev]);
    };

    const addItem = (type: View, item: any) => {
        const itemWithId = { ...item, id: item.id || Date.now().toString() };
        const today = new Date().toISOString().split('T')[0];

        if (type === View.INVOICES) {
            const inv = item as Invoice;
            const cashAmount = inv.paymentSplits?.find(s => s.method === 'Cash')?.amount || (inv.paymentMethod === 'Cash' ? inv.total : 0);
            
            if (registerSession && registerSession.status === 'OPEN') {
                setRegisterSession({
                    ...registerSession,
                    salesCount: registerSession.salesCount + 1,
                    totalSales: registerSession.totalSales + inv.total,
                    expectedBalance: registerSession.expectedBalance + cashAmount
                });
            }

            const customer = customers.find(c => c.name === inv.customerName);
            if (customer) {
                const earned = Math.floor(inv.total);
                setCustomers(prev => prev.map(c => 
                    c.id === customer.id 
                    ? { ...c, loyaltyPoints: (c.loyaltyPoints || 0) + earned - (inv.loyaltyPointsUsed || 0), totalPurchases: c.totalPurchases + inv.total, lastVisit: today } 
                    : c
                ));
            }

            addLedgerEntry({
                date: today,
                description: `Sale #${inv.id}`,
                referenceId: inv.id,
                type: 'CREDIT',
                amount: inv.total,
                accountId: customer?.id || 'SALES',
                accountName: customer?.name || 'Walk-in Sales',
                category: 'SALES'
            });

            // Handle Stock & Borrowed items
            inv.items?.forEach(cartItem => {
                if (cartItem.isBorrowed && cartItem.borrowedSupplierId) {
                    // Create liability to the supplier we borrowed from
                    const supplier = suppliers.find(s => s.id === cartItem.borrowedSupplierId);
                    const debtAmount = (cartItem.borrowedCost || 0) * cartItem.quantity;
                    
                    setSuppliers(prev => prev.map(s => 
                        s.id === cartItem.borrowedSupplierId ? { ...s, balance: s.balance + debtAmount } : s
                    ));

                    addLedgerEntry({
                        date: today,
                        description: `Borrowed Item: ${cartItem.name} for Invoice #${inv.id}`,
                        referenceId: inv.id,
                        type: 'CREDIT',
                        amount: debtAmount,
                        accountId: cartItem.borrowedSupplierId,
                        accountName: supplier?.businessName || 'Other Supplier',
                        category: 'PURCHASE'
                    });
                } else {
                    // Regular inventory reduction
                    setProducts(prev => prev.map(p => {
                        if (p.id === cartItem.id) {
                            return { ...p, stock: p.stock - cartItem.quantity };
                        }
                        return p;
                    }));
                }
            });
        } 
        else if (type === View.PURCHASES) {
            const pur = item as Purchase;
            setSuppliers(prev => prev.map(s => s.id === pur.supplierId ? { ...s, balance: s.balance + pur.total } : s));
            addLedgerEntry({
                date: today,
                description: `Purchase #${pur.invoiceNumber}`,
                referenceId: pur.id,
                type: 'CREDIT',
                amount: pur.total,
                accountId: pur.supplierId,
                accountName: pur.supplierName,
                category: 'PURCHASE'
            });
        }

        switch (type) {
            case View.PRODUCTS: setProducts([itemWithId, ...products]); break;
            case View.SUPPLIERS: setSuppliers([itemWithId, ...suppliers]); break;
            case View.CUSTOMERS: setCustomers([itemWithId, ...customers]); break;
            case View.USERS: setUsers([itemWithId, ...users]); break;
            case View.EXPENSES: setExpenses([itemWithId, ...expenses]); break;
            case View.INVOICES: setInvoices([itemWithId, ...invoices]); break;
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
            case View.PURCHASES: setPurchases(filterList(purchases)); break;
        }
    };

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const registerUser = (email: string, pin: string) => {
        setUsers(prev => {
            const exists = prev.find(u => u.email === email);
            if (exists) return prev.map(u => u.email === email ? { ...u, pin } : u);
            return [...prev, { id: `u-${Date.now()}`, name: email.split('@')[0], email, role: 'Cashier', status: 'Active', pin }];
        });
    };

    const login = (email: string, pin: string) => {
        const user = users.find(u => u.email === email);
        if (user && user.pin === pin) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const logout = () => setCurrentUser(null);

    const openRegister = (amount: number) => {
        setRegisterSession({
            id: `REG-${Date.now()}`,
            openedAt: new Date().toISOString(),
            openedBy: currentUser?.name,
            openingBalance: amount,
            expectedBalance: amount,
            status: 'OPEN',
            salesCount: 0,
            totalSales: 0
        });
        addLedgerEntry({ date: new Date().toISOString().split('T')[0], description: 'Shift Opening Float', type: 'DEBIT', amount, accountId: 'CASH', accountName: 'Cash Drawer', category: 'ADJUSTMENT' });
    };

    const closeRegister = (actualAmount: number) => {
        if(!registerSession) return;
        setRegisterSession({ ...registerSession, closedAt: new Date().toISOString(), closedBy: currentUser?.name, status: 'CLOSED', actualBalance: actualAmount, discrepancy: actualAmount - registerSession.expectedBalance });
    };

    const addStockAdjustment = (adjustment: Omit<StockAdjustment, 'id' | 'date' | 'costAmount'>) => {
        const product = products.find(p => p.id === adjustment.productId);
        if(!product) return;
        const costVal = (product.costPrice || 0) * Math.abs(adjustment.quantity);
        setStockAdjustments(prev => [{ ...adjustment, id: `ADJ-${Date.now()}`, date: new Date().toISOString(), costAmount: costVal }, ...prev]);
        setProducts(prev => prev.map(p => p.id === adjustment.productId ? { ...p, stock: p.stock + adjustment.quantity } : p));
    };

    const addCatalog = (catalog: Catalog) => {
        setCatalogs(prev => [...prev, catalog]);
    };

    const updateCatalog = (catalog: Catalog) => {
        setCatalogs(prev => prev.map(c => c.id === catalog.id ? catalog : c));
    };

    const deleteCatalog = (catalogId: string) => {
        setCatalogs(prev => prev.filter(c => c.id !== catalogId));
    };

    const receivePurchaseItems = (purchaseId: string, items: {productId: string, quantity: number, batchNo?: string, expiryDate?: string}[]) => {
        const purchase = purchases.find(p => p.id === purchaseId);
        if(!purchase) return;
        const totalCost = items.reduce((acc, i) => {
            const pItem = purchase.items.find(pi => pi.productId === i.productId);
            return acc + (i.quantity * (pItem?.cost || 0));
        }, 0);
        setProducts(prev => prev.map(p => {
            const recv = items.find(i => i.productId === p.id);
            return recv ? { ...p, stock: p.stock + recv.quantity } : p;
        }));
        setPurchases(prev => prev.map(p => {
            if (p.id === purchaseId) {
                return { 
                    ...p, 
                    items: p.items.map(pi => {
                        const r = items.find(ri => ri.productId === pi.productId);
                        return r ? { ...pi, receivedQuantity: pi.receivedQuantity + r.quantity } : pi;
                    }),
                    status: 'Partial'
                };
            }
            return p;
        }));
    };

    const returnPurchase = (purchaseId: string, items: ReturnItem[]) => {
        const pur = purchases.find(p => p.id === purchaseId);
        if (!pur) return;
        const totalRefund = items.reduce((acc, i) => acc + i.refundAmount, 0);
        setSuppliers(prev => prev.map(s => s.id === pur.supplierId ? { ...s, balance: s.balance - totalRefund } : s));
        setProducts(prev => prev.map(p => {
            const ret = items.find(ri => ri.productId === p.id);
            return ret ? { ...p, stock: Math.max(0, p.stock - ret.quantity) } : p;
        }));
    };

    const processSalesReturn = (invoiceId: string, items: ReturnItem[]) => {
        const inv = invoices.find(i => i.id === invoiceId);
        if (!inv) return;
        const totalRefund = items.reduce((acc, i) => acc + i.refundAmount, 0);
        setProducts(prev => prev.map(p => {
            const ret = items.find(ri => ri.productId === p.id);
            return ret ? { ...p, stock: p.stock + ret.quantity } : p;
        }));
        setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, status: 'Returned' } : i));
        addLedgerEntry({ date: new Date().toISOString().split('T')[0], description: `Sales Return #${invoiceId}`, referenceId: invoiceId, type: 'DEBIT', amount: totalRefund, accountId: 'SALES', accountName: 'Sales Return', category: 'SALES' });
    };

    if (!isLoaded) return null;

    return (
        <StoreContext.Provider value={{
            products, catalogs, suppliers, customers, users, expenses, invoices, roles, purchases, settings, ledger, registerSession, stockAdjustments, currentUser,
            addItem, updateItem, deleteItem, addCatalog, updateCatalog, deleteCatalog, updateSettings, addStockAdjustment, openRegister, closeRegister, login, logout, registerUser, returnPurchase, receivePurchaseItems, processSalesReturn
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
