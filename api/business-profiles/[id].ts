// api/business-profiles/[id].ts
// GET: Fetch a single business profile by ID
// PUT: Update a business profile
// DELETE: Delete a business profile
import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/authMiddleware';
import { supabaseAdmin } from '../lib/supabaseAdmin';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const userId = req.userId!;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing profile ID' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    return res.status(200).json({ profile: transformProfileToFrontend(data) });
  }

  if (req.method === 'PUT') {
    const body = req.body;

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.zipCode !== undefined) updateData.zip_code = body.zipCode;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.logoUrl !== undefined) updateData.logo_url = body.logoUrl;
    if (body.taxNumber !== undefined) updateData.tax_number = body.taxNumber;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('business_profiles')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating business profile:', error);
      return res.status(500).json({ error: 'Failed to update business profile' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    return res.status(200).json({ profile: transformProfileToFrontend(data) });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin
      .from('business_profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting business profile:', error);
      return res.status(500).json({ error: 'Failed to delete business profile' });
    }

    return res.status(200).json({ success: true });
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
    logo: row.logo_url || '',
    taxNumber: row.tax_number || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default withAuth(handler);
