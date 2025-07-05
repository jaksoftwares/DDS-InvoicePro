import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, Eye, Download, Calendar, DollarSign, Building2, Palette, Mail } from 'lucide-react';
import { Invoice, InvoiceItem, BusinessProfile } from '../../types';
import { storageUtils } from '../../utils/storage';
import { generateInvoiceNumber, calculateInvoiceTotals } from '../../utils/invoiceHelpers';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import InvoiceTemplate from './InvoiceTemplates';
import EmailModal from './EmailModal';

const InvoiceCreator: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<BusinessProfile | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    invoiceNumber: generateInvoiceNumber(),
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    clientCity: '',
    clientState: '',
    clientZipCode: '',
    clientCountry: '',
    items: [],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    discountRate: 0,
    discountAmount: 0,
    total: 0,
    notes: '',
    terms: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    issueDate: new Date(),
    status: 'draft',
    template: 'modern',
    currency: 'USD',
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const templateOptions = [
    { id: 'modern', name: 'Modern', description: 'Clean gradient design with professional layout' },
    { id: 'classic', name: 'Classic', description: 'Traditional formal invoice with elegant borders' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and clean design with subtle typography' },
    { id: 'professional', name: 'Professional', description: 'Corporate style with structured layout' },
    { id: 'corporate', name: 'Corporate', description: 'Formal business template with dark accents' },
    { id: 'elegant', name: 'Elegant', description: 'Sophisticated design with refined typography' },
    { id: 'creative', name: 'Creative', description: 'Modern colorful design with gradient elements' },
  ];

  useEffect(() => {
    const loadData = () => {
      const profiles = storageUtils.getBusinessProfiles();
      const currentProfile = storageUtils.getCurrentProfile();
      
      setBusinessProfiles(profiles);
      
      if (isEditing && id) {
        const savedInvoice = storageUtils.getInvoiceById(id);
        if (savedInvoice) {
          setInvoice(savedInvoice);
          setSelectedProfile(savedInvoice.businessProfile);
        }
      } else if (currentProfile) {
        setSelectedProfile(currentProfile);
      } else if (profiles.length > 0) {
        setSelectedProfile(profiles[0]);
      }

      // Load default settings
      const settings = storageUtils.getSettings();
      setInvoice(prev => ({
        ...prev,
        currency: settings.currency || 'USD',
        taxRate: settings.taxRate || 0,
        template: settings.defaultTemplate || 'modern',
        notes: settings.defaultNotes || '',
        terms: settings.defaultTerms || '',
        dueDate: new Date(Date.now() + (settings.defaultDueDays || 30) * 24 * 60 * 60 * 1000),
      }));
    };

    loadData();
  }, [isEditing, id]);

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    setInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoice(prev => ({
      ...prev,
      items: (prev.items || []).map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const removeItem = (itemId: string) => {
    setInvoice(prev => ({
      ...prev,
      items: (prev.items || []).filter(item => item.id !== itemId),
    }));
  };

  const calculateTotals = () => {
    const items = invoice.items || [];
    const totals = calculateInvoiceTotals(items, invoice.taxRate || 0, invoice.discountRate || 0);
    setInvoice(prev => ({ ...prev, ...totals }));
  };

  useEffect(() => {
    calculateTotals();
  }, [invoice.items, invoice.taxRate, invoice.discountRate]);

  const handleSave = async () => {
    if (!selectedProfile) {
      alert('Please select a business profile');
      return;
    }

    if (!invoice.clientName || !invoice.clientEmail) {
      alert('Please fill in client information');
      return;
    }

    if (!invoice.items || invoice.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setIsSaving(true);

    try {
      const invoiceData: Invoice = {
        id: invoice.id || Date.now().toString(),
        invoiceNumber: invoice.invoiceNumber!,
        businessProfile: selectedProfile,
        clientName: invoice.clientName!,
        clientEmail: invoice.clientEmail!,
        clientPhone: invoice.clientPhone || '',
        clientAddress: invoice.clientAddress || '',
        clientCity: invoice.clientCity || '',
        clientState: invoice.clientState || '',
        clientZipCode: invoice.clientZipCode || '',
        clientCountry: invoice.clientCountry || '',
        items: invoice.items!,
        subtotal: invoice.subtotal!,
        taxRate: invoice.taxRate!,
        taxAmount: invoice.taxAmount!,
        discountRate: invoice.discountRate!,
        discountAmount: invoice.discountAmount!,
        total: invoice.total!,
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        dueDate: invoice.dueDate!,
        issueDate: invoice.issueDate!,
        status: invoice.status!,
        template: invoice.template!,
        currency: invoice.currency!,
        createdAt: invoice.createdAt || new Date(),
        updatedAt: new Date(),
      };

      storageUtils.saveInvoice(invoiceData);
      alert('Invoice saved successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error saving invoice. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedProfile) {
      alert('Please select a business profile');
      return;
    }

    try {
      const invoiceData: Invoice = {
        id: invoice.id || Date.now().toString(),
        invoiceNumber: invoice.invoiceNumber!,
        businessProfile: selectedProfile,
        clientName: invoice.clientName!,
        clientEmail: invoice.clientEmail!,
        clientPhone: invoice.clientPhone || '',
        clientAddress: invoice.clientAddress || '',
        clientCity: invoice.clientCity || '',
        clientState: invoice.clientState || '',
        clientZipCode: invoice.clientZipCode || '',
        clientCountry: invoice.clientCountry || '',
        items: invoice.items!,
        subtotal: invoice.subtotal!,
        taxRate: invoice.taxRate!,
        taxAmount: invoice.taxAmount!,
        discountRate: invoice.discountRate!,
        discountAmount: invoice.discountAmount!,
        total: invoice.total!,
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        dueDate: invoice.dueDate!,
        issueDate: invoice.issueDate!,
        status: invoice.status!,
        template: invoice.template!,
        currency: invoice.currency!,
        createdAt: invoice.createdAt || new Date(),
        updatedAt: new Date(),
      };

      // Fix preview for PDF: set to A4 size, remove scaling, then restore after
      const preview = document.getElementById('invoice-preview');
      let prevTransform = '';
      let prevWidth = '';
      let prevHeight = '';
      if (preview) {
        prevTransform = preview.style.transform;
        prevWidth = preview.style.width;
        prevHeight = preview.style.height;
        preview.style.transform = 'scale(1)';
        preview.style.width = '794px'; // A4 width at 96dpi
        preview.style.height = '1123px'; // A4 height at 96dpi
      }
      await generateInvoicePDF(invoiceData, 'invoice-preview');
      if (preview) {
        preview.style.transform = prevTransform;
        preview.style.width = prevWidth;
        preview.style.height = prevHeight;
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleSendEmail = () => {
    if (!selectedProfile) {
      alert('Please select a business profile');
      return;
    }

    if (!invoice.clientEmail) {
      alert('Please enter client email address');
      return;
    }

    setShowEmailModal(true);
  };

  const getCompleteInvoice = (): Invoice => {
    return {
      id: invoice.id || Date.now().toString(),
      invoiceNumber: invoice.invoiceNumber!,
      businessProfile: selectedProfile!,
      clientName: invoice.clientName!,
      clientEmail: invoice.clientEmail!,
      clientPhone: invoice.clientPhone || '',
      clientAddress: invoice.clientAddress || '',
      clientCity: invoice.clientCity || '',
      clientState: invoice.clientState || '',
      clientZipCode: invoice.clientZipCode || '',
      clientCountry: invoice.clientCountry || '',
      items: invoice.items!,
      subtotal: invoice.subtotal!,
      taxRate: invoice.taxRate!,
      taxAmount: invoice.taxAmount!,
      discountRate: invoice.discountRate!,
      discountAmount: invoice.discountAmount!,
      total: invoice.total!,
      notes: invoice.notes || '',
      terms: invoice.terms || '',
      dueDate: invoice.dueDate!,
      issueDate: invoice.issueDate!,
      status: invoice.status!,
      template: invoice.template!,
      currency: invoice.currency!,
      createdAt: invoice.createdAt || new Date(),
      updatedAt: new Date(),
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {isEditing ? 'Edit Invoice' : 'Create New Invoice'}
                </h1>
                <p className="text-gray-600">
                  {isEditing ? 'Update your invoice details' : 'Fill in the details to create your professional invoice'}
                </p>
              </div>
              <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? 'Hide Preview' : 'Preview'}
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={!invoice.clientEmail || !selectedProfile}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={!invoice.clientName || !invoice.items?.length}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Invoice'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              {/* Business Profile Selection */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                  Business Profile
                </h3>
                {businessProfiles.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">No business profiles found</p>
                    <button
                      onClick={() => navigate('/profile')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Create Business Profile
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <select
                      value={selectedProfile?.id || ''}
                      onChange={(e) => {
                        const profile = businessProfiles.find(p => p.id === e.target.value);
                        setSelectedProfile(profile || null);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a business profile</option>
                      {businessProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name} - {profile.email}
                        </option>
                      ))}
                    </select>
                    
                    {selectedProfile && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {selectedProfile.logo && (
                            <img
                              src={selectedProfile.logo}
                              alt="Business Logo"
                              className="h-12 w-12 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{selectedProfile.name}</p>
                            <p className="text-sm text-gray-600">{selectedProfile.email}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Invoice Details */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={invoice.invoiceNumber || ''}
                      onChange={(e) => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Palette className="inline h-4 w-4 mr-1" />
                      Template
                    </label>
                    <select
                      value={invoice.template || 'modern'}
                      onChange={(e) => setInvoice(prev => ({ ...prev, template: e.target.value as Invoice['template'] }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {templateOptions.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Issue Date
                    </label>
                    <input
                      type="date"
                      value={invoice.issueDate ? invoice.issueDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setInvoice(prev => ({ ...prev, issueDate: new Date(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Currency
                    </label>
                    <select
                      value={invoice.currency || 'USD'}
                      onChange={(e) => setInvoice(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="KES">KES - Kenyan Shilling</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={invoice.status || 'draft'}
                      onChange={(e) =>
                        setInvoice(prev => ({
                          ...prev,
                          status: e.target.value as 'draft' | 'sent' | 'paid' | 'overdue',
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Template Preview Cards */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Template Style</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templateOptions.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setInvoice(prev => ({ ...prev, template: template.id as typeof prev.template }))}
                      className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                        invoice.template === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Client Information */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Name *
                    </label>
                    <input
                      type="text"
                      value={invoice.clientName || ''}
                      onChange={(e) => setInvoice(prev => ({ ...prev, clientName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={invoice.clientEmail || ''}
                      onChange={(e) => setInvoice(prev => ({ ...prev, clientEmail: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={invoice.clientPhone || ''}
                      onChange={(e) => setInvoice(prev => ({ ...prev, clientPhone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={invoice.clientAddress || ''}
                      onChange={(e) => setInvoice(prev => ({ ...prev, clientAddress: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={invoice.clientCity || ''}
                      onChange={(e) => setInvoice(prev => ({ ...prev, clientCity: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={invoice.clientState || ''}
                      onChange={(e) => setInvoice(prev => ({ ...prev, clientState: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={invoice.clientZipCode || ''}
                      onChange={(e) => setInvoice(prev => ({ ...prev, clientZipCode: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={invoice.clientCountry || ''}
                      onChange={(e) => setInvoice(prev => ({ ...prev, clientCountry: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Items</h3>
                  <button
                    onClick={addItem}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {invoice.items?.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="md:col-span-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rate
                        </label>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount
                        </label>
                        <input
                          type="number"
                          value={item.amount}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100"
                        />
                      </div>

                      <div className="md:col-span-1 flex items-end">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculations */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      value={invoice.taxRate || 0}
                      onChange={(e) => setInvoice(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Rate (%)
                    </label>
                    <input
                      type="number"
                      value={invoice.discountRate || 0}
                      onChange={(e) => setInvoice(prev => ({ ...prev, discountRate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">{invoice.currency} {invoice.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  {(invoice.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium text-red-600">-{invoice.currency} {invoice.discountAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  {(invoice.taxAmount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium text-gray-900">{invoice.currency} {invoice.taxAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-blue-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-blue-600">{invoice.currency} {invoice.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes and Terms */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={invoice.notes || ''}
                      onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Thank you for your business!"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Terms & Conditions
                    </label>
                    <textarea
                      value={invoice.terms || ''}
                      onChange={(e) => setInvoice(prev => ({ ...prev, terms: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Payment is due within 30 days..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            {showPreview && (
              <div className="xl:sticky xl:top-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div
                      id="invoice-preview"
                      className="w-full max-w-[794px] mx-auto bg-white"
                      style={{
                        minHeight: '400px',
                        // On desktop, show at A4 size; on mobile, make it responsive
                        width: '100%',
                        height: 'auto',
                        boxSizing: 'border-box',
                        overflow: 'auto',
                      }}
                    >
                      {selectedProfile && invoice.clientName && invoice.items?.length ? (
                        <InvoiceTemplate
                          invoice={getCompleteInvoice()}
                          templateId={invoice.template || 'modern'}
                        />
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <p>Fill in the form to see preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && selectedProfile && invoice.clientEmail && (
        <EmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          invoice={getCompleteInvoice()}
        />
      )}
    </div>
  );
};

export default InvoiceCreator;