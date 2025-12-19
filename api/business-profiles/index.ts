// api/business-profiles/index.ts
// GET: List all business profiles for the authenticated user
// POST: Create a new business profile
import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/authMiddleware';
import { supabaseAdmin } from '../lib/supabaseAdmin';

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
    const profiles = data.map(transformProfileToFrontend);
    return res.status(200).json({ profiles });
  }

  if (req.method === 'POST') {
    const body = req.body;

    const { data, error } = await supabaseAdmin
      .from('business_profiles')
      .insert({
        user_id: userId,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        zip_code: body.zipCode || null,
        country: body.country || null,
        website: body.website || null,
        logo_url: body.logoUrl || null,
        tax_number: body.taxNumber || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating business profile:', error);
      return res.status(500).json({ error: 'Failed to create business profile' });
    }

    return res.status(201).json({ profile: transformProfileToFrontend(data) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function transformProfileToFrontend(row: any) {
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
