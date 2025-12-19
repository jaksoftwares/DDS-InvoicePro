// api/business-profiles/index.ts
// GET: List all business profiles for the authenticated user
// POST: Create a new business profile
import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/authMiddleware.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

type BusinessProfileRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  website: string | null;
  logo_url: string | null;
  tax_number: string | null;
  created_at: string;
  updated_at: string;
};

type BusinessProfileFrontend = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  website: string;
  logoUrl: string;
  logo: string;
  taxNumber: string;
  createdAt: string;
  updatedAt: string;
};

function getBody(req: AuthenticatedRequest): Record<string, unknown> {
  const body = req.body;
  return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
}

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const userId = req.userId!;

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching business profiles:', error);
      return res.status(500).json({ error: 'Failed to fetch business profiles' });
    }

    // Transform snake_case to camelCase for frontend compatibility
    const rows = (data ?? []) as unknown as BusinessProfileRow[];
    const profiles = rows.map(transformProfileToFrontend);
    return res.status(200).json({ profiles });
  }

  if (req.method === 'POST') {
    const body = getBody(req);

    const name = typeof body.name === 'string' ? body.name : undefined;
    const email = typeof body.email === 'string' ? body.email : undefined;
    const phone = typeof body.phone === 'string' ? body.phone : null;
    const address = typeof body.address === 'string' ? body.address : null;
    const city = typeof body.city === 'string' ? body.city : null;
    const state = typeof body.state === 'string' ? body.state : null;
    const zipCode = typeof body.zipCode === 'string' ? body.zipCode : null;
    const country = typeof body.country === 'string' ? body.country : null;
    const website = typeof body.website === 'string' ? body.website : null;
    const logoUrl = typeof body.logoUrl === 'string' ? body.logoUrl : null;
    const taxNumber = typeof body.taxNumber === 'string' ? body.taxNumber : null;

    if (!name || !email) {
      return res.status(400).json({ error: 'Missing required fields: name, email' });
    }

    const { data, error } = await supabaseAdmin
      .from('business_profiles')
      .insert({
        user_id: userId,
        name,
        email,
        phone,
        address,
        city,
        state,
        zip_code: zipCode,
        country,
        website,
        logo_url: logoUrl,
        tax_number: taxNumber,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating business profile:', error);
      return res.status(500).json({ error: 'Failed to create business profile' });
    }

    return res.status(201).json({ profile: transformProfileToFrontend(data as unknown as BusinessProfileRow) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function transformProfileToFrontend(row: BusinessProfileRow): BusinessProfileFrontend {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    address: row.address || '',
    city: row.city || '',
    state: row.state || '',
    zipCode: row.zip_code || '',
    country: row.country || '',
    website: row.website || '',
    logoUrl: row.logo_url || '',
    logo: row.logo_url || '', // Alias for compatibility
    taxNumber: row.tax_number || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default withAuth(handler);
