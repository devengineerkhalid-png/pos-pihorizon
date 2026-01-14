export type PaymentMethodType = 'Cash' | 'Card' | 'Online' | 'Multiple' | 'Balance' | 'Loan' | 'Store Credit';

interface PaymentMethodConfig {
  label: string;
  iconName: 'Banknote' | 'CreditCard' | 'Smartphone' | 'Repeat2' | 'TrendingUp' | 'FileText';
  color: string;
  bgColor: string;
  description: string;
}

export const PAYMENT_METHODS_CONFIG: Record<PaymentMethodType, PaymentMethodConfig> = {
  'Cash': {
    label: 'Cash',
    iconName: 'Banknote',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/10',
    description: 'Physical currency payment'
  },
  'Card': {
    label: 'Card',
    iconName: 'CreditCard',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/10',
    description: 'Debit/Credit card payment'
  },
  'Online': {
    label: 'Online',
    iconName: 'Smartphone',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/10',
    description: 'Digital/Mobile payment'
  },
  'Multiple': {
    label: 'Multiple',
    iconName: 'Repeat2',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/10',
    description: 'Split payment methods'
  },
  'Balance': {
    label: 'Balance',
    iconName: 'TrendingUp',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
    description: 'Account balance/Credit'
  },
  'Loan': {
    label: 'Loan',
    iconName: 'FileText',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 dark:bg-slate-900/10',
    description: 'Credit/Loan payment'
  },
  'Store Credit': {
    label: 'Store Credit',
    iconName: 'Banknote',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/10',
    description: 'Store credit account'
  }
};

export const getPaymentMethodColor = (method: PaymentMethodType) => {
  return PAYMENT_METHODS_CONFIG[method]?.color || 'text-slate-600';
};

export const getPaymentMethodBgColor = (method: PaymentMethodType) => {
  return PAYMENT_METHODS_CONFIG[method]?.bgColor || 'bg-slate-50';
};

export const getPaymentMethodLabel = (method: PaymentMethodType) => {
  return PAYMENT_METHODS_CONFIG[method]?.label || method;
};

export const getPaymentMethodDescription = (method: PaymentMethodType) => {
  return PAYMENT_METHODS_CONFIG[method]?.description || 'Payment method';
};
