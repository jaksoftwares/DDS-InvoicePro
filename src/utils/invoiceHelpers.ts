import { Invoice, InvoiceItem } from '../types';

export const generateInvoiceNumber = (): string => {
  const prefix = 'INV';
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${prefix}-${year}${month}${day}-${random}`;
};

export const calculateInvoiceTotals = (
  items: InvoiceItem[],
  taxRate: number,
  discountRate: number
): {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
} => {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = subtotal * (discountRate / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = subtotal - discountAmount + taxAmount;

  return {
    subtotal,
    taxAmount,
    discountAmount,
    total,
  };
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const getStatusColor = (status: Invoice['status']): string => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'sent':
      return 'bg-blue-100 text-blue-800';
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusIcon = (status: Invoice['status']): string => {
  switch (status) {
    case 'draft':
      return '📝';
    case 'sent':
      return '📧';
    case 'paid':
      return '✅';
    case 'overdue':
      return '⚠️';
    default:
      return '📝';
  }
};

export const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    case 'CAD': return 'C$';
    case 'AUD': return 'A$';
    case 'CHF': return 'CHF';
    case 'CNY': return '¥';
    case 'INR': return '₹';
    case 'KES': return 'KSh';
    default: return currency;
  }
};