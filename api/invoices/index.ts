// api/invoices/index.ts
// GET: List all invoices for the authenticated user (with optional filters)
// POST: Create a new invoice with items
import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/authMiddleware.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

interface InvoiceItemInput {
  description: string;
  quantity?: number;
  rate?: number;
  amount?: number;
}

interface InvoiceCreateBody {
  businessProfileId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientZipCode?: string;
  clientCountry?: string;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  discountRate?: number;
  discountAmount?: number;
  total?: number;
  notes?: string;
  terms?: string;
  dueDate?: string;
  issueDate?: string;
  status?: string;
  template?: string;
  currency?: string;
  items?: InvoiceItemInput[];
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  business_profile_id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  client_address: string | null;
  client_city: string | null;
  client_state: string | null;
  client_zip_code: string | null;
  client_country: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_rate: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  due_date: string | null;
  issue_date: string | null;
  status: string;
  template: string | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
  invoice_items: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }> | null;
}

async function handler(req: AuthenticatedRequest, res: VercelResponse): Promise<VercelResponse> {
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

    let invoices = (data as InvoiceRow[]).map(transformInvoiceToFrontend);

    // Client-side search filter (for simplicity)
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      invoices = invoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(searchLower) ||
          inv.clientName.toLowerCase().includes(searchLower) ||
          inv.clientEmail.toLowerCase().includes(searchLower)
      );
    }

    return res.status(200).json({ invoices });
  }

  if (req.method === 'POST') {
    const body = req.body as InvoiceCreateBody;

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
      const itemsToInsert = body.items.map((item) => ({
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

    return res.status(201).json({ invoice: transformInvoiceToFrontend((completeInvoice || invoice) as InvoiceRow) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function transformInvoiceToFrontend(row: InvoiceRow) {
  const items = (row.invoice_items || []).map((item) => ({
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
