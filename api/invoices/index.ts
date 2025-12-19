// api/invoices/index.ts
// Handles all CRUD operations for invoices.
// GET /api/invoices -> list all invoices
// POST /api/invoices -> create a new invoice
// GET /api/invoices?id={id} -> get a single invoice
// PUT /api/invoices?id={id} -> update an invoice
// DELETE /api/invoices?id={id} -> delete an invoice

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

interface InvoiceUpdateBody extends InvoiceCreateBody {}

interface InvoiceRow {
  id: string;
  user_id: string;
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
  business_profiles: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    country: string | null;
    website: string | null;
    logo_url: string | null;
    tax_number: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const userId = req.userId!;
  const { id } = req.query;

  if (id) {
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid invoice ID' });
    }
    switch (req.method) {
      case 'GET':
        return await getInvoice(req, res, userId, id);
      case 'PUT':
        return await updateInvoice(req, res, userId, id);
      case 'DELETE':
        return await deleteInvoice(req, res, userId, id);
      default:
        return res.status(405).json({ error: 'Method not allowed for this resource' });
    }
  } else {
    switch (req.method) {
      case 'GET':
        return await listInvoices(req, res, userId);
      case 'POST':
        return await createInvoice(req, res, userId);
      default:
        return res.status(405).json({ error: 'Method not allowed for this resource' });
    }
  }
}

async function listInvoices(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
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

async function createInvoice(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
    const body = req.body as InvoiceCreateBody;

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
      }
    }

    const { data: completeInvoice } = await supabaseAdmin
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoice.id)
      .single();

    return res.status(201).json({ invoice: transformInvoiceToFrontend((completeInvoice || invoice) as InvoiceRow) });
}

async function getInvoice(req: AuthenticatedRequest, res: VercelResponse, userId: string, id: string) {
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*, invoice_items(*), business_profiles(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.status(200).json({ invoice: transformInvoiceToFrontend(data as InvoiceRow) });
}

async function updateInvoice(req: AuthenticatedRequest, res: VercelResponse, userId: string, id: string) {
    const body = req.body as InvoiceUpdateBody;

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    
    Object.keys(body).forEach(key => {
        if (key !== 'items') {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            updateData[snakeKey] = (body as any)[key];
        }
    });


    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      return res.status(500).json({ error: 'Failed to update invoice' });
    }

    if (body.items !== undefined) {
      await supabaseAdmin
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      if (body.items.length > 0) {
        const itemsToInsert = body.items.map((item) => ({
          invoice_id: id,
          description: item.description,
          quantity: item.quantity || 1,
          rate: item.rate || 0,
          amount: item.amount || 0,
        }));

        await supabaseAdmin.from('invoice_items').insert(itemsToInsert);
      }
    }

    const { data: updatedInvoice } = await supabaseAdmin
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', id)
      .single();

    return res.status(200).json({ invoice: transformInvoiceToFrontend(updatedInvoice as InvoiceRow) });
}

async function deleteInvoice(req: AuthenticatedRequest, res: VercelResponse, userId: string, id: string) {
    await supabaseAdmin
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

    const { error } = await supabaseAdmin
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting invoice:', error);
      return res.status(500).json({ error: 'Failed to delete invoice' });
    }

    return res.status(200).json({ success: true });
}

function transformInvoiceToFrontend(row: InvoiceRow) {
  const items = (row.invoice_items || []).map((item) => ({
    id: item.id,
    description: item.description,
    quantity: Number(item.quantity),
    rate: Number(item.rate),
    amount: Number(item.amount),
  }));

  let businessProfile = undefined;
  if (row.business_profiles) {
    const bp = row.business_profiles;
    businessProfile = {
      id: bp.id,
      name: bp.name,
      email: bp.email,
      phone: bp.phone || '',
      address: bp.address || '',
      city: bp.city || '',
      state: bp.state || '',
      zipCode: bp.zip_code || '',
      country: bp.country || '',
      website: bp.website || '',
      logoUrl: bp.logo_url || '',
      logo: bp.logo_url || '',
      taxNumber: bp.tax_number || '',
      createdAt: bp.created_at,
      updatedAt: bp.updated_at,
    };
  }

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    businessProfileId: row.business_profile_id,
    businessProfile,
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