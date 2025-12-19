// api/plans/index.ts
// GET: List all subscription plans (public endpoint)
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data, error } = await supabaseAdmin
    .from('plans')
    .select('*')
    .order('price_cents', { ascending: true });

  if (error) {
    console.error('Error fetching plans:', error);
    return res.status(500).json({ error: 'Failed to fetch plans' });
  }

  const plans = data.map((plan: any) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    priceCents: plan.price_cents,
    currency: plan.currency,
    interval: plan.interval,
    features: plan.features || {},
  }));

  return res.status(200).json({ plans });
}
