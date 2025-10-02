
interface Business {
  business_id: string;
  name: string;
}

interface EmployeeScheduleFilterProps {
  businesses: Business[];
  selectedBusinessId: string | null; // null means "All Employers"
  onBusinessSelect: (businessId: string | null) => void;
}

export function EmployeeScheduleFilter({ 
  businesses, 
  selectedBusinessId, 
  onBusinessSelect 
}: EmployeeScheduleFilterProps) {
  return (
    <div className="mb-4">
      <label htmlFor="employer-filter" className="block text-sm font-medium text-gray-700 mb-2">
        Select Employer
      </label>
      <div className="relative">
        <select
          id="employer-filter"
          className="w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none"
          value={selectedBusinessId || ''}
          onChange={(e) => onBusinessSelect(e.target.value || null)}
        >
          <option value="">-- Select an Employer --</option>
          {businesses.map((business) => (
            <option key={business.business_id} value={business.business_id}>
              {business.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Mobile-friendly selected business indicator */}
      {selectedBusinessId && (
        <div className="mt-2 sm:hidden">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Showing: {businesses.find(b => b.business_id === selectedBusinessId)?.name}
            <button 
              onClick={() => onBusinessSelect(null)}
              className="ml-1 inline-flex items-center p-0.5 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
              aria-label="Clear filter"
            >
              <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
