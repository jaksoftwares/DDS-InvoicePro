// src/utils/remoteStorage.ts
// Hybrid storage that syncs with Supabase backend while using localStorage as cache
import { BusinessProfile, Invoice } from '../types';
import { storageUtils } from './storage';
import * as api from '../services/api';

const SYNC_FLAGS = {
  PROFILES_SYNCED: 'invoice_profiles_synced',
  INVOICES_SYNCED: 'invoice_invoices_synced',
  SETTINGS_SYNCED: 'invoice_settings_synced',
};

// Check if user is authenticated
async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await api.getSession();
    return !!session;
  } catch {
    return false;
  }
}

// ============ Business Profiles ============

export const remoteStorageUtils = {
  // Get profiles - try remote first, fallback to local
  async getBusinessProfiles(): Promise<BusinessProfile[]> {
    const isAuth = await isAuthenticated();
    
    if (!isAuth) {
      // Not logged in, use local storage only
      return storageUtils.getBusinessProfiles();
    }

    try {
      const profiles = await api.getBusinessProfiles();
      // Update local cache
      profiles.forEach(p => storageUtils.saveBusinessProfile(p));
      return profiles;
    } catch (error) {
      console.warn('Failed to fetch remote profiles, using local:', error);
      return storageUtils.getBusinessProfiles();
    }
  },

  // Save profile - save to remote and local
  async saveBusinessProfile(profile: BusinessProfile): Promise<BusinessProfile> {
    const isAuth = await isAuthenticated();
    
    // Always save locally first
    storageUtils.saveBusinessProfile(profile);

    if (!isAuth) {
      return profile;
    }

    try {
      // Check if this is an update or create
      const existingProfiles = await api.getBusinessProfiles();
      const existing = existingProfiles.find(p => p.id === profile.id);

      let savedProfile: BusinessProfile;
      if (existing) {
        savedProfile = await api.updateBusinessProfile(profile.id, profile);
      } else {
        savedProfile = await api.createBusinessProfile(profile);
      }

      // Update local with server response (may have different ID)
      storageUtils.saveBusinessProfile(savedProfile);
      return savedProfile;
    } catch (error) {
      console.warn('Failed to save profile remotely:', error);
      return profile;
    }
  },

  // Delete profile
  async deleteBusinessProfile(id: string): Promise<void> {
    const isAuth = await isAuthenticated();
    
    // Delete locally
    storageUtils.deleteBusinessProfile(id);

    if (isAuth) {
      try {
        await api.deleteBusinessProfile(id);
      } catch (error) {
        console.warn('Failed to delete profile remotely:', error);
      }
    }
  },

  // ============ Invoices ============

  async getInvoices(): Promise<Invoice[]> {
    const isAuth = await isAuthenticated();
    
    if (!isAuth) {
      return storageUtils.getInvoices();
    }

    try {
      const invoices = await api.getInvoices();
      // Update local cache
      invoices.forEach(inv => storageUtils.saveInvoice(inv));
      return invoices;
    } catch (error) {
      console.warn('Failed to fetch remote invoices, using local:', error);
      return storageUtils.getInvoices();
    }
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const isAuth = await isAuthenticated();
    
    if (!isAuth) {
      return storageUtils.getInvoiceById(id);
    }

    try {
      const invoice = await api.getInvoice(id);
      storageUtils.saveInvoice(invoice);
      return invoice;
    } catch (error) {
      console.warn('Failed to fetch remote invoice, using local:', error);
      return storageUtils.getInvoiceById(id);
    }
  },

  async saveInvoice(invoice: Invoice): Promise<Invoice> {
    const isAuth = await isAuthenticated();
    
    // Always save locally first
    storageUtils.saveInvoice(invoice);

    if (!isAuth) {
      return invoice;
    }

    try {
      // Need businessProfileId for API
      const businessProfileId = invoice.businessProfile?.id;
      if (!businessProfileId) {
        console.warn('No business profile ID for invoice');
        return invoice;
      }

      // Check if update or create
      let savedInvoice: Invoice;
      try {
        await api.getInvoice(invoice.id);
        // Exists, update it
        savedInvoice = await api.updateInvoice(invoice.id, {
          ...invoice,
          businessProfileId,
        } as any);
      } catch {
        // Doesn't exist, create it
        savedInvoice = await api.createInvoice({
          ...invoice,
          businessProfileId,
        } as any);
      }

      storageUtils.saveInvoice(savedInvoice);
      return savedInvoice;
    } catch (error) {
      console.warn('Failed to save invoice remotely:', error);
      return invoice;
    }
  },

  async deleteInvoice(id: string): Promise<void> {
    const isAuth = await isAuthenticated();
    
    storageUtils.deleteInvoice(id);

    if (isAuth) {
      try {
        await api.deleteInvoice(id);
      } catch (error) {
        console.warn('Failed to delete invoice remotely:', error);
      }
    }
  },

  // ============ Settings ============

  async getSettings(): Promise<any> {
    const isAuth = await isAuthenticated();
    
    if (!isAuth) {
      return storageUtils.getSettings();
    }

    try {
      const settings = await api.getSettings();
      // Merge with local and save
      const localSettings = storageUtils.getSettings();
      const merged = { ...localSettings, ...settings };
      storageUtils.saveSettings(merged);
      return merged;
    } catch (error) {
      console.warn('Failed to fetch remote settings, using local:', error);
      return storageUtils.getSettings();
    }
  },

  async saveSettings(settings: any): Promise<void> {
    const isAuth = await isAuthenticated();
    
    storageUtils.saveSettings(settings);

    if (isAuth) {
      try {
        await api.updateSettings(settings);
      } catch (error) {
        console.warn('Failed to save settings remotely:', error);
      }
    }
  },

  // ============ Current Profile ============

  getCurrentProfile(): BusinessProfile | null {
    return storageUtils.getCurrentProfile();
  },

  setCurrentProfile(profile: BusinessProfile): void {
    storageUtils.setCurrentProfile(profile);
  },

  // ============ Initial Sync ============

  // Call this after login to sync local data to remote
  async syncLocalToRemote(): Promise<void> {
    const isAuth = await isAuthenticated();
    if (!isAuth) return;

    try {
      // Check if already synced
      const profilesSynced = localStorage.getItem(SYNC_FLAGS.PROFILES_SYNCED);
      const invoicesSynced = localStorage.getItem(SYNC_FLAGS.INVOICES_SYNCED);

      // Sync profiles
      if (!profilesSynced) {
        const localProfiles = storageUtils.getBusinessProfiles();
        const remoteProfiles = await api.getBusinessProfiles();

        for (const localProfile of localProfiles) {
          const exists = remoteProfiles.find(rp => rp.id === localProfile.id);
          if (!exists) {
            try {
              await api.createBusinessProfile(localProfile);
            } catch (e) {
              console.warn('Failed to sync profile:', e);
            }
          }
        }
        localStorage.setItem(SYNC_FLAGS.PROFILES_SYNCED, 'true');
      }

      // Sync invoices
      if (!invoicesSynced) {
        const localInvoices = storageUtils.getInvoices();
        const remoteInvoices = await api.getInvoices();

        for (const localInvoice of localInvoices) {
          const exists = remoteInvoices.find(ri => ri.id === localInvoice.id);
          if (!exists && localInvoice.businessProfile?.id) {
            try {
              await api.createInvoice({
                ...localInvoice,
                businessProfileId: localInvoice.businessProfile.id,
              } as any);
            } catch (e) {
              console.warn('Failed to sync invoice:', e);
            }
          }
        }
        localStorage.setItem(SYNC_FLAGS.INVOICES_SYNCED, 'true');
      }

      // Sync settings
      const settingsSynced = localStorage.getItem(SYNC_FLAGS.SETTINGS_SYNCED);
      if (!settingsSynced) {
        const localSettings = storageUtils.getSettings();
        try {
          await api.updateSettings(localSettings);
          localStorage.setItem(SYNC_FLAGS.SETTINGS_SYNCED, 'true');
        } catch (e) {
          console.warn('Failed to sync settings:', e);
        }
      }

    } catch (error) {
      console.error('Sync failed:', error);
    }
  },

  // Reset sync flags (call on logout to allow re-sync on next login)
  resetSyncFlags(): void {
    localStorage.removeItem(SYNC_FLAGS.PROFILES_SYNCED);
    localStorage.removeItem(SYNC_FLAGS.INVOICES_SYNCED);
    localStorage.removeItem(SYNC_FLAGS.SETTINGS_SYNCED);
  },
};

export default remoteStorageUtils;
