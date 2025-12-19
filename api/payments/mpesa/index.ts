
// api/payments/mpesa/index.ts
// Handles all M-Pesa related payment actions.
// POST ?action=subscribe: Initiate M-Pesa STK Push for subscription payment
// POST ?action=callback: Receive M-Pesa STK Push callback from Safaricom
// POST ?action=status: Check the status of an STK Push transaction

import { VercelRequest, VercelResponse } from '@vercel/node';
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

interface MpesaCallbackItem {
  Name: string;
  Value?: string | number;
}

interface MpesaStkCallback {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: {
    Item: MpesaCallbackItem[];
  };
}

interface MpesaCallbackBody {
  Body: {
    stkCallback: MpesaStkCallback;
  };
}

async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  switch (action) {
    case 'subscribe':
      // withAuth is applied before this handler for this case
      return await subscribe(req as AuthenticatedRequest, res);
    case 'callback':
      // This is an unprotected endpoint for Safaricom to call
      return await callback(req, res);
    case 'status':
       // withAuth is applied before this handler for this case
      return await status(req as AuthenticatedRequest, res);
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}

async function subscribe(req: AuthenticatedRequest, res: VercelResponse) {
  const userId = req.userId!;
  const { planId, phoneNumber } = req.body;

  if (!planId || !phoneNumber) {
    return res.status(400).json({ error: 'Missing planId or phoneNumber' });
  }

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  if (!cleanPhone.match(/^254\d{9}$/)) {
    return res.status(400).json({ 
      error: 'Invalid phone number format. Use format: 2547XXXXXXXX' 
    });
  }

  const { data: plan, error: planError } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (planError || !plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const amount = Math.ceil(plan.price_cents / 100);

  try {
    const authToken = await getMpesaToken();
    if (!authToken) {
      return res.status(500).json({ error: 'Failed to authenticate with M-Pesa' });
    }

    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

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

async function callback(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
  const body = req.body as MpesaCallbackBody;
  console.log('M-Pesa callback received:', JSON.stringify(body, null, 2));

  try {
    const { Body } = body;
    
    if (!Body || !Body.stkCallback) {
      return res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid callback format' });
    }

    const callback = Body.stkCallback;
    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;
    const resultDesc = callback.ResultDesc;

    const { data: paymentEvent } = await supabaseAdmin
      .from('payment_events')
      .select('*')
      .eq('mpesa_event_id', checkoutRequestId)
      .eq('type', 'mpesa.stkpush.initiated')
      .single();

    if (!paymentEvent) {
      console.error('Payment event not found for:', checkoutRequestId);
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const userId = paymentEvent.user_id;
    const planId = paymentEvent.payload?.planId;

    if (resultCode === 0) {
      const metadata = callback.CallbackMetadata?.Item || [];
      const amount = getMetadataValue(metadata, 'Amount');
      const mpesaReceiptNumber = getMetadataValue(metadata, 'MpesaReceiptNumber');
      const transactionDate = getMetadataValue(metadata, 'TransactionDate');
      const phoneNumber = getMetadataValue(metadata, 'PhoneNumber');

      await supabaseAdmin.from('payment_events').insert({
        user_id: userId,
        mpesa_event_id: `${checkoutRequestId}_success`,
        type: 'mpesa.payment.success',
        payload: { checkoutRequestId, mpesaReceiptNumber, amount, transactionDate, phoneNumber, planId },
      });

      const now = new Date();
      const { data: plan } = await supabaseAdmin.from('plans').select('interval').eq('id', planId).single();
      const periodEnd = new Date(now);
      if (plan?.interval === 'year') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const { data: existingSub } = await supabaseAdmin.from('subscriptions').select('id').eq('user_id', userId).single();

      if (existingSub) {
        await supabaseAdmin.from('subscriptions').update({
            plan_id: planId,
            status: 'active',
            mpesa_receipt_number: mpesaReceiptNumber,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            canceled_at: null,
            cancel_at: null,
            updated_at: now.toISOString(),
          }).eq('user_id', userId);
      } else {
        await supabaseAdmin.from('subscriptions').insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          mpesa_receipt_number: mpesaReceiptNumber,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        });
      }
      console.log(`Subscription activated for user ${userId}, plan ${planId}`);
    } else {
      await supabaseAdmin.from('payment_events').insert({
        user_id: userId,
        mpesa_event_id: `${checkoutRequestId}_failed`,
        type: 'mpesa.payment.failed',
        payload: { checkoutRequestId, resultCode, resultDesc, planId },
      });
      console.log(`Payment failed for user ${userId}: ${resultDesc}`);
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}

async function status(req: AuthenticatedRequest, res: VercelResponse) {
  const { checkoutRequestId } = req.body;

  if (!checkoutRequestId) {
    return res.status(400).json({ error: 'Missing checkoutRequestId' });
  }

  try {
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
      return res.status(200).json({ status: 'completed', message: 'Payment successful' });
    } else if (queryResult.ResultCode) {
      return res.status(200).json({ status: 'failed', message: queryResult.ResultDesc || 'Payment failed' });
    }

    return res.status(200).json({ status: 'pending', message: 'Payment is being processed' });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return res.status(200).json({ status: 'pending', message: 'Unable to check status' });
  }
}


// Helper functions
async function getMpesaToken(): Promise<string | null> {
  try {
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    const response = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: { 'Authorization': `Basic ${auth}` },
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

function getMetadataValue(items: MpesaCallbackItem[], name: string): string | number | undefined {
  const item = items.find((i) => i.Name === name);
  return item?.Value;
}

// The main export determines which paths are auth-protected
export default async function (req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  if (action === 'callback') {
    // Unprotected path
    return handler(req, res);
  }
  
  // Protected paths
  return withAuth(handler)(req, res);
}
