// api/media/sign-upload.ts
// POST: Generate Cloudinary upload signature for secure uploads
import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/authMiddleware.js';
import crypto from 'crypto';

const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { folder = 'invoicepro', resourceType = 'image' } = req.body;
  const userId = req.userId!;

  if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME) {
    return res.status(500).json({ error: 'Cloudinary not configured' });
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folderPath = `${folder}/${userId.substring(0, 8)}`;

    // Parameters to sign (must be in alphabetical order)
    const paramsToSign = {
      folder: folderPath,
      timestamp,
    };

    // Create signature
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
