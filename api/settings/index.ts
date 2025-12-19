// api/settings/index.ts
// GET: Fetch user settings (creates default if none exist)
// PUT: Update user settings
import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/authMiddleware';
import { supabaseAdmin } from '../lib/supabaseAdmin';

const DEFAULT_SETTINGS = {
  currency: 'USD',
  tax_rate: 0,
  language: 'en',
  date_format: 'MM/dd/yyyy',
  default_template: 'modern',
  default_notes: '',
  default_terms: '',
  default_due_days: 30,
};

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const userId = req.userId!;

  if (req.method === 'GET') {
    let { data, error } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no settings exist, create default
    if (error || !data) {
      const { data: newSettings, error: createError } = await supabaseAdmin
        .from('user_settings')
        .insert({
          user_id: userId,
          ...DEFAULT_SETTINGS,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating default settings:', createError);
        // Return defaults anyway
        return res.status(200).json({ settings: transformSettingsToFrontend(DEFAULT_SETTINGS) });
      }

      data = newSettings;
    }

    return res.status(200).json({ settings: transformSettingsToFrontend(data) });
  }

  if (req.method === 'PUT') {
    const body = req.body;

    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.taxRate !== undefined) updateData.tax_rate = body.taxRate;
    if (body.language !== undefined) updateData.language = body.language;
    if (body.dateFormat !== undefined) updateData.date_format = body.dateFormat;
    if (body.defaultTemplate !== undefined) updateData.default_template = body.defaultTemplate;
    if (body.defaultNotes !== undefined) updateData.default_notes = body.defaultNotes;
    if (body.defaultTerms !== undefined) updateData.default_terms = body.defaultTerms;
    if (body.defaultDueDays !== undefined) updateData.default_due_days = body.defaultDueDays;

    // Upsert: update if exists, insert if not
    const { data: existing } = await supabaseAdmin
      .from('user_settings')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('user_settings')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({ error: 'Failed to update settings' });
      }
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('user_settings')
        .insert({
          user_id: userId,
          ...DEFAULT_SETTINGS,
          ...updateData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating settings:', error);
        return res.status(500).json({ error: 'Failed to create settings' });
      }
      result = data;
    }

    return res.status(200).json({ settings: transformSettingsToFrontend(result) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function transformSettingsToFrontend(row: any) {
  return {
    currency: row.currency || 'USD',
    taxRate: Number(row.tax_rate) || 0,
    language: row.language || 'en',
    dateFormat: row.date_format || 'MM/dd/yyyy',
    defaultTemplate: row.default_template || 'modern',
    defaultNotes: row.default_notes || '',
    defaultTerms: row.default_terms || '',
    defaultDueDays: Number(row.default_due_days) || 30,
  };
}

export default withAuth(handler);
