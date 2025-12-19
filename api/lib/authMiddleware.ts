// api/lib/authMiddleware.ts
// Helper to extract and verify Supabase JWT from Authorization header
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './supabaseAdmin.js';

export interface AuthenticatedRequest extends VercelRequest {
  userId?: string;
  userEmail?: string;
}

export const withAuth = (
  // Vercel handlers frequently `return res.status(...).json(...)`.
  // That return type is `VercelResponse`, not `void`, so allow any return value.
  handler: (req: AuthenticatedRequest, res: VercelResponse) => unknown | Promise<unknown>
) => {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify the JWT using Supabase
      const { data, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !data.user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Attach user info to request
      req.userId = data.user.id;
      req.userEmail = data.user.email;

      return handler(req, res);
    } catch (err) {
      console.error('Auth error:', err);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };
};
