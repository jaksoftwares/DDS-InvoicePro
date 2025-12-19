// api/media/index.ts
// GET: List user's media assets
// POST: Store Cloudinary upload metadata after successful upload
// POST with ?action=sign-upload: Generate Cloudinary upload signature
import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/authMiddleware.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import crypto from 'crypto';

const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '';


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
  const { action } = req.query;

  if (req.method === 'POST' && action === 'sign-upload') {
    return await signUpload(req, res, userId);
  }

  switch (req.method) {
    case 'GET':
      return await listMedia(req, res, userId);
    case 'POST':
      return await storeMedia(req, res, userId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function listMedia(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
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

async function storeMedia(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
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

async function signUpload(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
    const { folder = 'invoicepro', resourceType = 'image' } = req.body;

  if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME) {
    return res.status(500).json({ error: 'Cloudinary not configured' });
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folderPath = `${folder}/${userId.substring(0, 8)}`;

    const paramsToSign = {
      folder: folderPath,
      timestamp,
    };

    const sortedParams = Object.keys(paramsToSign)
      .sort()
      .map(key => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`)
      .join('&');

    const signature = crypto
      .createHash('sha1')
      .update(sortedParams + CLOUDINARY_API_SECRET)
      .digest('hex');

    return res.status(200).json({
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder: folderPath,
      resourceType,
    });

  } catch (error) {
    console.error('Error generating upload signature:', error);
    return res.status(500).json({ error: 'Failed to generate upload signature' });
  }
}

export default withAuth(handler);