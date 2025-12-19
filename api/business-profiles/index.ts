// api/business-profiles/index.ts
// Handles all CRUD operations for business profiles.
// GET /api/business-profiles -> list all profiles
// POST /api/business-profiles -> create a new profile
// GET /api/business-profiles?id={id} -> get a single profile
// PUT /api/business-profiles?id={id} -> update a profile
// DELETE /api/business-profiles?id={id} -> delete a profile

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
  const { id } = req.query;

  if (id) {
    // Handle individual resource requests
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid profile ID' });
    }
    switch (req.method) {
      case 'GET':
        return await getProfile(req, res, userId, id);
      case 'PUT':
        return await updateProfile(req, res, userId, id);
      case 'DELETE':
        return await deleteProfile(req, res, userId, id);
      default:
        return res.status(405).json({ error: 'Method not allowed for this resource' });
    }
  } else {
    // Handle collection requests
    switch (req.method) {
      case 'GET':
        return await listProfiles(req, res, userId);
      case 'POST':
        return await createProfile(req, res, userId);
      default:
        return res.status(405).json({ error: 'Method not allowed for this resource' });
    }
  }
}

async function listProfiles(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching business profiles:', error);
      return res.status(500).json({ error: 'Failed to fetch business profiles' });
    }

    const rows = (data ?? []) as unknown as BusinessProfileRow[];
    const profiles = rows.map(transformProfileToFrontend);
    return res.status(200).json({ profiles });
}

async function createProfile(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
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

async function getProfile(req: AuthenticatedRequest, res: VercelResponse, userId: string, id: string) {
    const { data, error } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    return res.status(200).json({ profile: transformProfileToFrontend(data as unknown as BusinessProfileRow) });
}

async function updateProfile(req: AuthenticatedRequest, res: VercelResponse, userId: string, id: string) {
    const body = getBody(req);

    const updateData: Partial<BusinessProfileRow> & { updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.name === 'string') updateData.name = body.name;
    if (typeof body.email === 'string') updateData.email = body.email;
    if (typeof body.phone === 'string' || body.phone === null) updateData.phone = body.phone as string | null;
    if (typeof body.address === 'string' || body.address === null)
      updateData.address = body.address as string | null;
    if (typeof body.city === 'string' || body.city === null) updateData.city = body.city as string | null;
    if (typeof body.state === 'string' || body.state === null) updateData.state = body.state as string | null;
    if (typeof body.zipCode === 'string' || body.zipCode === null)
      updateData.zip_code = body.zipCode as string | null;
    if (typeof body.country === 'string' || body.country === null) updateData.country = body.country as string | null;
    if (typeof body.website === 'string' || body.website === null) updateData.website = body.website as string | null;
    if (typeof body.logoUrl === 'string' || body.logoUrl === null)
      updateData.logo_url = body.logoUrl as string | null;
    if (typeof body.taxNumber === 'string' || body.taxNumber === null)
      updateData.tax_number = body.taxNumber as string | null;

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

    return res.status(200).json({ profile: transformProfileToFrontend(data as unknown as BusinessProfileRow) });
}

async function deleteProfile(req: AuthenticatedRequest, res: VercelResponse, userId: string, id: string) {
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