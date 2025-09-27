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
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-blue-100">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Building2 className="h-5 w-5 text-blue-700" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Select Business</h2>
      </div>
      
      <div className="relative">
        <select
          value={selectedBusinessId}
          onChange={(e) => onBusinessChange(e.target.value)}
          disabled={loading}
          className="w-full appearance-none bg-gradient-to-r from-blue-50 to-blue-50 hover:from-blue-100 hover:to-blue-100 border-2 border-blue-200 rounded-lg px-4 py-3 pr-10 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 shadow-sm"
        >
          <option value="">Choose a business to manage schedules...</option>
          {businesses.map((business) => (
            <option key={business.business_id} value={business.business_id}>
              {business.name} - {business.location}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 bg-blue-200 rounded">
          <ChevronDown className="h-4 w-4 text-blue-700 pointer-events-none" />
        </div>
      </div>


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
