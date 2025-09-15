import { useState, useEffect } from 'react';
import { BusinessJobStats, getBusinessJobStats, BUSINESS_TYPE_LABELS } from '../../lib/business-api';

interface BusinessTileViewProps {
  onBusinessSelect: (businessId: string, businessName: string) => void;
}

export function BusinessTileView({ onBusinessSelect }: BusinessTileViewProps) {
  const [businessStats, setBusinessStats] = useState<BusinessJobStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBusinessStats();
  }, []);

  const loadBusinessStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBusinessJobStats();
      setBusinessStats(data);
    } catch (err) {
      console.error('Failed to load business job stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load business statistics');
    } finally {
      setLoading(false);
    }
  };

  const getBusinessTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      restaurant: '🍽️',
      gas_station: '⛽',
      retail_store: '🏪',
      grocery_store: '🛒',
      convenience_store: '🏪',
      pharmacy: '💊',
      coffee_shop: '☕',
      fast_food: '🍔',
      delivery_service: '🚚',
      warehouse: '🏭',
      office: '🏢',
      other: '🏬',
    };
    return icons[type] || '🏬';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-red-400">⚠️</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (businessStats.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <span className="text-6xl">🏢</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses found</h3>
        <p className="text-gray-500 mb-6">
          You need to create a business before you can post jobs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">{businessStats.length}</div>
          <div className="text-sm text-gray-600 font-medium">
            Business{businessStats.length !== 1 ? 'es' : ''}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {businessStats.reduce((sum, b) => sum + b.total_jobs, 0)}
          </div>
          <div className="text-sm text-gray-600 font-medium">Total Jobs</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {businessStats.reduce((sum, b) => sum + b.total_applications, 0)}
          </div>
          <div className="text-sm text-gray-600 font-medium">Applications</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {businessStats.reduce((sum, b) => sum + b.published_jobs, 0)}
          </div>
          <div className="text-sm text-gray-600 font-medium">Published</div>
        </div>
      </div>

      {/* Business Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {businessStats.map((business) => (
          <div
            key={business.business_id}
            onClick={() => onBusinessSelect(business.business_id, business.business_name)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer overflow-hidden"
          >
            {/* Header with Business Type */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{getBusinessTypeIcon(business.business_type)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-white truncate">{business.business_name}</h3>
                  <p className="text-blue-100 text-sm truncate">
                    {BUSINESS_TYPE_LABELS[business.business_type as keyof typeof BUSINESS_TYPE_LABELS]}
                  </p>
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="p-4">
              <div className="space-y-3">
                {/* Location */}
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📍</span>
                  <span className="truncate">{business.location}</span>
                </div>

                {/* Job Statistics */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{business.total_jobs}</div>
                    <div className="text-xs text-gray-600">Job Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{business.total_applications}</div>
                    <div className="text-xs text-gray-600">Applications</div>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Draft: {business.draft_jobs}</span>
                    <span>Published: {business.published_jobs}</span>
                    <span>Closed: {business.closed_jobs}</span>
                  </div>
                </div>

                {/* Click Indicator */}
                <div className="pt-2 text-center">
                  <span className="text-xs text-blue-600 font-medium">Click to view jobs →</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
