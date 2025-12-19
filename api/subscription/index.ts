// api/subscription/index.ts
// GET: Fetch current user's subscription
import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/authMiddleware.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const userId = req.userId!;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // No subscription found
    return res.status(200).json({ subscription: null });
  }

  const subscription = {
    id: data.id,
    planId: data.plan_id,
    plan: data.plans ? {
      id: data.plans.id,
      name: data.plans.name,
      description: data.plans.description,
      priceCents: data.plans.price_cents,
      currency: data.plans.currency,
      interval: data.plans.interval,
      features: data.plans.features || {},
    } : null,
    status: data.status,
    mpesaReceiptNumber: data.mpesa_receipt_number || null,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    cancelAt: data.cancel_at,
    canceledAt: data.canceled_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return res.status(200).json({ subscription });
}

export default withAuth(handler);
