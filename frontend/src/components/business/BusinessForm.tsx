import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GooglePlacesAutocomplete } from '../ui/GooglePlacesAutocomplete';
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
    total_employees: 0,
  });

  const [manualAddress, setManualAddress] = useState({
    street: '',
    city: '',
    state: '',
    county: '',
    zipcode: '',
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
        total_employees: initialData.total_employees,
      });

      // Parse address components if available
      const addressParts = initialData.location.split(', ');
      if (addressParts.length >= 4) {
        setManualAddress({
          street: addressParts[0] || '',
          city: addressParts[1] || '',
          state: addressParts[2]?.split(' ')[0] || '',
          county: '',
          zipcode: addressParts[2]?.split(' ')[1] || '',
        });
      }
    }
  }, [mode, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_employees' ? parseInt(value) || 0 : value,
    }));
  };

  const handleManualAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualAddress(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Update the main location field with combined address
    const fullAddress = Object.values({ ...manualAddress, [name]: value })
      .filter(Boolean)
      .join(', ');
    setFormData(prev => ({ ...prev, location: fullAddress }));
  };

  const handlePlaceSelect = (place: { address: string; city?: string; state?: string; county?: string; postalCode?: string }) => {
    setFormData(prev => ({ ...prev, location: place.address }));
    
    // Auto-populate manual fields if available
    if (place.city || place.state || place.county || place.postalCode) {
      setManualAddress(prev => ({
        ...prev,
        city: place.city || prev.city,
        state: place.state || prev.state,
        county: place.county || prev.county,
        zipcode: place.postalCode || prev.zipcode,
        street: place.address.split(',')[0] || prev.street,
      }));
    }
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <Input
              id="state"
              name="state"
              type="text"
              value={manualAddress.state}
              onChange={handleManualAddressChange}
              placeholder="NY"
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
              value={manualAddress.city}
              onChange={handleManualAddressChange}
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
              value={manualAddress.county}
              onChange={handleManualAddressChange}
              placeholder="Manhattan"
            />
          </div>
          <div>
            <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code
            </label>
            <Input
              id="zipcode"
              name="zipcode"
              type="text"
              value={manualAddress.zipcode}
              onChange={handleManualAddressChange}
              placeholder="10001"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <Input
              id="street"
              name="street"
              type="text"
              value={manualAddress.street}
              onChange={handleManualAddressChange}
              placeholder="123 Main St"
            />
          </div>
        </div>

        {/* Total Employees */}
        <div>
          <label htmlFor="total_employees" className="block text-sm font-medium text-gray-700 mb-2">
            Total Employees
          </label>
          <Input
            id="total_employees"
            name="total_employees"
            type="number"
            min="0"
            value={formData.total_employees}
            onChange={handleInputChange}
            placeholder="0"
          />
          <p className="mt-1 text-xs text-gray-500">Number of employees you can schedule for this location</p>
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
