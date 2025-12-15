
export enum View {
  // Auth handled separately
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
  LEDGER = 'LEDGER'
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
    logo?: string; // New: Base64 string for shop logo
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand?: string;
  price: number;
  costPrice?: number;
  stock: number;
  minStockLevel?: number; // New: Reorder point
  sku: string;
  image?: string;
  supplier?: string;
  taxRate?: number;
  unit?: string; // piece, kg, etc.
  location?: string; // storage location
  hasBatch?: boolean;
  variants?: ProductVariant[];
}

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  itemDiscount?: number;
  variantId?: string;
  variantName?: string;
  isCustom?: boolean; 
  isBorrowed?: boolean; // New: Item borrowed from supplier
  borrowedSupplierId?: string; // New: ID of supplier
  borrowedCost?: number; // New: Cost of borrowing
  returnedQuantity?: number; // New: Track how many have been returned
}

export interface HeldOrder {
    id: string;
    customerName: string;
    items: CartItem[];
    date: Date;
    expiration: Date; // New: When the quote expires
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
  pin?: string; // New: PIN for auth
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
  loyaltyPoints: number; // New: Loyalty Points
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
    quantity: number; // Ordered Quantity
    receivedQuantity: number; // Received so far
    cost: number;
    // Default/Planned batch info (optional)
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

export interface Invoice {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: 'Paid' | 'Pending' | 'Returned' | 'Partial Refund'; 
  items?: CartItem[];
  paymentMethod?: string;
  loyaltyPointsUsed?: number; // New: Points redeemed
  loyaltyPointsEarned?: number; // New: Points gained
  returns?: ReturnHistoryEntry[]; // New: Track return history
}

export interface LedgerEntry {
    id: string;
    date: string;
    description: string;
    referenceId?: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    accountId: string; // 'GENERAL', 'SALES', 'CASH', or SupplierID/CustomerID
    accountName: string;
    category: 'SALES' | 'PURCHASE' | 'EXPENSE' | 'PAYMENT' | 'ADJUSTMENT';
    userId?: string; // Auditing
    userName?: string; // Auditing
}

export interface StockAdjustment {
    id: string;
    date: string;
    productId: string;
    productName: string;
    quantity: number; // Negative for loss, positive for correction
    reason: 'Damaged' | 'Expired' | 'Theft' | 'Correction' | 'Gift';
    costAmount: number; // Value of stock lost/gained
}

export interface RegisterSession {
    id: string;
    openedAt: string;
    closedAt?: string;
    openingBalance: number;
    expectedBalance: number; // opening + cash sales
    actualBalance?: number;
    discrepancy?: number;
    status: 'OPEN' | 'CLOSED';
    salesCount: number;
    totalSales: number;
}
