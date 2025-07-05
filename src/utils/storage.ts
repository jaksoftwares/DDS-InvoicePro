import { BusinessProfile, Invoice } from '../types';

const STORAGE_KEYS = {
  BUSINESS_PROFILES: 'invoice_business_profiles',
  INVOICES: 'invoice_invoices',
  CURRENT_PROFILE: 'invoice_current_profile',
  SETTINGS: 'invoice_settings',
};

// Helper function to convert date strings back to Date objects
const convertDatesToObjects = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Check if string looks like a date
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (dateRegex.test(obj)) {
      return new Date(obj);
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertDatesToObjects);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Convert known date fields
        if (key === 'issueDate' || key === 'dueDate' || key === 'createdAt' || key === 'updatedAt') {
          converted[key] = obj[key] ? new Date(obj[key]) : obj[key];
        } else {
          converted[key] = convertDatesToObjects(obj[key]);
        }
      }
    }
    return converted;
  }
  
  return obj;
};

export const storageUtils = {
  // Business Profiles
  getBusinessProfiles: (): BusinessProfile[] => {
    const profiles = localStorage.getItem(STORAGE_KEYS.BUSINESS_PROFILES);
    if (!profiles) return [];
    
    const parsedProfiles = JSON.parse(profiles);
    return parsedProfiles.map((profile: any) => convertDatesToObjects(profile));
  },

  saveBusinessProfile: (profile: BusinessProfile): void => {
    const profiles = storageUtils.getBusinessProfiles();
    const existingIndex = profiles.findIndex(p => p.id === profile.id);
    
    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }
    
    localStorage.setItem(STORAGE_KEYS.BUSINESS_PROFILES, JSON.stringify(profiles));
  },

  deleteBusinessProfile: (id: string): void => {
    const profiles = storageUtils.getBusinessProfiles();
    const filteredProfiles = profiles.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.BUSINESS_PROFILES, JSON.stringify(filteredProfiles));
  },

  // Current Profile
  getCurrentProfile: (): BusinessProfile | null => {
    const profile = localStorage.getItem(STORAGE_KEYS.CURRENT_PROFILE);
    if (!profile) return null;
    
    const parsedProfile = JSON.parse(profile);
    return convertDatesToObjects(parsedProfile);
  },

  setCurrentProfile: (profile: BusinessProfile): void => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROFILE, JSON.stringify(profile));
  },

  // Invoices
  getInvoices: (): Invoice[] => {
    const invoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!invoices) return [];
    
    const parsedInvoices = JSON.parse(invoices);
    return parsedInvoices.map((invoice: any) => convertDatesToObjects(invoice));
  },

  saveInvoice: (invoice: Invoice): void => {
    const invoices = storageUtils.getInvoices();
    const existingIndex = invoices.findIndex(i => i.id === invoice.id);
    
    if (existingIndex >= 0) {
      invoices[existingIndex] = invoice;
    } else {
      invoices.push(invoice);
    }
    
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  },

  deleteInvoice: (id: string): void => {
    const invoices = storageUtils.getInvoices();
    const filteredInvoices = invoices.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(filteredInvoices));
  },

  getInvoiceById: (id: string): Invoice | null => {
    const invoices = storageUtils.getInvoices();
    return invoices.find(i => i.id === id) || null;
  },

  // Settings
  getSettings: (): any => {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : {
      currency: 'USD',
      taxRate: 0,
      language: 'en',
      dateFormat: 'MM/dd/yyyy',
    };
  },

  saveSettings: (settings: any): void => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },
};