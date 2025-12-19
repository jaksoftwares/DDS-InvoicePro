// src/services/api.ts
// Frontend API service for calling backend endpoints
import { supabase, getAccessToken } from '../lib/supabase';
import { BusinessProfile, Invoice, InvoiceItem } from '../types';

const API_BASE = '/api';

// Helper for authenticated requests
async function authFetch(url: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

// ============ Business Profiles ============

export async function getBusinessProfiles(): Promise<BusinessProfile[]> {
  const { profiles } = await authFetch('/business-profiles');
  return profiles.map(transformProfileDates);
}

export async function getBusinessProfile(id: string): Promise<BusinessProfile> {
  const { profile } = await authFetch(`/business-profiles/${id}`);
  return transformProfileDates(profile);
}

export async function createBusinessProfile(profile: Partial<BusinessProfile>): Promise<BusinessProfile> {
  const { profile: created } = await authFetch('/business-profiles', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
  return transformProfileDates(created);
}

export async function updateBusinessProfile(id: string, updates: Partial<BusinessProfile>): Promise<BusinessProfile> {
  const { profile } = await authFetch(`/business-profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return transformProfileDates(profile);
}

export async function deleteBusinessProfile(id: string): Promise<void> {
  await authFetch(`/business-profiles/${id}`, { method: 'DELETE' });
}

// ============ Invoices ============

export async function getInvoices(filters?: { status?: string; search?: string }): Promise<Invoice[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  
  const query = params.toString() ? `?${params.toString()}` : '';
  const { invoices } = await authFetch(`/invoices${query}`);
  return invoices.map(transformInvoiceDates);
}

export async function getInvoice(id: string): Promise<Invoice> {
  const { invoice } = await authFetch(`/invoices/${id}`);
  return transformInvoiceDates(invoice);
}

export async function createInvoice(invoice: Partial<Invoice> & { businessProfileId: string }): Promise<Invoice> {
  const { invoice: created } = await authFetch('/invoices', {
    method: 'POST',
    body: JSON.stringify({
      ...invoice,
      dueDate: invoice.dueDate instanceof Date ? invoice.dueDate.toISOString() : invoice.dueDate,
      issueDate: invoice.issueDate instanceof Date ? invoice.issueDate.toISOString() : invoice.issueDate,
    }),
  });
  return transformInvoiceDates(created);
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
  const { invoice } = await authFetch(`/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...updates,
      dueDate: updates.dueDate instanceof Date ? updates.dueDate.toISOString() : updates.dueDate,
      issueDate: updates.issueDate instanceof Date ? updates.issueDate.toISOString() : updates.issueDate,
    }),
  });
  return transformInvoiceDates(invoice);
}

export async function deleteInvoice(id: string): Promise<void> {
  await authFetch(`/invoices/${id}`, { method: 'DELETE' });
}

// ============ Settings ============

export interface UserSettings {
  currency: string;
  taxRate: number;
  language: string;
  dateFormat: string;
  defaultTemplate: string;
  defaultNotes: string;
  defaultTerms: string;
  defaultDueDays: number;
}

export async function getSettings(): Promise<UserSettings> {
  const { settings } = await authFetch('/settings');
  return settings;
}

export async function updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
  const { settings } = await authFetch('/settings', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return settings;
}

// ============ Plans & Subscriptions ============

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  interval: 'month' | 'year';
  features: Record<string, any>;
}

export interface Subscription {
  id: string;
  planId: string;
  plan: Plan | null;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  mpesaReceiptNumber: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt: string | null;
  canceledAt: string | null;
}

export async function getPlans(): Promise<Plan[]> {
  const response = await fetch(`${API_BASE}/plans`);
  const { plans } = await response.json();
  return plans;
}

export async function getSubscription(): Promise<Subscription | null> {
  const { subscription } = await authFetch('/subscription');
  return subscription;
}

// ============ M-Pesa Payments ============

export async function initiateMpesaPayment(planId: string, phoneNumber: string): Promise<{
  status: string;
  message: string;
  checkoutRequestId?: string;
}> {
  return authFetch('/payments/mpesa/subscribe', {
    method: 'POST',
    body: JSON.stringify({ planId, phoneNumber }),
  });
}

export async function checkPaymentStatus(checkoutRequestId: string): Promise<{
  status: 'pending' | 'completed' | 'failed';
  message: string;
  receiptNumber?: string;
}> {
  return authFetch('/payments/mpesa/status', {
    method: 'POST',
    body: JSON.stringify({ checkoutRequestId }),
  });
}

// ============ Media / Cloudinary ============

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: string;
}

export async function getUploadSignature(folder?: string): Promise<UploadSignature> {
  return authFetch('/media/sign-upload', {
    method: 'POST',
    body: JSON.stringify({ folder }),
  });
}

export async function saveMediaAsset(media: {
  publicId: string;
  url: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
  width?: number;
  height?: number;
  businessProfileId?: string;
  invoiceId?: string;
}): Promise<any> {
  const { media: saved } = await authFetch('/media', {
    method: 'POST',
    body: JSON.stringify(media),
  });
  return saved;
}

// ============ Helpers ============

function transformProfileDates(profile: any): BusinessProfile {
  return {
    ...profile,
    logo: profile.logoUrl || profile.logo || '',
    createdAt: new Date(profile.createdAt),
    updatedAt: new Date(profile.updatedAt),
  };
}

function transformInvoiceDates(invoice: any): Invoice {
  return {
    ...invoice,
    dueDate: new Date(invoice.dueDate),
    issueDate: new Date(invoice.issueDate),
    createdAt: new Date(invoice.createdAt),
    updatedAt: new Date(invoice.updatedAt),
    // Ensure businessProfile is properly structured if present
    businessProfile: invoice.businessProfile ? transformProfileDates(invoice.businessProfile) : undefined,
  };
}

// ============ Supabase Auth Helpers (re-exported for convenience) ============

export { supabase };

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
