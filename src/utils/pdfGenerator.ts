import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '../types';
import { format } from 'date-fns';
import { getCurrencySymbol } from '../utils/invoiceHelpers';

export const generateInvoicePDF = async (invoice: Invoice, elementId: string): Promise<void> => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error('Invoice element not found');
  }

  try {
    // Calculate the A4 aspect ratio for the canvas
    const a4WidthPx = 2480; // 210mm at 300dpi
    const a4HeightPx = 3508; // 297mm at 300dpi
    const scale = Math.max(a4WidthPx / element.scrollWidth, a4HeightPx / element.scrollHeight);

    // Create high-resolution canvas with correct aspect ratio
    const canvas = await html2canvas(element, {
      scale: scale, // Dynamically scale to fill A4
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Calculate dimensions for A4 page
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF with optimized settings
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > pageHeight) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // Generate filename with invoice number and date
    const fileName = `invoice-${invoice.invoiceNumber}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    
    // Save the PDF
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF generation error:', error);
    
    // Fallback to quick PDF generation if html2canvas fails
    generateQuickPDF(invoice);
  }
};

export const generateQuickPDF = (invoice: Invoice): void => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Center the content block: use larger margins
    const contentBlockWidth = Math.min(140, pageWidth * 0.7); // 70% of page or 140mm max
    const leftMargin = (pageWidth - contentBlockWidth) / 2;
    const rightMargin = leftMargin;
    const contentWidth = contentBlockWidth;
    const minContentHeight = pageHeight * 0.75;

    // Prepare lines for from/to
    const fromLines = [
      invoice.businessProfile.name,
      invoice.businessProfile.email,
      invoice.businessProfile.phone,
      invoice.businessProfile.address,
      `${invoice.businessProfile.city}, ${invoice.businessProfile.state} ${invoice.businessProfile.zipCode}`,
      invoice.businessProfile.country
    ].filter(Boolean);
    const toLines = [
      invoice.clientName,
      invoice.clientEmail,
      invoice.clientPhone,
      invoice.clientAddress,
      `${invoice.clientCity}, ${invoice.clientState} ${invoice.clientZipCode}`,
      invoice.clientCountry
    ].filter(Boolean);

    // --- Calculate content height for vertical centering ---
    let contentHeight = 0;
    let y = 0;
    contentHeight += 20; // Header
    y += 20;
    contentHeight += 10;
    y += 10;
    contentHeight += 10;
    y += 18;
    contentHeight += 10;
    y += 10;
    contentHeight += Math.max(fromLines.length, toLines.length) * 6;
    y += Math.max(fromLines.length, toLines.length) * 6 + 14;
    contentHeight += 8;
    y += 8;
    contentHeight += 6;
    y += 6;
    invoice.items.forEach(() => {
      contentHeight += 10;
      y += 10;
    });
    y += 6;
    contentHeight += 6;
    contentHeight += 8;
    y += 8;
    if (invoice.discountAmount > 0) {
      contentHeight += 8;
      y += 8;
    }
    if (invoice.taxAmount > 0) {
      contentHeight += 8;
      y += 8;
    }
    contentHeight += 14;
    y += 14;
    if (invoice.notes || invoice.terms) {
      y += 12;
      contentHeight += 12;
      if (invoice.notes) {
        contentHeight += 8;
        y += 8;
        const noteLines = pdf.splitTextToSize(invoice.notes ?? '', contentWidth - 4);
        contentHeight += noteLines.length * 6 + 4;
        y += noteLines.length * 6 + 4;
      }
      if (invoice.terms) {
        contentHeight += 8;
        y += 8;
        const termLines = pdf.splitTextToSize(invoice.terms ?? '', contentWidth - 4);
        contentHeight += termLines.length * 6;
        y += termLines.length * 6;
      }
    }

    // --- Calculate vertical offset for centering ---
    const topOffset = Math.max((pageHeight - Math.max(contentHeight, minContentHeight)) / 2, 10);
    const drawY = topOffset;
    y = drawY;

    // --- Draw content ---
    pdf.setFontSize(28);
    pdf.setTextColor(59, 130, 246);
    pdf.text('INVOICE', pageWidth / 2, y, { align: 'center' });
    y += 20;
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Invoice #: ${invoice.invoiceNumber}`, leftMargin, y);
    pdf.text(`Date: ${format(new Date(invoice.issueDate), 'MM/dd/yyyy')}`, pageWidth - rightMargin, y, { align: 'right' });
    y += 10;
    pdf.text(`Due Date: ${format(new Date(invoice.dueDate), 'MM/dd/yyyy')}`, pageWidth - rightMargin, y, { align: 'right' });
    y += 18;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('From:', leftMargin, y);
    pdf.text('To:', pageWidth / 2 + 10, y);
    y += 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    fromLines.forEach((line, index) => {
      pdf.text(line, leftMargin, y + (index * 6));
    });
    toLines.forEach((line, index) => {
      pdf.text(line ?? '', pageWidth / 2 + 10, y + (index * 6));
    });
    y += Math.max(fromLines.length, toLines.length) * 6 + 14;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(240, 240, 240);
    pdf.rect(leftMargin, y - 6, contentWidth, 10, 'F');
    // Table columns: Description (60%), Qty (10%), Rate (15%), Amount (15%)
    const descX = leftMargin + 2;
    const qtyX = leftMargin + contentWidth * 0.62;
    const rateX = leftMargin + contentWidth * 0.75;
    const amtX = leftMargin + contentWidth * 0.90;
    pdf.text('Description', descX, y);
    pdf.text('Qty', qtyX, y, { align: 'center' });
    pdf.text('Rate', rateX, y, { align: 'right' });
    pdf.text('Amount', amtX, y, { align: 'right' });
    y += 8;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(leftMargin, y, leftMargin + contentWidth, y);
    y += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    invoice.items.forEach((item) => {
      pdf.text(item.description, descX, y);
      pdf.text(item.quantity.toString(), qtyX, y, { align: 'center' });
      pdf.text(`${getCurrencySymbol(invoice.currency)} ${item.rate.toFixed(2)}`, rateX, y, { align: 'right' });
      pdf.text(`${getCurrencySymbol(invoice.currency)} ${item.amount.toFixed(2)}`, amtX, y, { align: 'right' });
      y += 10;
    });
    y += 6;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(leftMargin + contentWidth * 0.5, y, leftMargin + contentWidth, y);
    y += 8;
    const totalsX2 = leftMargin + contentWidth * 0.5 + 2;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    pdf.text(`Subtotal: ${getCurrencySymbol(invoice.currency)} ${invoice.subtotal.toFixed(2)}`, totalsX2, y, { align: 'left' });
    y += 8;
    if (invoice.discountAmount > 0) {
      pdf.text(`Discount: ${getCurrencySymbol(invoice.currency)} ${invoice.discountAmount.toFixed(2)}`, totalsX2, y, { align: 'left' });
      y += 8;
    }
    if (invoice.taxAmount > 0) {
      pdf.text(`Tax: ${getCurrencySymbol(invoice.currency)} ${invoice.taxAmount.toFixed(2)}`, totalsX2, y, { align: 'left' });
      y += 8;
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text(`Total: ${getCurrencySymbol(invoice.currency)} ${invoice.total.toFixed(2)}`, totalsX2, y, { align: 'left' });
    pdf.setFontSize(12);
    y += 14;
    if (invoice.notes || invoice.terms) {
      y += 12;
      if (invoice.notes) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Notes:', leftMargin, y);
        y += 8;
        pdf.setFont('helvetica', 'normal');
        const noteLines = pdf.splitTextToSize(invoice.notes ?? '', contentWidth - 4);
        pdf.text(noteLines, leftMargin, y);
        y += noteLines.length * 6 + 4;
      }
      if (invoice.terms) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Terms & Conditions:', leftMargin, y);
        y += 8;
        pdf.setFont('helvetica', 'normal');
        const termLines = pdf.splitTextToSize(invoice.terms ?? '', contentWidth - 4);
        pdf.text(termLines, leftMargin, y);
        y += termLines.length * 6;
      }
    }

    // Download
    const fileName = `invoice-${invoice.invoiceNumber}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Quick PDF generation error:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};