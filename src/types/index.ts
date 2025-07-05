export interface BusinessProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  website?: string;
  logo?: string;
  taxNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  businessProfile: BusinessProfile;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress: string;
  clientCity: string;
  clientState: string;
  clientZipCode: string;
  clientCountry: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  notes?: string;
  terms?: string;
  dueDate: Date;
  issueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  template: 'modern' | 'classic' | 'minimal' | 'professional' | 'corporate' | 'elegant' | 'creative';
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
}

export interface EmailSettings {
  serviceId: string;
  templateId: string;
  publicKey: string;
}