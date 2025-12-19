// api/payments/mpesa/status.ts
// POST: Check the status of an STK Push transaction
import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../../lib/authMiddleware.js';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

const MPESA_BASE_URL = process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke';
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { checkoutRequestId } = req.body;

  if (!checkoutRequestId) {
    return res.status(400).json({ error: 'Missing checkoutRequestId' });
  }

  try {
    // First check our database for the result
    const { data: successEvent } = await supabaseAdmin
      .from('payment_events')
      .select('*')
      .eq('mpesa_event_id', `${checkoutRequestId}_success`)
      .single();

    if (successEvent) {
      return res.status(200).json({
        status: 'completed',
        message: 'Payment successful',
        receiptNumber: successEvent.payload?.mpesaReceiptNumber,
      });
    }

    const { data: failedEvent } = await supabaseAdmin
      .from('payment_events')
      .select('*')
      .eq('mpesa_event_id', `${checkoutRequestId}_failed`)
      .single();

    if (failedEvent) {
      return res.status(200).json({
        status: 'failed',
        message: failedEvent.payload?.resultDesc || 'Payment failed',
      });
    }

    // If not in our DB yet, query M-Pesa directly
    const authToken = await getMpesaToken();
    
    if (!authToken) {
      return res.status(200).json({ status: 'pending', message: 'Waiting for confirmation' });
    }

    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    const queryResponse = await fetch(`${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    });

    const queryResult = await queryResponse.json();

    if (queryResult.ResultCode === '0') {
      return res.status(200).json({
        status: 'completed',
        message: 'Payment successful',
      });
    } else if (queryResult.ResultCode) {
      return res.status(200).json({
        status: 'failed',
        message: queryResult.ResultDesc || 'Payment failed',
      });
    }

    return res.status(200).json({
      status: 'pending',
      message: 'Payment is being processed',
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return res.status(200).json({ status: 'pending', message: 'Unable to check status' });
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
