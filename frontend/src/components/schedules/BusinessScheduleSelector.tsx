import React from 'react';
import { ChevronDown, Building2 } from 'lucide-react';
import { Business } from '../../lib/business-api';

interface BusinessScheduleSelectorProps {
  businesses: Business[];
  selectedBusinessId: string;
  onBusinessChange: (businessId: string) => void;
  loading?: boolean;
}

export function BusinessScheduleSelector({
  businesses,
  selectedBusinessId,
  onBusinessChange,
  loading = false
}: BusinessScheduleSelectorProps) {
  const selectedBusiness = businesses.find(b => b.business_id === selectedBusinessId);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Building2 className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-medium text-gray-900">Select Business</h2>
      </div>
      
      <div className="relative">
        <select
          value={selectedBusinessId}
          onChange={(e) => onBusinessChange(e.target.value)}
          disabled={loading}
          className="w-full appearance-none bg-white border border-gray-300 rounded-md px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        >
          <option value="">Choose a business to manage schedules...</option>
          {businesses.map((business) => (
            <option key={business.business_id} value={business.business_id}>
              {business.name} - {business.location}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {selectedBusiness && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">{selectedBusiness.name}</h3>
              <p className="text-sm text-blue-700">{selectedBusiness.location}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700">
                {selectedBusiness.total_employees} employee{selectedBusiness.total_employees !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-blue-600 capitalize">{selectedBusiness.type.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}

      {businesses.length === 0 && !loading && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            No businesses found. Please create a business first to manage schedules.
          </p>
        </div>
      )}
    </div>
  );
}
