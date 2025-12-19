import React, { useState, useEffect } from 'react';
import { Save, DollarSign, Globe, Calendar, Palette, Download, Trash2, AlertTriangle, Mail, Key } from 'lucide-react';
import { storageUtils } from '../../utils/storage';
import { updateEmailConfiguration, validateEmailConfiguration } from '../../utils/emailService';
import SEO from '../SEO';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';

const Settings: React.FC = () => {
  const { setCurrency } = useCurrency();
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    taxRate: 0,
    language: 'en',
    dateFormat: 'MM/dd/yyyy',
    defaultTemplate: 'modern',
    defaultDueDays: 30,
    defaultNotes: '',
    defaultTerms: '',
    currency: 'USD', // Added currency property to settings state
  });

  const [emailSettings, setEmailSettings] = useState({
    serviceId: '',
    templateId: '',
    publicKey: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const savedSettings = storageUtils.getSettings();
    setSettings(prev => ({ ...prev, ...savedSettings }));
    setCurrency(savedSettings.currency || 'USD');

    // Load email settings if they exist
    const savedEmailSettings = localStorage.getItem('email_settings');
    if (savedEmailSettings) {
      setEmailSettings(JSON.parse(savedEmailSettings));
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    storageUtils.saveSettings(settings);
    setCurrency(settings.currency);
    
    // Save email settings
    localStorage.setItem('email_settings', JSON.stringify(emailSettings));
    updateEmailConfiguration(emailSettings);
    
    setTimeout(() => {
      setIsSaving(false);
      alert('Settings saved successfully!');
    }, 500);
  };

  const handleExportData = () => {
    setIsExporting(true);
    
    try {
      const invoices = storageUtils.getInvoices();
      const profiles = storageUtils.getBusinessProfiles();
      const currentProfile = storageUtils.getCurrentProfile();
      
      const exportData = {
        invoices,
        businessProfiles: profiles,
        currentProfile,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAllData = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all data? This action cannot be undone. All invoices, business profiles, and settings will be permanently deleted.'
    );
    
    if (confirmed) {
      const doubleConfirmed = window.confirm(
        'This is your final warning. Are you absolutely sure you want to delete ALL data?'
      );
      
      if (doubleConfirmed) {
        localStorage.clear();
        alert('All data has been cleared successfully. The page will now reload.');
        window.location.reload();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <SEO
        title="Settings | InvoicePro by Dovepeak Digital Solutions"
        description="Manage your invoice, business, and user settings. Powered by Dovepeak Digital Solutions."
        canonical={typeof window !== 'undefined' ? window.location.href : ''}
        keywords="settings, invoice, business, user, InvoicePro, Dovepeak Digital Solutions"
        image="/logo192.png"
        type="settings"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* User Profile Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">User Profile</h2>
          {user ? (
            <div className="space-y-2">
              <div className="mb-2"><strong>Name:</strong> {user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'N/A'}</div>
              <div className="mb-2"><strong>Email:</strong> {user.email}</div>
            </div>
          ) : (
            <div>Loading user info...</div>
          )}
        </div>

        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
              <p className="text-gray-600">
                Customize your invoice preferences and application defaults
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Email Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-blue-600" />
            Email Configuration (EmailJS)
          </h3>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Key className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Setup Instructions</p>
                  <p>To enable email functionality, you need to create a free EmailJS account and configure your service. Visit <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="underline">emailjs.com</a> to get started.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service ID
                </label>
                <input
                  type="text"
                  value={emailSettings.serviceId}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, serviceId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your_service_id"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template ID
                </label>
                <input
                  type="text"
                  value={emailSettings.templateId}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, templateId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your_template_id"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Key
                </label>
                <input
                  type="text"
                  value={emailSettings.publicKey}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, publicKey: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your_public_key"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${validateEmailConfiguration() ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={validateEmailConfiguration() ? 'text-green-700' : 'text-red-700'}>
                {validateEmailConfiguration() ? 'Email configuration is complete' : 'Email configuration is incomplete'}
              </span>
            </div>
          </div>
        </div>

        {/* Currency & Financial */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
            Currency & Financial Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
              <option value="AED">AED - United Arab Emirates Dirham (د.إ)</option>
              <option value="AFN">AFN - Afghan Afghani (؋)</option>
              <option value="ALL">ALL - Albanian Lek (L)</option>
              <option value="AMD">AMD - Armenian Dram (֏)</option>
              <option value="ANG">ANG - Netherlands Antillean Guilder (ƒ)</option>
              <option value="AOA">AOA - Angolan Kwanza (Kz)</option>
              <option value="ARS">ARS - Argentine Peso ($)</option>
              <option value="AUD">AUD - Australian Dollar (A$)</option>
              <option value="AWG">AWG - Aruban Florin (ƒ)</option>
              <option value="AZN">AZN - Azerbaijani Manat (₼)</option>
              <option value="BAM">BAM - Bosnia and Herzegovina Convertible Mark (KM)</option>
              <option value="BBD">BBD - Barbadian Dollar (Bds$)</option>
              <option value="BDT">BDT - Bangladeshi Taka (৳)</option>
              <option value="BGN">BGN - Bulgarian Lev (лв)</option>
              <option value="BHD">BHD - Bahraini Dinar (.د.ب)</option>
              <option value="BIF">BIF - Burundian Franc (FBu)</option>
              <option value="BMD">BMD - Bermudian Dollar (BD$)</option>
              <option value="BND">BND - Brunei Dollar (B$)</option>
              <option value="BOB">BOB - Bolivian Boliviano (Bs.)</option>
              <option value="BRL">BRL - Brazilian Real (R$)</option>
              <option value="BSD">BSD - Bahamian Dollar (B$)</option>
              <option value="BTN">BTN - Bhutanese Ngultrum (Nu.)</option>
              <option value="BWP">BWP - Botswana Pula (P)</option>
              <option value="BYN">BYN - Belarusian Ruble (Br)</option>
              <option value="BZD">BZD - Belize Dollar (BZ$)</option>
              <option value="CAD">CAD - Canadian Dollar (C$)</option>
              <option value="CDF">CDF - Congolese Franc (FC)</option>
              <option value="CHF">CHF - Swiss Franc (CHF)</option>
              <option value="CLP">CLP - Chilean Peso (CLP$)</option>
              <option value="CNY">CNY - Chinese Yuan (¥)</option>
              <option value="COP">COP - Colombian Peso (COL$)</option>
              <option value="CRC">CRC - Costa Rican Colón (₡)</option>
              <option value="CUP">CUP - Cuban Peso (₱)</option>
              <option value="CVE">CVE - Cape Verdean Escudo (Esc)</option>
              <option value="CZK">CZK - Czech Koruna (Kč)</option>
              <option value="DJF">DJF - Djiboutian Franc (Fdj)</option>
              <option value="DKK">DKK - Danish Krone (kr)</option>
              <option value="DOP">DOP - Dominican Peso (RD$)</option>
              <option value="DZD">DZD - Algerian Dinar (دج)</option>
              <option value="EGP">EGP - Egyptian Pound (E£)</option>
              <option value="ERN">ERN - Eritrean Nakfa (Nfk)</option>
              <option value="ETB">ETB - Ethiopian Birr (Br)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="FJD">FJD - Fijian Dollar (FJ$)</option>
              <option value="FKP">FKP - Falkland Islands Pound (£)</option>
              <option value="FOK">FOK - Faroese Króna (kr)</option>
              <option value="GBP">GBP - British Pound (£)</option>
              <option value="GEL">GEL - Georgian Lari (₾)</option>
              <option value="GGP">GGP - Guernsey Pound (£)</option>
              <option value="GHS">GHS - Ghanaian Cedi (₵)</option>
              <option value="GIP">GIP - Gibraltar Pound (£)</option>
              <option value="GMD">GMD - Gambian Dalasi (D)</option>
              <option value="GNF">GNF - Guinean Franc (FG)</option>
              <option value="GTQ">GTQ - Guatemalan Quetzal (Q)</option>
              <option value="GYD">GYD - Guyanese Dollar (GY$)</option>
              <option value="HKD">HKD - Hong Kong Dollar (HK$)</option>
              <option value="HNL">HNL - Honduran Lempira (L)</option>
              <option value="HRK">HRK - Croatian Kuna (kn)</option>
              <option value="HTG">HTG - Haitian Gourde (G)</option>
              <option value="HUF">HUF - Hungarian Forint (Ft)</option>
              <option value="IDR">IDR - Indonesian Rupiah (Rp)</option>
              <option value="ILS">ILS - Israeli New Shekel (₪)</option>
              <option value="IMP">IMP - Isle of Man Pound (£)</option>
              <option value="INR">INR - Indian Rupee (₹)</option>
              <option value="IQD">IQD - Iraqi Dinar (ع.د)</option>
              <option value="IRR">IRR - Iranian Rial (﷼)</option>
              <option value="ISK">ISK - Icelandic Króna (kr)</option>
              <option value="JEP">JEP - Jersey Pound (£)</option>
              <option value="JMD">JMD - Jamaican Dollar (J$)</option>
              <option value="JOD">JOD - Jordanian Dinar (JD)</option>
              <option value="JPY">JPY - Japanese Yen (¥)</option>
              <option value="KES">KES - Kenyan Shilling (KSh)</option>
              <option value="KGS">KGS - Kyrgyzstani Som (с)</option>
              <option value="KHR">KHR - Cambodian Riel (៛)</option>
              <option value="KID">KID - Kiribati Dollar ($)</option>
              <option value="KMF">KMF - Comorian Franc (CF)</option>
              <option value="KRW">KRW - South Korean Won (₩)</option>
              <option value="KWD">KWD - Kuwaiti Dinar (KD)</option>
              <option value="KYD">KYD - Cayman Islands Dollar (CI$)</option>
              <option value="KZT">KZT - Kazakhstani Tenge (₸)</option>
              <option value="LAK">LAK - Lao Kip (₭)</option>
              <option value="LBP">LBP - Lebanese Pound (ل.ل)</option>
              <option value="LKR">LKR - Sri Lankan Rupee (Rs)</option>
              <option value="LRD">LRD - Liberian Dollar (L$)</option>
              <option value="LSL">LSL - Lesotho Loti (L)</option>
              <option value="LYD">LYD - Libyan Dinar (LD)</option>
              <option value="MAD">MAD - Moroccan Dirham (DH)</option>
              <option value="MDL">MDL - Moldovan Leu (L)</option>
              <option value="MGA">MGA - Malagasy Ariary (Ar)</option>
              <option value="MKD">MKD - Macedonian Denar (ден)</option>
              <option value="MMK">MMK - Burmese Kyat (K)</option>
              <option value="MNT">MNT - Mongolian Tögrög (₮)</option>
              <option value="MOP">MOP - Macanese Pataca (MOP$)</option>
              <option value="MRU">MRU - Mauritanian Ouguiya (UM)</option>
              <option value="MUR">MUR - Mauritian Rupee (Rs)</option>
              <option value="MVR">MVR - Maldivian Rufiyaa (Rf)</option>
              <option value="MWK">MWK - Malawian Kwacha (MK)</option>
              <option value="MXN">MXN - Mexican Peso (MX$)</option>
              <option value="MYR">MYR - Malaysian Ringgit (RM)</option>
              <option value="MZN">MZN - Mozambican Metical (MT)</option>
              <option value="NAD">NAD - Namibian Dollar (N$)</option>
              <option value="NGN">NGN - Nigerian Naira (₦)</option>
              <option value="NIO">NIO - Nicaraguan Córdoba (C$)</option>
              <option value="NOK">NOK - Norwegian Krone (kr)</option>
              <option value="NPR">NPR - Nepalese Rupee (Rs)</option>
              <option value="NZD">NZD - New Zealand Dollar (NZ$)</option>
              <option value="OMR">OMR - Omani Rial (﷼)</option>
              <option value="PAB">PAB - Panamanian Balboa (B/.)</option>
              <option value="PEN">PEN - Peruvian Sol (S/)</option>
              <option value="PGK">PGK - Papua New Guinean Kina (K)</option>
              <option value="PHP">PHP - Philippine Peso (₱)</option>
              <option value="PKR">PKR - Pakistani Rupee (Rs)</option>
              <option value="PLN">PLN - Polish Złoty (zł)</option>
              <option value="PYG">PYG - Paraguayan Guaraní (₲)</option>
              <option value="QAR">QAR - Qatari Riyal (﷼)</option>
              <option value="RON">RON - Romanian Leu (lei)</option>
              <option value="RSD">RSD - Serbian Dinar (дин)</option>
              <option value="RUB">RUB - Russian Ruble (₽)</option>
              <option value="RWF">RWF - Rwandan Franc (FRw)</option>
              <option value="SAR">SAR - Saudi Riyal (﷼)</option>
              <option value="SBD">SBD - Solomon Islands Dollar (SI$)</option>
              <option value="SCR">SCR - Seychellois Rupee (Rs)</option>
              <option value="SDG">SDG - Sudanese Pound (SDG)</option>
              <option value="SEK">SEK - Swedish Krona (kr)</option>
              <option value="SGD">SGD - Singapore Dollar (S$)</option>
              <option value="SHP">SHP - Saint Helena Pound (£)</option>
              <option value="SLE">SLE - Sierra Leonean Leone (Le)</option>
              <option value="SOS">SOS - Somali Shilling (Sh)</option>
              <option value="SRD">SRD - Surinamese Dollar (SR$)</option>
              <option value="SSP">SSP - South Sudanese Pound (£)</option>
              <option value="STN">STN - São Tomé and Príncipe Dobra (Db)</option>
              <option value="SYP">SYP - Syrian Pound (£S)</option>
              <option value="SZL">SZL - Eswatini Lilangeni (E)</option>
              <option value="THB">THB - Thai Baht (฿)</option>
              <option value="TJS">TJS - Tajikistani Somoni (ЅМ)</option>
              <option value="TMT">TMT - Turkmenistani Manat (m)</option>
              <option value="TND">TND - Tunisian Dinar (DT)</option>
              <option value="TOP">TOP - Tongan Paʻanga (T$)</option>
              <option value="TRY">TRY - Turkish Lira (₺)</option>
              <option value="TTD">TTD - Trinidad and Tobago Dollar (TT$)</option>
              <option value="TVD">TVD - Tuvaluan Dollar ($)</option>
              <option value="TWD">TWD - New Taiwan Dollar (NT$)</option>
              <option value="TZS">TZS - Tanzanian Shilling (TSh)</option>
              <option value="UAH">UAH - Ukrainian Hryvnia (₴)</option>
              <option value="UGX">UGX - Ugandan Shilling (USh)</option>
              <option value="USD">USD - US Dollar ($)</option>
              <option value="UYU">UYU - Uruguayan Peso ($U)</option>
              <option value="UZS">UZS - Uzbekistani Som (so'm)</option>
              <option value="VES">VES - Venezuelan Bolívar (Bs.)</option>
              <option value="VND">VND - Vietnamese Đồng (₫)</option>
              <option value="VUV">VUV - Vanuatu Vatu (VT)</option>
              <option value="WST">WST - Samoan Tālā (WS$)</option>
              <option value="XAF">XAF - Central African CFA Franc (FCFA)</option>
              <option value="XCD">XCD - East Caribbean Dollar (EC$)</option>
              <option value="XDR">XDR - IMF Special Drawing Rights (SDR)</option>
              <option value="XOF">XOF - West African CFA Franc (CFA)</option>
              <option value="XPF">XPF - CFP Franc (₣)</option>
              <option value="YER">YER - Yemeni Rial (﷼)</option>
              <option value="ZAR">ZAR - South African Rand (R)</option>
              <option value="ZMW">ZMW - Zambian Kwacha (ZK)</option>
              <option value="ZWL">ZWL - Zimbabwean Dollar (Z$)</option>
                

              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                step="0.01"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        {/* Localization */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Globe className="h-5 w-5 mr-2 text-blue-600" />
            Localization Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date Format
              </label>
              <select
                value={settings.dateFormat}
                onChange={(e) => setSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="MM/dd/yyyy">MM/dd/yyyy (US Format)</option>
                <option value="dd/MM/yyyy">dd/MM/yyyy (UK Format)</option>
                <option value="yyyy-MM-dd">yyyy-MM-dd (ISO Format)</option>
                <option value="dd.MM.yyyy">dd.MM.yyyy (German Format)</option>
                <option value="dd/MM/yy">dd/MM/yy (Short Format)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoice Defaults */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Palette className="h-5 w-5 mr-2 text-blue-600" />
            Invoice Defaults
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Template
              </label>
              <select
                value={settings.defaultTemplate}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultTemplate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="modern">Modern - Clean gradient design</option>
                <option value="classic">Classic - Traditional formal style</option>
                <option value="minimal">Minimal - Simple and clean</option>
                <option value="professional">Professional - Corporate style</option>
                <option value="corporate">Corporate - Formal business template</option>
                <option value="elegant">Elegant - Sophisticated design</option>
                <option value="creative">Creative - Modern colorful design</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Due Days
              </label>
              <input
                type="number"
                value={settings.defaultDueDays}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultDueDays: parseInt(e.target.value) || 30 }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="30"
                min="1"
                max="365"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Notes
              </label>
              <textarea
                value={settings.defaultNotes}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultNotes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Thank you for your business! We appreciate your prompt payment."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Terms & Conditions
              </label>
              <textarea
                value={settings.defaultTerms}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultTerms: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Payment is due within 30 days of invoice date. Late payments may be subject to a 1.5% monthly service charge."
              />
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Data Management
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Download className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Export Data</h4>
                  <p className="text-sm text-gray-500">Download all your invoices, business profiles, and settings</p>
                </div>
              </div>
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="px-4 py-2 border border-blue-300 rounded-lg shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Clear All Data</h4>
                  <p className="text-sm text-gray-500">Permanently remove all invoices, profiles, and settings</p>
                </div>
              </div>
              <button
                onClick={handleClearAllData}
                className="px-4 py-2 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4 inline mr-1" />
                Clear Data
              </button>
            </div>
          </div>
        </div>

        {/* Application Info */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Application Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <p><strong>Version:</strong> 2.0.0</p>
              <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p><strong>Storage:</strong> Local Browser Storage</p>
              <p><strong>Data Persistence:</strong> Enabled</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;