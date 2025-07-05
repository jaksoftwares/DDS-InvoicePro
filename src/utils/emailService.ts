import emailjs from 'emailjs-com';
import { Invoice } from '../types';
import { formatCurrency } from './invoiceHelpers';
import { format } from 'date-fns';

// Email configuration - these should be set in settings
const EMAIL_CONFIG = {
  SERVICE_ID: 'your_service_id', // Replace with your EmailJS service ID
  TEMPLATE_ID: 'your_template_id', // Replace with your EmailJS template ID
  PUBLIC_KEY: 'your_public_key', // Replace with your EmailJS public key
};

export interface EmailData {
  to_email: string;
  to_name: string;
  from_name: string;
  from_email: string;
  subject: string;
  message: string;
  invoice_number: string;
  invoice_total: string;
  due_date: string;
  business_name: string;
}

export const sendInvoiceEmail = async (
  invoice: Invoice,
  customMessage?: string,
  attachmentUrl?: string
): Promise<boolean> => {
  try {
    // Initialize EmailJS if not already done
    if (!emailjs.init) {
      emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
    }

    const emailData: EmailData = {
      to_email: invoice.clientEmail,
      to_name: invoice.clientName,
      from_name: invoice.businessProfile.name,
      from_email: invoice.businessProfile.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${invoice.businessProfile.name}`,
      message: customMessage || generateDefaultEmailMessage(invoice),
      invoice_number: invoice.invoiceNumber,
      invoice_total: formatCurrency(invoice.total, invoice.currency),
      due_date: format(new Date(invoice.dueDate), 'MMMM dd, yyyy'),
      business_name: invoice.businessProfile.name,
    };

    const response = await emailjs.send(
      EMAIL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.TEMPLATE_ID,
      emailData,
      EMAIL_CONFIG.PUBLIC_KEY
    );

    return response.status === 200;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

const generateDefaultEmailMessage = (invoice: Invoice): string => {
  return `Dear ${invoice.clientName},

I hope this email finds you well. Please find attached invoice ${invoice.invoiceNumber} for the services/products provided.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Issue Date: ${format(new Date(invoice.issueDate), 'MMMM dd, yyyy')}
- Due Date: ${format(new Date(invoice.dueDate), 'MMMM dd, yyyy')}
- Total Amount: ${formatCurrency(invoice.total, invoice.currency)}

${invoice.notes ? `\nAdditional Notes:\n${invoice.notes}` : ''}

${invoice.terms ? `\nTerms & Conditions:\n${invoice.terms}` : ''}

Please don't hesitate to contact us if you have any questions regarding this invoice.

Thank you for your business!

Best regards,
${invoice.businessProfile.name}
${invoice.businessProfile.email}
${invoice.businessProfile.phone}`;
};

export const validateEmailConfiguration = (): boolean => {
  return !!(EMAIL_CONFIG.SERVICE_ID && EMAIL_CONFIG.TEMPLATE_ID && EMAIL_CONFIG.PUBLIC_KEY);
};

export const updateEmailConfiguration = (config: {
  serviceId: string;
  templateId: string;
  publicKey: string;
}): void => {
  EMAIL_CONFIG.SERVICE_ID = config.serviceId;
  EMAIL_CONFIG.TEMPLATE_ID = config.templateId;
  EMAIL_CONFIG.PUBLIC_KEY = config.publicKey;
};