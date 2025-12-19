// api/invoices/index.ts
// GET: List all invoices for the authenticated user (with optional filters)
// POST: Create a new invoice with items
import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/authMiddleware';
import { supabaseAdmin } from '../lib/supabaseAdmin';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const userId = req.userId!;

  if (req.method === 'GET') {
    const { status, search } = req.query;

    let query = supabaseAdmin
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      return res.status(500).json({ error: 'Failed to fetch invoices' });
    }

    let invoices = data.map(transformInvoiceToFrontend);

    // Client-side search filter (for simplicity)
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      invoices = invoices.filter(
        (inv: any) =>
          inv.invoiceNumber.toLowerCase().includes(searchLower) ||
          inv.clientName.toLowerCase().includes(searchLower) ||
          inv.clientEmail.toLowerCase().includes(searchLower)
      );
    }

    return res.status(200).json({ invoices });
  }

  if (req.method === 'POST') {
    const body = req.body;

    // Insert invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        user_id: userId,
        business_profile_id: body.businessProfileId,
        invoice_number: body.invoiceNumber,
        client_name: body.clientName,
        client_email: body.clientEmail,
        client_phone: body.clientPhone || null,
        client_address: body.clientAddress || null,
        client_city: body.clientCity || null,
        client_state: body.clientState || null,
        client_zip_code: body.clientZipCode || null,
        client_country: body.clientCountry || null,
        subtotal: body.subtotal || 0,
        tax_rate: body.taxRate || 0,
        tax_amount: body.taxAmount || 0,
        discount_rate: body.discountRate || 0,
        discount_amount: body.discountAmount || 0,
        total: body.total || 0,
        notes: body.notes || null,
        terms: body.terms || null,
        due_date: body.dueDate,
        issue_date: body.issueDate,
        status: body.status || 'draft',
        template: body.template || 'modern',
        currency: body.currency || 'USD',
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      console.error('Error creating invoice:', invoiceError);
      return res.status(500).json({ error: 'Failed to create invoice' });
    }

    // Insert invoice items
    if (body.items && body.items.length > 0) {
      const itemsToInsert = body.items.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity || 1,
        rate: item.rate || 0,
        amount: item.amount || 0,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error creating invoice items:', itemsError);
        // Invoice created but items failed - still return invoice
      }
    }

    // Fetch the complete invoice with items
    const { data: completeInvoice } = await supabaseAdmin
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoice.id)
      .single();

    return res.status(201).json({ invoice: transformInvoiceToFrontend(completeInvoice || invoice) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function transformInvoiceToFrontend(row: any) {
  const items = (row.invoice_items || []).map((item: any) => ({
    id: item.id,
    description: item.description,
    quantity: Number(item.quantity),
    rate: Number(item.rate),
    amount: Number(item.amount),
  }));

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    businessProfileId: row.business_profile_id,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone || '',
    clientAddress: row.client_address || '',
    clientCity: row.client_city || '',
    clientState: row.client_state || '',
    clientZipCode: row.client_zip_code || '',
    clientCountry: row.client_country || '',
    items,
    subtotal: Number(row.subtotal),
    taxRate: Number(row.tax_rate),
    taxAmount: Number(row.tax_amount),
    discountRate: Number(row.discount_rate),
    discountAmount: Number(row.discount_amount),
    total: Number(row.total),
    notes: row.notes || '',
    terms: row.terms || '',
    dueDate: row.due_date,
    issueDate: row.issue_date,
    status: row.status,
    template: row.template,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default withAuth(handler);
