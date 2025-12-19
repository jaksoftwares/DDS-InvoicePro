// api/payments/mpesa/subscribe.ts
// POST: Initiate M-Pesa STK Push for subscription payment
import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../../lib/authMiddleware.js';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

// M-Pesa configuration from environment
const MPESA_BASE_URL = process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke';
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || '';
const MPESA_ACCOUNT_REFERENCE = process.env.MPESA_ACCOUNT_REFERENCE || 'InvoicePro';
const MPESA_TRANSACTION_DESC = process.env.MPESA_TRANSACTION_DESC || 'Subscription Payment';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.userId!;
  const { planId, phoneNumber } = req.body;

  if (!planId || !phoneNumber) {
    return res.status(400).json({ error: 'Missing planId or phoneNumber' });
  }

  // Validate phone number format (should be 2547XXXXXXXX)
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  if (!cleanPhone.match(/^254\d{9}$/)) {
    return res.status(400).json({ 
      error: 'Invalid phone number format. Use format: 2547XXXXXXXX' 
    });
  }

  // Fetch plan details
  const { data: plan, error: planError } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (planError || !plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  // Calculate amount in KES (plans store price_cents)
  const amount = Math.ceil(plan.price_cents / 100);

  try {
    // Step 1: Get OAuth token
    const authToken = await getMpesaToken();
    
    if (!authToken) {
      return res.status(500).json({ error: 'Failed to authenticate with M-Pesa' });
    }

    // Step 2: Generate timestamp and password
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    // Step 3: Initiate STK Push
    const stkResponse = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: cleanPhone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: cleanPhone,
        CallBackURL: MPESA_CALLBACK_URL,
        AccountReference: `${MPESA_ACCOUNT_REFERENCE}_${userId.substring(0, 8)}`,
        TransactionDesc: MPESA_TRANSACTION_DESC,
      }),
    });

    const stkResult = await stkResponse.json();

    if (stkResult.ResponseCode !== '0') {
      console.error('STK Push failed:', stkResult);
      return res.status(400).json({ 
        error: 'Failed to initiate payment',
        details: stkResult.ResponseDescription || stkResult.errorMessage,
      });
    }

    // Step 4: Store pending payment event
    await supabaseAdmin.from('payment_events').insert({
      user_id: userId,
      mpesa_event_id: stkResult.CheckoutRequestID,
      type: 'mpesa.stkpush.initiated',
      payload: {
        planId,
        phoneNumber: cleanPhone,
        amount,
        checkoutRequestId: stkResult.CheckoutRequestID,
        merchantRequestId: stkResult.MerchantRequestID,
      },
    });

    return res.status(200).json({
      status: 'pending',
      message: 'STK Push initiated. Please complete the payment on your phone.',
      checkoutRequestId: stkResult.CheckoutRequestID,
    });

  } catch (error) {
    console.error('M-Pesa STK Push error:', error);
    return res.status(500).json({ error: 'Payment initiation failed' });
  }
}

async function getMpesaToken(): Promise<string | null> {
  try {
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    
    const response = await fetch(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error('Failed to get M-Pesa token:', error);
    return null;
  }
}

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function generatePassword(timestamp: string): string {
  const data = `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(data).toString('base64');
}

export default withAuth(handler);
