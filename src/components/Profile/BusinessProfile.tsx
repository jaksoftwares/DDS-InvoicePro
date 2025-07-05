import React, { useState, useEffect } from 'react';
import { Camera, Save, Plus, Edit, Trash2, Building2, Mail, Phone, MapPin, Globe, Hash } from 'lucide-react';
import { BusinessProfile } from '../../types';
import { storageUtils } from '../../utils/storage';

const BusinessProfileComponent: React.FC = () => {
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<BusinessProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<BusinessProfile>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    website: '',
    taxNumber: '',
    logo: '',
  });

  useEffect(() => {
    const loadProfiles = () => {
      const savedProfiles = storageUtils.getBusinessProfiles();
      const savedCurrentProfile = storageUtils.getCurrentProfile();
      
      setProfiles(savedProfiles);
      setCurrentProfile(savedCurrentProfile);
      
      if (savedCurrentProfile) {
        setFormData(savedCurrentProfile);
      }
    };

    loadProfiles();
  }, []);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoDataUrl = e.target?.result as string;
        setFormData(prev => ({ ...prev, logo: logoDataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      alert('Please fill in required fields (Name and Email)');
      return;
    }

    const profileData: BusinessProfile = {
      id: currentProfile?.id || Date.now().toString(),
      name: formData.name!,
      email: formData.email!,
      phone: formData.phone || '',
      address: formData.address || '',
      city: formData.city || '',
      state: formData.state || '',
      zipCode: formData.zipCode || '',
      country: formData.country || '',
      website: formData.website || '',
      taxNumber: formData.taxNumber || '',
      logo: formData.logo || '',
      createdAt: currentProfile?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    storageUtils.saveBusinessProfile(profileData);
    storageUtils.setCurrentProfile(profileData);
    
    setCurrentProfile(profileData);
    setProfiles(prev => {
      const existingIndex = prev.findIndex(p => p.id === profileData.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = profileData;
        return updated;
      }
      return [...prev, profileData];
    });
    
    setIsEditing(false);
    setIsCreating(false);
    alert('Business profile saved successfully!');
  };

  const handleCreateNew = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      website: '',
      taxNumber: '',
      logo: '',
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleEdit = (profile: BusinessProfile) => {
    setFormData(profile);
    setCurrentProfile(profile);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      storageUtils.deleteBusinessProfile(id);
      setProfiles(prev => prev.filter(p => p.id !== id));
      
      if (currentProfile?.id === id) {
        setCurrentProfile(null);
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          website: '',
          taxNumber: '',
          logo: '',
        });
      }
    }
  };

  const handleSetCurrent = (profile: BusinessProfile) => {
    storageUtils.setCurrentProfile(profile);
    setCurrentProfile(profile);
    setFormData(profile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Building2 className="h-8 w-8 mr-3 text-blue-600" />
                  Business Profiles
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage your business information and branding for professional invoices
                </p>
              </div>
              <button
                onClick={handleCreateNew}
                className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Profile
              </button>
            </div>
          </div>

          {/* Profile Cards */}
          {profiles.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Saved Profiles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`relative border-2 rounded-xl p-6 transition-all hover:shadow-lg ${
                      currentProfile?.id === profile.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <button
                        onClick={() => handleEdit(profile)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-white"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(profile.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                      {profile.logo ? (
                        <img
                          src={profile.logo}
                          alt="Business Logo"
                          className="h-16 w-16 object-cover rounded-lg border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-900 truncate">{profile.name}</h4>
                        <p className="text-sm text-gray-600 truncate">{profile.email}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      {profile.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{profile.phone}</span>
                        </div>
                      )}
                      {profile.address && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{profile.address}</span>
                        </div>
                      )}
                      {profile.website && (
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{profile.website}</span>
                        </div>
                      )}
                    </div>

                    {currentProfile?.id !== profile.id ? (
                      <button
                        onClick={() => handleSetCurrent(profile)}
                        className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Set as Current
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800 w-full justify-center">
                        ✓ Current Profile
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile Form */}
          {(isEditing || isCreating || !currentProfile) && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {isCreating ? 'Create New Profile' : isEditing ? 'Edit Profile' : 'Business Information'}
              </h3>

              <div className="space-y-8">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Business Logo
                  </label>
                  <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0">
                      {formData.logo ? (
                        <img
                          src={formData.logo}
                          alt="Business Logo"
                          className="h-24 w-24 object-cover rounded-xl border-2 border-gray-300 shadow-sm"
                        />
                      ) : (
                        <div className="h-24 w-24 bg-gray-100 rounded-xl border-2 border-gray-300 flex items-center justify-center">
                          <Camera className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Logo
                      </label>
                      <p className="mt-2 text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="inline h-4 w-4 mr-1" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="inline h-4 w-4 mr-1" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Globe className="inline h-4 w-4 mr-1" />
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://www.example.com"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Hash className="inline h-4 w-4 mr-1" />
                        Tax Number / Business ID
                      </label>
                      <input
                        type="text"
                        value={formData.taxNumber || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    Address Information
                  </h4>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State / Province
                        </label>
                        <input
                          type="text"
                          value={formData.state || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP / Postal Code
                        </label>
                        <input
                          type="text"
                          value={formData.zipCode || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          value={formData.country || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  {(isEditing || isCreating) && (
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                        if (currentProfile) {
                          setFormData(currentProfile);
                        }
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessProfileComponent;