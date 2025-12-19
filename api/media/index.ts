// api/media/index.ts
// GET: List user's media assets
// POST: Store Cloudinary upload metadata after successful upload
import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/authMiddleware.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

interface MediaCreateBody {
  publicId: string;
  url: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
  width?: number;
  height?: number;
  businessProfileId?: string;
  invoiceId?: string;
}

interface MediaAssetRow {
  id: string;
  public_id: string;
  url: string;
  format: string | null;
  resource_type: string;
  bytes: number | null;
  width: number | null;
  height: number | null;
  business_profile_id: string | null;
  invoice_id: string | null;
  created_at: string;
}

async function handler(req: AuthenticatedRequest, res: VercelResponse): Promise<VercelResponse> {
  const userId = req.userId!;

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('media_assets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching media:', error);
      return res.status(500).json({ error: 'Failed to fetch media' });
    }

    const media = (data as MediaAssetRow[]).map((m) => ({
      id: m.id,
      publicId: m.public_id,
      url: m.url,
      format: m.format,
      resourceType: m.resource_type,
      bytes: m.bytes,
      width: m.width,
      height: m.height,
      businessProfileId: m.business_profile_id,
      invoiceId: m.invoice_id,
      createdAt: m.created_at,
    }));

    return res.status(200).json({ media });
  }

  if (req.method === 'POST') {
    const body = req.body as MediaCreateBody;

    if (!body.publicId || !body.url) {
      return res.status(400).json({ error: 'Missing publicId or url' });
    }

    const { data, error } = await supabaseAdmin
      .from('media_assets')
      .insert({
        user_id: userId,
        public_id: body.publicId,
        url: body.url,
        format: body.format || null,
        resource_type: body.resourceType || 'image',
        bytes: body.bytes || null,
        width: body.width || null,
        height: body.height || null,
        business_profile_id: body.businessProfileId || null,
        invoice_id: body.invoiceId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing media:', error);
      return res.status(500).json({ error: 'Failed to store media' });
    }

    const row = data as MediaAssetRow;

    return res.status(201).json({
      media: {
        id: row.id,
        publicId: row.public_id,
        url: row.url,
        format: row.format,
        resourceType: row.resource_type,
        bytes: row.bytes,
        width: row.width,
        height: row.height,
        businessProfileId: row.business_profile_id,
        invoiceId: row.invoice_id,
        createdAt: row.created_at,
      },
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
