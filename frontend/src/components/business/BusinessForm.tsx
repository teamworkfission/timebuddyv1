import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GooglePlacesAutocomplete } from '../ui/GooglePlacesAutocomplete';
import { StateDropdown, getStateCodeFromName } from '../ui/StateDropdown';
import { createBusiness, updateBusiness, BUSINESS_TYPES, BUSINESS_TYPE_LABELS, CreateBusinessData, Business } from '../../lib/business-api';

interface BusinessFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
  initialData?: Business;
  mode?: 'create' | 'edit';
}

export function BusinessForm({ onSuccess, onCancel, initialData, mode = 'create' }: BusinessFormProps) {
  const [formData, setFormData] = useState<CreateBusinessData>({
    name: '',
    type: 'restaurant',
    email: '',
    phone: '',
    location: '',
    state: '',
    city: '',
    county: '',
    zip_code: '',
    street_address: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when editing
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        name: initialData.name,
        type: initialData.type,
        email: initialData.email,
        phone: initialData.phone,
        location: initialData.location,
        state: initialData.state || '',
        city: initialData.city || '',
        county: initialData.county || '',
        zip_code: initialData.zip_code || '',
        street_address: initialData.street_address || '',
      });
    }
  }, [mode, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStateChange = (stateCode: string) => {
    const updatedData = { ...formData, state: stateCode };
    setFormData(updatedData);
    updateLocationFromComponents(updatedData);
  };

  const updateLocationFromComponents = (data: CreateBusinessData) => {
    // Build location string from individual components
    const parts = [
      data.street_address,
      data.city,
      data.state && data.zip_code ? `${data.state} ${data.zip_code}` : data.state || data.zip_code,
    ].filter(Boolean);
    
    if (parts.length > 0) {
      setFormData(prev => ({ ...prev, location: parts.join(', ') }));
    }
  };

  const handlePlaceSelect = (place: { address: string; city?: string; state?: string; county?: string; postalCode?: string }) => {
    const streetAddress = place.address.split(',')[0] || '';
    
    // Convert state name to state code (Google Places returns full names like "Alabama", we need "AL")
    const stateCode = place.state ? getStateCodeFromName(place.state) : formData.state;
    
    const updatedData = {
      ...formData,
      location: place.address,
      street_address: streetAddress,
      city: place.city || formData.city,
      state: stateCode,
      county: place.county || formData.county,
      zip_code: place.postalCode || formData.zip_code,
    };
    
    setFormData(updatedData);
    
    // Also update the location string to reflect the new combined address if manual fields are filled
    updateLocationFromComponents(updatedData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.phone || !formData.location) {
        throw new Error('Please fill in all required fields');
      }

      if (mode === 'edit' && initialData) {
        await updateBusiness(initialData.business_id, formData);
      } else {
        await createBusiness(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} business`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {mode === 'edit' ? 'Edit Business' : 'Add New Business'}
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          {mode === 'edit' 
            ? 'Update the details for your business location' 
            : 'Fill out the details for your business location'
          }
        </p>
      </div>

      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Business Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter business name"
            maxLength={100}
          />
        </div>

        {/* Business Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Business Type *
          </label>
          <select
            id="type"
            name="type"
            required
            value={formData.type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {BUSINESS_TYPES.map(type => (
              <option key={type} value={type}>
                {BUSINESS_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Business Email *
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            placeholder="business@example.com"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="(555) 123-4567"
            maxLength={15}
          />
        </div>

        {/* Address Lookup */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address Lookup *
          </label>
          <GooglePlacesAutocomplete
            onPlaceSelect={handlePlaceSelect}
            value={formData.location}
            placeholder="Search for business address..."
          />
        </div>

        {/* Manual Address Fields - Mobile Optimized */}
        <div className="space-y-4">
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-800 mb-1">Manual Address Entry</p>
            <p>If the address lookup above doesn't work or find your location, you can manually enter the address components below. The state dropdown is searchable for your convenience.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <StateDropdown
                value={formData.state || ''}
                onChange={handleStateChange}
                placeholder="Select state..."
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City/Town
              </label>
              <Input
                id="city"
                name="city"
                type="text"
                value={formData.city || ''}
                onChange={handleInputChange}
                placeholder="New York"
              />
            </div>
            <div>
              <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-2">
                County
              </label>
              <Input
                id="county"
                name="county"
                type="text"
                value={formData.county || ''}
                onChange={handleInputChange}
                placeholder="Manhattan"
              />
            </div>
            <div>
              <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code
              </label>
              <Input
                id="zip_code"
                name="zip_code"
                type="text"
                value={formData.zip_code || ''}
                onChange={handleInputChange}
                placeholder="10001"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="street_address" className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <Input
                id="street_address"
                name="street_address"
                type="text"
                value={formData.street_address || ''}
                onChange={handleInputChange}
                placeholder="123 Main St"
              />
            </div>
          </div>
        </div>


        {/* Form Actions - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4 sm:pt-6 border-t border-gray-200">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="w-full sm:w-auto order-2 sm:order-1"
              size="md"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="w-full sm:w-auto order-1 sm:order-2"
            size="md"
          >
            {loading 
              ? `${mode === 'edit' ? 'Updating' : 'Creating'} Business...` 
              : `${mode === 'edit' ? 'Update' : 'Create'} Business`
            }
          </Button>
        </div>
      </form>
    </div>
  );
}
