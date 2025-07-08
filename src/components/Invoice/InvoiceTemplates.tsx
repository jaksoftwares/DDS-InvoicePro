import React from 'react';
import { Invoice } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../utils/invoiceHelpers';
import { format } from 'date-fns';

interface InvoiceTemplateProps {
  invoice: Invoice;
  templateId: string;
}

const ModernTemplate: React.FC<{ invoice: Invoice }> = ({ invoice }) => (
  <div className="bg-white p-8 shadow-lg min-h-[297mm]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
    {/* Header with gradient */}
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 -m-8 mb-8 rounded-t-lg">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          {invoice.businessProfile.logo && (
            <div className="bg-white p-2 rounded-lg">
              <img
                src={invoice.businessProfile.logo}
                alt="Business Logo"
                className="h-12 w-12 object-contain"
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{invoice.businessProfile.name}</h1>
            <p className="text-blue-100 text-sm">{invoice.businessProfile.email}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold">INVOICE</h2>
          <p className="text-lg text-blue-100">#{invoice.invoiceNumber}</p>
        </div>
      </div>
    </div>

    {/* Invoice Details */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-2">Issue Date</h3>
        <p className="text-lg font-medium text-gray-900">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</p>
      </div>
      <div className="bg-indigo-50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-indigo-800 uppercase tracking-wide mb-2">Due Date</h3>
        <p className="text-lg font-medium text-gray-900">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide mb-2">Amount Due</h3>
        <p className="text-lg font-bold text-green-700">{formatCurrency(invoice.total, invoice.currency)}</p>
      </div>
    </div>

    {/* Business and Client Info */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">From</h3>
        <div className="space-y-1 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">{invoice.businessProfile.name}</p>
          <p>{invoice.businessProfile.address}</p>
          <p>{invoice.businessProfile.city}, {invoice.businessProfile.state} {invoice.businessProfile.zipCode}</p>
          <p>{invoice.businessProfile.country}</p>
          <p className="text-blue-600">{invoice.businessProfile.email}</p>
          <p>{invoice.businessProfile.phone}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b-2 border-indigo-600 pb-2">Bill To</h3>
        <div className="space-y-1 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">{invoice.clientName}</p>
          <p>{invoice.clientAddress}</p>
          <p>{invoice.clientCity}, {invoice.clientState} {invoice.clientZipCode}</p>
          <p>{invoice.clientCountry}</p>
          <p className="text-indigo-600">{invoice.clientEmail}</p>
          {invoice.clientPhone && <p>{invoice.clientPhone}</p>}
        </div>
      </div>
    </div>

    {/* Items Table */}
    <div className="mb-8">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
              <th className="border-b-2 border-gray-200 px-6 py-4 text-left text-sm font-semibold text-gray-900">Description</th>
              <th className="border-b-2 border-gray-200 px-6 py-4 text-center text-sm font-semibold text-gray-900">Qty</th>
              <th className="border-b-2 border-gray-200 px-6 py-4 text-right text-sm font-semibold text-gray-900">Rate</th>
              <th className="border-b-2 border-gray-200 px-6 py-4 text-right text-sm font-semibold text-gray-900">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border-b border-gray-200 px-6 py-4 text-sm text-gray-900">{item.description}</td>
                <td className="border-b border-gray-200 px-6 py-4 text-center text-sm text-gray-900">{item.quantity}</td>
                <td className="border-b border-gray-200 px-6 py-4 text-right text-sm text-gray-900">
                  {formatCurrency(item.rate, invoice.currency)}
                </td>
                <td className="border-b border-gray-200 px-6 py-4 text-right text-sm font-medium text-gray-900">
                  {formatCurrency(item.amount, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Totals */}
    <div className="flex justify-end mb-8">
      <div className="w-full max-w-md bg-gray-50 p-6 rounded-lg">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount ({invoice.discountRate}%):</span>
              <span className="font-medium text-red-600">-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
            </div>
          )}
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax ({invoice.taxRate}%):</span>
              <span className="font-medium text-gray-900">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
            </div>
          )}
          <div className="border-t-2 border-gray-300 pt-3">
            <div className="flex justify-between">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-lg font-bold text-blue-600">{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Notes and Terms */}
    {(invoice.notes || invoice.terms) && (
      <div className="space-y-6 border-t-2 border-gray-200 pt-6">
        {invoice.notes && (
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2">Notes:</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{invoice.notes}</p>
          </div>
        )}
        {invoice.terms && (
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2">Terms & Conditions:</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{invoice.terms}</p>
          </div>
        )}
      </div>
    )}
  </div>
);

const ClassicTemplate: React.FC<{ invoice: Invoice }> = ({ invoice }) => (
  <div className="bg-white p-8 shadow-lg min-h-[297mm]" style={{ fontFamily: 'Georgia, serif' }}>
    {/* Elegant Header */}
    <div className="text-center mb-8 border-b-4 border-gray-800 pb-6">
      {invoice.businessProfile.logo && (
        <img
          src={invoice.businessProfile.logo}
          alt="Business Logo"
          className="h-20 w-20 object-contain mx-auto mb-4 border-2 border-gray-300 rounded-full p-2"
        />
      )}
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{invoice.businessProfile.name}</h1>
      <div className="text-sm text-gray-600 space-y-1">
        <p>{invoice.businessProfile.address}</p>
        <p>{invoice.businessProfile.city}, {invoice.businessProfile.state} {invoice.businessProfile.zipCode}</p>
        <p>{invoice.businessProfile.phone} | {invoice.businessProfile.email}</p>
      </div>
    </div>

    {/* Invoice Title */}
    <div className="text-center mb-8">
      <h2 className="text-4xl font-bold text-gray-800 mb-2">INVOICE</h2>
      <p className="text-xl text-gray-600">#{invoice.invoiceNumber}</p>
    </div>

    {/* Invoice Details in Elegant Boxes */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="border-2 border-gray-300 p-4 text-center">
        <h3 className="text-sm font-bold text-gray-800 uppercase mb-2">Issue Date</h3>
        <p className="text-lg font-medium">{format(new Date(invoice.issueDate), 'MMMM dd, yyyy')}</p>
      </div>
      <div className="border-2 border-gray-300 p-4 text-center">
        <h3 className="text-sm font-bold text-gray-800 uppercase mb-2">Due Date</h3>
        <p className="text-lg font-medium">{format(new Date(invoice.dueDate), 'MMMM dd, yyyy')}</p>
      </div>
      <div className="border-2 border-gray-800 bg-gray-800 text-white p-4 text-center">
        <h3 className="text-sm font-bold uppercase mb-2">Amount Due</h3>
        <p className="text-lg font-bold">{formatCurrency(invoice.total, invoice.currency)}</p>
      </div>
    </div>

    {/* Business and Client Information */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <div className="border-2 border-gray-300 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 underline decoration-2">Bill From:</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p className="font-bold text-gray-900">{invoice.businessProfile.name}</p>
          <p>{invoice.businessProfile.address}</p>
          <p>{invoice.businessProfile.city}, {invoice.businessProfile.state} {invoice.businessProfile.zipCode}</p>
          <p>{invoice.businessProfile.country}</p>
          <p>{invoice.businessProfile.email}</p>
          <p>{invoice.businessProfile.phone}</p>
        </div>
      </div>

      <div className="border-2 border-gray-300 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 underline decoration-2">Bill To:</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p className="font-bold text-gray-900">{invoice.clientName}</p>
          <p>{invoice.clientAddress}</p>
          <p>{invoice.clientCity}, {invoice.clientState} {invoice.clientZipCode}</p>
          <p>{invoice.clientCountry}</p>
          <p>{invoice.clientEmail}</p>
          {invoice.clientPhone && <p>{invoice.clientPhone}</p>}
        </div>
      </div>
    </div>

    {/* Items Table */}
    <div className="mb-8">
      <table className="w-full border-4 border-gray-800">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="border-2 border-gray-800 px-4 py-3 text-left text-sm font-bold">Description</th>
            <th className="border-2 border-gray-800 px-4 py-3 text-center text-sm font-bold">Quantity</th>
            <th className="border-2 border-gray-800 px-4 py-3 text-right text-sm font-bold">Rate</th>
            <th className="border-2 border-gray-800 px-4 py-3 text-right text-sm font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="border-2 border-gray-300 px-4 py-3 text-sm text-gray-900">{item.description}</td>
              <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm text-gray-900">{item.quantity}</td>
              <td className="border-2 border-gray-300 px-4 py-3 text-right text-sm text-gray-900">
                {formatCurrency(item.rate, invoice.currency)}
              </td>
              <td className="border-2 border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-900">
                {formatCurrency(item.amount, invoice.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Totals */}
    <div className="flex justify-end mb-8">
      <div className="w-full max-w-md border-4 border-gray-800">
        <div className="bg-gray-100 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-800">Subtotal:</span>
            <span className="font-bold">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-800">Discount:</span>
              <span className="font-bold">-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
            </div>
          )}
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-800">Tax:</span>
              <span className="font-bold">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
            </div>
          )}
        </div>
        <div className="bg-gray-800 text-white p-4">
          <div className="flex justify-between">
            <span className="text-lg font-bold">TOTAL:</span>
            <span className="text-lg font-bold">{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Notes and Terms */}
    {(invoice.notes || invoice.terms) && (
      <div className="space-y-6 border-t-4 border-gray-800 pt-6">
        {invoice.notes && (
          <div className="border-2 border-gray-300 p-4">
            <h4 className="text-sm font-bold text-gray-800 mb-2 underline">Notes:</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{invoice.notes}</p>
          </div>
        )}
        {invoice.terms && (
          <div className="border-2 border-gray-300 p-4">
            <h4 className="text-sm font-bold text-gray-800 mb-2 underline">Terms & Conditions:</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{invoice.terms}</p>
          </div>
        )}
      </div>
    )}
  </div>
);

const MinimalTemplate: React.FC<{ invoice: Invoice }> = ({ invoice }) => (
  <div className="bg-white p-8 shadow-lg min-h-[297mm]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
    {/* Clean Header */}
    <div className="flex justify-between items-start mb-12 pb-6 border-b border-gray-200">
      <div className="flex items-center space-x-4">
        {invoice.businessProfile.logo && (
          <img
            src={invoice.businessProfile.logo}
            alt="Business Logo"
            className="h-16 w-16 object-contain"
          />
        )}
        <div>
          <h1 className="text-2xl font-light text-gray-900">{invoice.businessProfile.name}</h1>
          <p className="text-sm text-gray-500">{invoice.businessProfile.email}</p>
        </div>
      </div>
      <div className="text-right">
        <h2 className="text-4xl font-thin text-gray-900 mb-2">Invoice</h2>
        <p className="text-sm text-gray-500">#{invoice.invoiceNumber}</p>
      </div>
    </div>

    {/* Minimal Info Grid */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Issue Date</p>
        <p className="text-sm font-medium text-gray-900">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
        <p className="text-sm font-medium text-gray-900">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</p>
        <p className="text-sm font-medium text-gray-900 capitalize">{invoice.status}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total</p>
        <p className="text-lg font-semibold text-gray-900">{formatCurrency(invoice.total, invoice.currency)}</p>
      </div>
    </div>

    {/* Address Information */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">From</p>
        <div className="space-y-1 text-sm text-gray-700">
          <p className="font-medium text-gray-900">{invoice.businessProfile.name}</p>
          <p>{invoice.businessProfile.address}</p>
          <p>{invoice.businessProfile.city}, {invoice.businessProfile.state} {invoice.businessProfile.zipCode}</p>
          <p>{invoice.businessProfile.country}</p>
          <p className="text-gray-500">{invoice.businessProfile.phone}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">To</p>
        <div className="space-y-1 text-sm text-gray-700">
          <p className="font-medium text-gray-900">{invoice.clientName}</p>
          <p>{invoice.clientAddress}</p>
          <p>{invoice.clientCity}, {invoice.clientState} {invoice.clientZipCode}</p>
          <p>{invoice.clientCountry}</p>
          <p className="text-gray-500">{invoice.clientEmail}</p>
        </div>
      </div>
    </div>

    {/* Clean Items List */}
    <div className="mb-12">
      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4 pb-2 border-b border-gray-200">
          <div className="col-span-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Description</p>
          </div>
          <div className="col-span-2 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Qty</p>
          </div>
          <div className="col-span-2 text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Rate</p>
          </div>
          <div className="col-span-2 text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Amount</p>
          </div>
        </div>
        
        {invoice.items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-4 py-3 border-b border-gray-100">
            <div className="col-span-6">
              <p className="text-sm font-medium text-gray-900">{item.description}</p>
            </div>
            <div className="col-span-2 text-center">
              <p className="text-sm text-gray-700">{item.quantity}</p>
            </div>
            <div className="col-span-2 text-right">
              <p className="text-sm text-gray-700">{formatCurrency(item.rate, invoice.currency)}</p>
            </div>
            <div className="col-span-2 text-right">
              <p className="text-sm font-medium text-gray-900">{formatCurrency(item.amount, invoice.currency)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Minimal Totals */}
    <div className="flex justify-end mb-12">
      <div className="w-full max-w-xs space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
        </div>
        {invoice.discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Discount</span>
            <span className="font-medium text-gray-900">-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
          </div>
        )}
        {invoice.taxAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tax</span>
            <span className="font-medium text-gray-900">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
          </div>
        )}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-lg font-light text-gray-900">Total</span>
            <span className="text-lg font-semibold text-gray-900">{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Notes */}
    {(invoice.notes || invoice.terms) && (
      <div className="space-y-6 pt-6 border-t border-gray-200">
        {invoice.notes && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-gray-700 leading-relaxed">{invoice.notes}</p>
          </div>
        )}
        {invoice.terms && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Terms</p>
            <p className="text-sm text-gray-700 leading-relaxed">{invoice.terms}</p>
          </div>
        )}
      </div>
    )}
  </div>
);

const ProfessionalTemplate: React.FC<{ invoice: Invoice }> = ({ invoice }) => (
  <div className="bg-white p-8 shadow-lg min-h-[297mm]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
    {/* Professional Header */}
    <div className="border-b-4 border-blue-600 pb-6 mb-8">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-6">
          {invoice.businessProfile.logo && (
            <img
              src={invoice.businessProfile.logo}
              alt="Business Logo"
              className="h-20 w-20 object-contain border border-gray-200 rounded-lg p-2"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{invoice.businessProfile.name}</h1>
            <div className="mt-2 text-sm text-gray-600 space-y-1">
              <p>{invoice.businessProfile.address}</p>
              <p>{invoice.businessProfile.city}, {invoice.businessProfile.state} {invoice.businessProfile.zipCode}</p>
              <p>Tel: {invoice.businessProfile.phone} | Email: {invoice.businessProfile.email}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-blue-600 mb-2">INVOICE</h2>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Invoice Number</p>
            <p className="text-lg font-bold text-gray-900">#{invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>
    </div>

    {/* Invoice Information Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 bg-gray-100 p-3 rounded-lg">BILL TO</h3>
        <div className="space-y-2 text-sm">
          <p className="font-bold text-gray-900 text-lg">{invoice.clientName}</p>
          <p className="text-gray-700">{invoice.clientAddress}</p>
          <p className="text-gray-700">{invoice.clientCity}, {invoice.clientState} {invoice.clientZipCode}</p>
          <p className="text-gray-700">{invoice.clientCountry}</p>
          <p className="text-blue-600 font-medium">{invoice.clientEmail}</p>
          {invoice.clientPhone && <p className="text-gray-700">{invoice.clientPhone}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-800 uppercase">Issue Date</p>
              <p className="text-sm font-medium text-gray-900">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-800 uppercase">Due Date</p>
              <p className="text-sm font-medium text-gray-900">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
          <p className="text-xs font-semibold text-green-800 uppercase mb-1">Total Amount Due</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(invoice.total, invoice.currency)}</p>
        </div>
      </div>
    </div>

    {/* Items Table */}
    <div className="mb-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4">INVOICE DETAILS</h3>
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border border-gray-300 px-4 py-3 text-left text-sm font-bold">DESCRIPTION</th>
              <th className="border border-gray-300 px-4 py-3 text-center text-sm font-bold">QTY</th>
              <th className="border border-gray-300 px-4 py-3 text-right text-sm font-bold">RATE</th>
              <th className="border border-gray-300 px-4 py-3 text-right text-sm font-bold">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{item.description}</td>
                <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-900">{item.quantity}</td>
                <td className="border border-gray-300 px-4 py-3 text-right text-sm text-gray-900">
                  {formatCurrency(item.rate, invoice.currency)}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-900">
                  {formatCurrency(item.amount, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Totals Section */}
    <div className="flex justify-end mb-8">
      <div className="w-full max-w-md">
        <div className="bg-gray-100 border border-gray-300 rounded-lg overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Subtotal:</span>
              <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Discount ({invoice.discountRate}%):</span>
                <span className="font-medium text-red-600">-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Tax ({invoice.taxRate}%):</span>
                <span className="font-medium text-gray-900">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
              </div>
            )}
          </div>
          <div className="bg-blue-600 text-white p-4">
            <div className="flex justify-between">
              <span className="text-lg font-bold">TOTAL:</span>
              <span className="text-lg font-bold">{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Notes and Terms */}
    {(invoice.notes || invoice.terms) && (
      <div className="space-y-6 border-t-2 border-gray-900 pt-6">
        {invoice.notes && (
          <div className="border-2 border-gray-300 p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-2 bg-gray-100 p-2 -m-4 mb-4">Notes:</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{invoice.notes}</p>
          </div>
        )}
        {invoice.terms && (
          <div className="border-2 border-gray-300 p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-2 bg-gray-100 p-2 -m-4 mb-4">Terms & Conditions:</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{invoice.terms}</p>
          </div>
        )}
      </div>
    )}
  </div>
);

const CorporateTemplate: React.FC<{ invoice: Invoice }> = ({ invoice }) => (
  <div className="bg-white p-8 shadow-lg min-h-[297mm]" style={{ fontFamily: 'Times New Roman, serif' }}>
    {/* Corporate Header */}
    <div className="bg-gray-900 text-white p-6 -m-8 mb-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {invoice.businessProfile.logo && (
            <div className="bg-white p-2 rounded">
              <img
                src={invoice.businessProfile.logo}
                alt="Business Logo"
                className="h-16 w-16 object-contain"
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{invoice.businessProfile.name}</h1>
            <p className="text-gray-300 text-sm">{invoice.businessProfile.email}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold">INVOICE</h2>
          <p className="text-xl text-gray-300">#{invoice.invoiceNumber}</p>
        </div>
      </div>
    </div>

    {/* Corporate Info Section */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gray-100 p-4 border-l-4 border-gray-900">
        <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">Invoice Date</h3>
        <p className="text-lg font-medium">{format(new Date(invoice.issueDate), 'MMMM dd, yyyy')}</p>
      </div>
      <div className="bg-gray-100 p-4 border-l-4 border-gray-900">
        <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">Payment Due</h3>
        <p className="text-lg font-medium">{format(new Date(invoice.dueDate), 'MMMM dd, yyyy')}</p>
      </div>
      <div className="bg-gray-900 text-white p-4">
        <h3 className="text-sm font-bold uppercase mb-2">Amount Due</h3>
        <p className="text-xl font-bold">{formatCurrency(invoice.total, invoice.currency)}</p>
      </div>
    </div>

    {/* Business and Client Details */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <div className="border border-gray-300 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 bg-gray-900 text-white p-2 -m-6 mb-4">FROM</h3>
        <div className="space-y-2 text-sm text-gray-700 mt-4">
          <p className="font-bold text-gray-900">{invoice.businessProfile.name}</p>
          <p>{invoice.businessProfile.address}</p>
          <p>{invoice.businessProfile.city}, {invoice.businessProfile.state} {invoice.businessProfile.zipCode}</p>
          <p>{invoice.businessProfile.country}</p>
          <p>{invoice.businessProfile.email}</p>
          <p>{invoice.businessProfile.phone}</p>
        </div>
      </div>

      <div className="border border-gray-300 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 bg-gray-900 text-white p-2 -m-6 mb-4">TO</h3>
        <div className="space-y-2 text-sm text-gray-700 mt-4">
          <p className="font-bold text-gray-900">{invoice.clientName}</p>
          <p>{invoice.clientAddress}</p>
          <p>{invoice.clientCity}, {invoice.clientState} {invoice.clientZipCode}</p>
          <p>{invoice.clientCountry}</p>
          <p>{invoice.clientEmail}</p>
          {invoice.clientPhone && <p>{invoice.clientPhone}</p>}
        </div>
      </div>
    </div>

    {/* Items Table */}
    <div className="mb-8">
      <table className="w-full border-2 border-gray-900">
        <thead>
          <tr className="bg-gray-900 text-white">
            <th className="border border-gray-900 px-4 py-3 text-left text-sm font-bold">DESCRIPTION</th>
            <th className="border border-gray-900 px-4 py-3 text-center text-sm font-bold">QTY</th>
            <th className="border border-gray-900 px-4 py-3 text-right text-sm font-bold">RATE</th>
            <th className="border border-gray-900 px-4 py-3 text-right text-sm font-bold">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">{item.description}</td>
              <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-900">{item.quantity}</td>
              <td className="border border-gray-300 px-4 py-3 text-right text-sm text-gray-900">
                {formatCurrency(item.rate, invoice.currency)}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-900">
                {formatCurrency(item.amount, invoice.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Totals */}
    <div className="flex justify-end mb-8">
      <div className="w-full max-w-md border-2 border-gray-900">
        <div className="bg-gray-100 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-bold text-gray-900">SUBTOTAL:</span>
            <span className="font-bold">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="font-bold text-gray-900">DISCOUNT:</span>
              <span className="font-bold">-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
            </div>
          )}
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="font-bold text-gray-900">TAX:</span>
              <span className="font-bold">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
            </div>
          )}
        </div>
        <div className="bg-gray-900 text-white p-4">
          <div className="flex justify-between">
            <span className="text-lg font-bold">TOTAL:</span>
            <span className="text-lg font-bold">{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Notes and Terms */}
    {(invoice.notes || invoice.terms) && (
      <div className="space-y-6 border-t-2 border-gray-900 pt-6">
        {invoice.notes && (
          <div className="border border-gray-300 p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-2 bg-gray-100 p-2 -m-4 mb-4">NOTES</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{invoice.notes}</p>
          </div>
        )}
        {invoice.terms && (
          <div className="border border-gray-300 p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-2 bg-gray-100 p-2 -m-4 mb-4">TERMS & CONDITIONS</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{invoice.terms}</p>
          </div>
        )}
      </div>
    )}
  </div>
);

const ElegantTemplate: React.FC<{ invoice: Invoice }> = ({ invoice }) => (
  <div className="bg-white p-8 shadow-lg min-h-[297mm]" style={{ fontFamily: 'Playfair Display, serif' }}>
    {/* Elegant Header */}
    <div className="text-center mb-12 border-b border-gray-300 pb-8">
      {invoice.businessProfile.logo && (
        <img
          src={invoice.businessProfile.logo}
          alt="Business Logo"
          className="h-24 w-24 object-contain mx-auto mb-6 rounded-full border-4 border-gray-200 p-2"
        />
      )}
      <h1 className="text-4xl font-bold text-gray-800 mb-3">{invoice.businessProfile.name}</h1>
      <div className="text-sm text-gray-600 space-y-1 italic">
        <p>{invoice.businessProfile.address}</p>
        <p>{invoice.businessProfile.city}, {invoice.businessProfile.state} {invoice.businessProfile.zipCode}</p>
        <p>{invoice.businessProfile.phone} • {invoice.businessProfile.email}</p>
      </div>
    </div>

    {/* Elegant Invoice Title */}
    <div className="text-center mb-10">
      <h2 className="text-5xl font-light text-gray-700 mb-4">Invoice</h2>
      <div className="inline-block bg-gray-100 px-6 py-2 rounded-full">
        <p className="text-lg font-medium text-gray-800">#{invoice.invoiceNumber}</p>
      </div>
    </div>

    {/* Elegant Date Section */}
    <div className="flex justify-center mb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Issue Date</p>
          <p className="text-lg font-medium text-gray-800">{format(new Date(invoice.issueDate), 'MMMM dd, yyyy')}</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Due Date</p>
          <p className="text-lg font-medium text-gray-800">{format(new Date(invoice.dueDate), 'MMMM dd, yyyy')}</p>
        </div>
        <div className="bg-gray-800 text-white p-6 rounded-lg">
          <p className="text-xs text-gray-300 uppercase tracking-widest mb-2">Amount Due</p>
          <p className="text-xl font-bold">{formatCurrency(invoice.total, invoice.currency)}</p>
        </div>
      </div>
    </div>

    {/* Client Information */}
    <div className="text-center mb-12">
      <h3 className="text-2xl font-light text-gray-700 mb-6">Billed To</h3>
      <div className="inline-block text-left bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div className="space-y-2 text-sm text-gray-700">
          <p className="text-lg font-medium text-gray-900">{invoice.clientName}</p>
          <p>{invoice.clientAddress}</p>
          <p>{invoice.clientCity}, {invoice.clientState} {invoice.clientZipCode}</p>
          <p>{invoice.clientCountry}</p>
          <p className="text-gray-600 italic">{invoice.clientEmail}</p>
          {invoice.clientPhone && <p>{invoice.clientPhone}</p>}
        </div>
      </div>
    </div>

    {/* Elegant Items Section */}
    <div className="mb-12">
      <h3 className="text-2xl font-light text-gray-700 mb-6 text-center">Services Provided</h3>
      <div className="space-y-4">
        {invoice.items.map((item) => (
          <div key={item.id} className="flex justify-between items-center p-4 border-b border-gray-200 last:border-b-0">
            <div className="flex-1">
              <p className="text-lg font-medium text-gray-900">{item.description}</p>
              <p className="text-sm text-gray-600">Quantity: {item.quantity} × {formatCurrency(item.rate, invoice.currency)}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-medium text-gray-900">{formatCurrency(item.amount, invoice.currency)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Elegant Totals */}
    <div className="flex justify-center mb-12">
      <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount</span>
              <span className="font-medium text-gray-900">-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
            </div>
          )}
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium text-gray-900">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
            </div>
          )}
        </div>
        <div className="bg-gray-800 text-white p-6">
          <div className="flex justify-between">
            <span className="text-xl font-light">Total</span>
            <span className="text-xl font-bold">{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Notes and Terms */}
    {(invoice.notes || invoice.terms) && (
      <div className="space-y-8 border-t border-gray-300 pt-8">
        {invoice.notes && (
          <div className="text-center">
            <h4 className="text-lg font-light text-gray-700 mb-4">Notes</h4>
            <p className="text-sm text-gray-600 leading-relaxed italic max-w-2xl mx-auto">{invoice.notes}</p>
          </div>
        )}
        {invoice.terms && (
          <div className="text-center">
            <h4 className="text-lg font-light text-gray-700 mb-4">Terms & Conditions</h4>
            <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">{invoice.terms}</p>
          </div>
        )}
      </div>
    )}
  </div>
);

const CreativeTemplate: React.FC<{ invoice: Invoice }> = ({ invoice }) => (
  <div className="bg-white p-8 shadow-lg min-h-[297mm]" style={{ fontFamily: 'Poppins, sans-serif' }}>
    {/* Creative Header */}
    <div className="relative mb-12">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-2xl transform rotate-1"></div>
      <div className="relative bg-white p-8 rounded-2xl border-2 border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-6">
            {invoice.businessProfile.logo && (
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-xl">
                <img
                  src={invoice.businessProfile.logo}
                  alt="Business Logo"
                  className="h-16 w-16 object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {invoice.businessProfile.name}
              </h1>
              <p className="text-gray-600 mt-1">{invoice.businessProfile.email}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-gray-800">INVOICE</h2>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full mt-2">
              <p className="text-sm font-medium">#{invoice.invoiceNumber}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Creative Info Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-l-4 border-blue-500">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 text-white p-2 rounded-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-800 uppercase">Issue Date</p>
            <p className="text-sm font-bold text-gray-900">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-l-4 border-orange-500">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-500 text-white p-2 rounded-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-orange-800 uppercase">Due Date</p>
            <p className="text-sm font-bold text-gray-900">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-l-4 border-green-500">
        <div className="flex items-center space-x-3">
          <div className="bg-green-500 text-white p-2 rounded-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-6-8a6 6 0 1112 0 6 6 0 01-12 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-green-800 uppercase">Total</p>
            <p className="text-lg font-bold text-green-700">{formatCurrency(invoice.total, invoice.currency)}</p>
          </div>
        </div>
      </div>
    </div>

    {/* Client Information */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="bg-purple-500 text-white p-2 rounded-lg mr-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v.01h12V6H4zm0 2v6h12V8H4z" clipRule="evenodd" />
            </svg>
          </span>
          From
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p className="font-bold text-gray-900">{invoice.businessProfile.name}</p>
          <p>{invoice.businessProfile.address}</p>
          <p>{invoice.businessProfile.city}, {invoice.businessProfile.state} {invoice.businessProfile.zipCode}</p>
          <p>{invoice.businessProfile.country}</p>
          <p className="text-purple-600">{invoice.businessProfile.email}</p>
          <p>{invoice.businessProfile.phone}</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="bg-pink-500 text-white p-2 rounded-lg mr-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </span>
          To
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p className="font-bold text-gray-900">{invoice.clientName}</p>
          <p>{invoice.clientAddress}</p>
          <p>{invoice.clientCity}, {invoice.clientState} {invoice.clientZipCode}</p>
          <p>{invoice.clientCountry}</p>
          <p className="text-pink-600">{invoice.clientEmail}</p>
          {invoice.clientPhone && <p>{invoice.clientPhone}</p>}
        </div>
      </div>
    </div>

    {/* Creative Items List */}
    <div className="mb-12">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Invoice Items</h3>
      <div className="space-y-4">
        {invoice.items.map((item) => (
          <div key={item.id} className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.description}</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    Qty: {item.quantity}
                  </span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    Rate: {formatCurrency(item.rate, invoice.currency)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {formatCurrency(item.amount, invoice.currency)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Creative Totals */}
    <div className="flex justify-end mb-12">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-red-600">-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium text-gray-900">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
              </div>
            )}
            <div className="border-t-2 border-purple-200 pt-4">
              <div className="flex justify-between">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {formatCurrency(invoice.total, invoice.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Notes and Terms */}
    {(invoice.notes || invoice.terms) && (
      <div className="space-y-6">
        {invoice.notes && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border-l-4 border-yellow-400">
            <h4 className="text-lg font-bold text-yellow-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Notes
            </h4>
            <p className="text-sm text-yellow-700 leading-relaxed">{invoice.notes}</p>
          </div>
        )}
        {invoice.terms && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-l-4 border-blue-400">
            <h4 className="text-lg font-bold text-blue-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 002-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Terms & Conditions
            </h4>
            <p className="text-sm text-blue-700 leading-relaxed">{invoice.terms}</p>
          </div>
        )}
      </div>
    )}
  </div>
);

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, templateId }) => {
  switch (templateId) {
    case 'classic':
      return <ClassicTemplate invoice={invoice} />;
    case 'minimal':
      return <MinimalTemplate invoice={invoice} />;
    case 'professional':
      return <ProfessionalTemplate invoice={invoice} />;
    case 'corporate':
      return <CorporateTemplate invoice={invoice} />;
    case 'elegant':
      return <ElegantTemplate invoice={invoice} />;
    case 'creative':
      return <CreativeTemplate invoice={invoice} />;
    case 'modern':
    default:
      return <ModernTemplate invoice={invoice} />;
  }
};

export default InvoiceTemplate;