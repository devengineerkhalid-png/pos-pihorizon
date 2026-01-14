
export enum View {
  DASHBOARD = 'DASHBOARD',
  POS = 'POS',
  PRODUCTS = 'PRODUCTS',
  SUPPLIERS = 'SUPPLIERS',
  PURCHASES = 'PURCHASES',
  CUSTOMERS = 'CUSTOMERS',
  USERS = 'USERS',
  ROLES = 'ROLES',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS',
  EXPENSES = 'EXPENSES',
  INVOICES = 'INVOICES',
  LEDGER = 'LEDGER',
  TRANSFERS = 'TRANSFERS'
}

export enum AuthState {
  LOGIN = 'LOGIN',
  OTP = 'OTP',
  SET_PIN = 'SET_PIN',
  CONFIRM_PIN = 'CONFIRM_PIN',
  PIN_LOGIN = 'PIN_LOGIN',
  AUTHENTICATED = 'AUTHENTICATED'
}

export interface AppSettings {
    currency: string;
    currencySymbol: string;
    taxRate: number;
    shopName: string;
    address: string;
    phone: string;
    email: string;
    themeMode: 'light' | 'dark';
    accentColor: 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue' | 'violet';
    logo?: string;
}

export interface ProductLot {
  id: string;
  lotNumber: string;
  quantity: number;
  location?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  costPrice: number;
  receivedDate: string;
  status: 'Active' | 'Expired' | 'Archived';
}

export interface ProductAttribute {
  id: string;
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  itemId: string;
  sku: string;
  attributeValues: { [attributeName: string]: string };
  price: number;
  costPrice?: number;
  wholesalePrice?: number;
  stock: number;
  lots?: ProductLot[];
}

export interface CatalogItem {
  id: string;
  catalogId: string;
  itemId: string;
  sku: string;
  name: string;
  price: number;
  costPrice?: number;
  wholesalePrice?: number;
  salePrice?: number;
  stock: number;
  location?: string;
  lots?: ProductLot[];
}

export interface Catalog {
  id: string;
  name: string;
  brand?: string;
  category: string;
  description?: string;
  image?: string;
  items: CatalogItem[];
  attributes: ProductAttribute[];
}

export interface Product {
  id: string;
  catalogId?: string;
  name: string;
  category: string;
  brand?: string;
  price: number;
  wholesalePrice?: number;
  costPrice?: number;
  salePrice?: number;
  stock: number;
  minStockLevel?: number;
  sku: string;
  image?: string;
  supplier?: string;
  taxRate?: number;
  unit?: string;
  location?: string;
  hasBatch?: boolean;
  variants?: ProductVariant[];
  attributes?: ProductAttribute[];
}

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  itemDiscount?: number;
  variantId?: string;
  variantName?: string;
  isCustom?: boolean; 
  isBorrowed?: boolean;
  borrowedSupplierId?: string;
  borrowedCost?: number;
  returnedQuantity?: number;
}

export interface HeldOrder {
    id: string;
    customerName: string;
    items: CartItem[];
    date: Date;
    expiration: Date;
    total: number;
    note?: string;
}

export interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  status: 'Active' | 'Archived';
  pin?: string;
}

export interface Role {
    id: string;
    name: string;
    permissions: string[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  totalPurchases: number;
  lastVisit?: string;
  loyaltyPoints: number;
}

export interface Supplier {
    id: string;
    name: string;
    businessName: string;
    phone: string;
    email: string;
    address: string;
    balance: number;
}

export interface PurchaseItem {
    productId: string;
    productName: string;
    quantity: number;
    receivedQuantity: number;
    cost: number;
    batchNo?: string;
    expiryDate?: string;
}

export interface PurchaseReceiptItem {
    productId: string;
    productName: string;
    quantity: number;
    batchNo?: string;
    expiryDate?: string;
}

export interface PurchaseHistoryEntry {
    id: string;
    date: string;
    items: PurchaseReceiptItem[];
    note?: string;
}

export interface ReturnItem {
    productId: string;
    productName: string;
    quantity: number;
    reason: string;
    refundAmount: number;
}

export interface ReturnHistoryEntry {
    id: string;
    date: string;
    items: ReturnItem[];
    totalRefund: number;
    note?: string;
}

export interface Purchase {
    id: string;
    type: 'INVOICE' | 'ORDER';
    supplierId: string;
    supplierName: string;
    date: string;
    invoiceNumber: string;
    items: PurchaseItem[];
    total: number;
    status: 'Received' | 'Pending' | 'Ordered' | 'Partial' | 'Completed' | 'Returned';
    receivedHistory: PurchaseHistoryEntry[];
    returnHistory: ReturnHistoryEntry[];
}

export interface Expense {
    id: string;
    title: string;
    category: string;
    amount: number;
    date: string;
    status: 'Paid' | 'Pending';
    attachment?: string;
}

export interface PaymentSplit {
    method: 'Cash' | 'Card' | 'Online' | 'Store Credit';
    amount: number;
    reference?: string;
}

export interface Invoice {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: 'Paid' | 'Pending' | 'Returned' | 'Partial Refund'; 
  items?: CartItem[];
  paymentMethod?: string;
  paymentSplits?: PaymentSplit[]; // New: Support for split payments
  loyaltyPointsUsed?: number;
  loyaltyPointsEarned?: number;
  returns?: ReturnHistoryEntry[];
}

export interface LedgerEntry {
    id: string;
    date: string;
    description: string;
    referenceId?: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    accountId: string;
    accountName: string;
    category: 'SALES' | 'PURCHASE' | 'EXPENSE' | 'PAYMENT' | 'ADJUSTMENT';
    userId?: string;
    userName?: string;
}

export interface StockAdjustment {
    id: string;
    date: string;
    productId: string;
    productName: string;
    quantity: number;
    reason: 'Damaged' | 'Expired' | 'Theft' | 'Correction' | 'Gift';
    costAmount: number;
}

export interface RegisterSession {
    id: string;
    openedAt: string;
    openedBy?: string;
    closedAt?: string;
    closedBy?: string;
    openingBalance: number;
    expectedBalance: number;
    actualBalance?: number;
    discrepancy?: number;
    status: 'OPEN' | 'CLOSED';
    salesCount: number;
    totalSales: number;
}

export interface StockTransfer {
    id: string;
    date: string;
    fromLocation: string;
    toLocation: string;
    items: { productId: string, productName: string, quantity: number }[];
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}
