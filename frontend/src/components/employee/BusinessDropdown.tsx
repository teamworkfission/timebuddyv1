import { ChevronDown, Building2 } from 'lucide-react';

interface Business {
  business_id: string;
  name: string;
}

interface BusinessDropdownProps {
  businesses: Business[];
  selectedBusinessId: string | null;
  onBusinessSelect: (businessId: string | null) => void;
  loading?: boolean;
}

export function BusinessDropdown({ 
  businesses, 
  selectedBusinessId, 
  onBusinessSelect,
  loading = false 
}: BusinessDropdownProps) {
  return (
    <div className="relative">
      <select
        value={selectedBusinessId || ''}
        onChange={(e) => onBusinessSelect(e.target.value || null)}
        disabled={loading}
        className="
          appearance-none bg-white rounded-lg shadow-sm border 
          px-4 py-2 pr-10 pl-10 min-w-[200px] w-full sm:w-auto
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500
          text-sm font-medium text-gray-900
          cursor-pointer
        "
      >
        <option value="">Select Business</option>
        {businesses.map((business) => (
          <option key={business.business_id} value={business.business_id}>
            {business.name}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown icon to match week picker */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </div>
      
      {/* Business icon to match week picker's calendar icon */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Building2 className="h-4 w-4 text-gray-500" />
      </div>
    </div>
  );
}
