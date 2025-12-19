// api/payments/mpesa/callback.ts
// POST: Receive M-Pesa STK Push callback from Safaricom
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Find the original payment event
    const { data: paymentEvent } = await supabaseAdmin
      .from('payment_events')
      .select('*')
      .eq('mpesa_event_id', checkoutRequestId)
      .eq('type', 'mpesa.stkpush.initiated')
      .single();

    if (!paymentEvent) {
      console.error('Payment event not found for:', checkoutRequestId);
      // Still acknowledge to M-Pesa
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const userId = paymentEvent.user_id;
    const planId = paymentEvent.payload?.planId;

    if (resultCode === 0) {
      // Payment successful
      const metadata = callback.CallbackMetadata?.Item || [];
      
      // Extract payment details from callback metadata
      const amount = getMetadataValue(metadata, 'Amount');
      const mpesaReceiptNumber = getMetadataValue(metadata, 'MpesaReceiptNumber');
      const transactionDate = getMetadataValue(metadata, 'TransactionDate');
      const phoneNumber = getMetadataValue(metadata, 'PhoneNumber');

      // Store successful payment event
      await supabaseAdmin.from('payment_events').insert({
        user_id: userId,
        mpesa_event_id: `${checkoutRequestId}_success`,
        type: 'mpesa.payment.success',
        payload: {
          checkoutRequestId,
          mpesaReceiptNumber,
          amount,
          transactionDate,
          phoneNumber,
          planId,
        },
      });

      // Calculate subscription period
      const now = new Date();
      const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('interval')
        .eq('id', planId)
        .single();

      const periodEnd = new Date(now);
      if (plan?.interval === 'year') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Create or update subscription
      const { data: existingSub } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingSub) {
        // Update existing subscription
        await supabaseAdmin
          .from('subscriptions')
          .update({
            plan_id: planId,
            status: 'active',
            mpesa_receipt_number: mpesaReceiptNumber,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            canceled_at: null,
            cancel_at: null,
            updated_at: now.toISOString(),
          })
          .eq('user_id', userId);
      } else {
        // Create new subscription
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
      // Payment failed
      await supabaseAdmin.from('payment_events').insert({
        user_id: userId,
        mpesa_event_id: `${checkoutRequestId}_failed`,
        type: 'mpesa.payment.failed',
        payload: {
          checkoutRequestId,
          resultCode,
          resultDesc,
          planId,
        },
      });

      console.log(`Payment failed for user ${userId}: ${resultDesc}`);
    }

    // Acknowledge receipt to M-Pesa
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    // Still acknowledge to prevent retries
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}

function getMetadataValue(items: MpesaCallbackItem[], name: string): string | number | undefined {
  const item = items.find((i) => i.Name === name);
  return item?.Value;
}
