// api/invoices/[id].ts
// GET: Fetch a single invoice by ID
// PUT: Update an invoice and its items
// DELETE: Delete an invoice
import { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/authMiddleware';
import { supabaseAdmin } from '../lib/supabaseAdmin';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const userId = req.userId!;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing invoice ID' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*, invoice_items(*), business_profiles(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.status(200).json({ invoice: transformInvoiceToFrontend(data) });
  }

  if (req.method === 'PUT') {
    const body = req.body;

    // Update invoice fields
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (body.businessProfileId !== undefined) updateData.business_profile_id = body.businessProfileId;
    if (body.invoiceNumber !== undefined) updateData.invoice_number = body.invoiceNumber;
    if (body.clientName !== undefined) updateData.client_name = body.clientName;
    if (body.clientEmail !== undefined) updateData.client_email = body.clientEmail;
    if (body.clientPhone !== undefined) updateData.client_phone = body.clientPhone;
    if (body.clientAddress !== undefined) updateData.client_address = body.clientAddress;
    if (body.clientCity !== undefined) updateData.client_city = body.clientCity;
    if (body.clientState !== undefined) updateData.client_state = body.clientState;
    if (body.clientZipCode !== undefined) updateData.client_zip_code = body.clientZipCode;
    if (body.clientCountry !== undefined) updateData.client_country = body.clientCountry;
    if (body.subtotal !== undefined) updateData.subtotal = body.subtotal;
    if (body.taxRate !== undefined) updateData.tax_rate = body.taxRate;
    if (body.taxAmount !== undefined) updateData.tax_amount = body.taxAmount;
    if (body.discountRate !== undefined) updateData.discount_rate = body.discountRate;
    if (body.discountAmount !== undefined) updateData.discount_amount = body.discountAmount;
    if (body.total !== undefined) updateData.total = body.total;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.terms !== undefined) updateData.terms = body.terms;
    if (body.dueDate !== undefined) updateData.due_date = body.dueDate;
    if (body.issueDate !== undefined) updateData.issue_date = body.issueDate;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.template !== undefined) updateData.template = body.template;
    if (body.currency !== undefined) updateData.currency = body.currency;

    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      return res.status(500).json({ error: 'Failed to update invoice' });
    }

    // If items are provided, replace all items
    if (body.items !== undefined) {
      // Delete existing items
      await supabaseAdmin
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      // Insert new items
      if (body.items.length > 0) {
        const itemsToInsert = body.items.map((item: any) => ({
          invoice_id: id,
          description: item.description,
          quantity: item.quantity || 1,
          rate: item.rate || 0,
          amount: item.amount || 0,
        }));

        await supabaseAdmin.from('invoice_items').insert(itemsToInsert);
      }
    }

    // Fetch updated invoice
    const { data: updatedInvoice } = await supabaseAdmin
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', id)
      .single();

    return res.status(200).json({ invoice: transformInvoiceToFrontend(updatedInvoice) });
  }

  if (req.method === 'DELETE') {
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

  // Include business profile if fetched
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
