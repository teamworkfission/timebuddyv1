// React import not needed for functional components
import { Business, BUSINESS_TYPE_LABELS } from '../../lib/business-api';

interface BusinessTileProps {
  business: Business;
  onEdit?: (business: Business) => void;
  onDelete?: (business: Business) => void;
}

export function BusinessTile({ business, onEdit, onDelete }: BusinessTileProps) {
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden relative">
      {/* Edit Icon - Top Right Corner */}
      {onEdit && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(business);
          }}
          className="absolute top-2 right-2 z-10 w-8 h-8 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 group"
          aria-label={`Edit ${business.name}`}
        >
          <svg 
            className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
            />
          </svg>
        </button>
      )}
      
      {/* Header with Business Type - Mobile Optimized */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 pr-10">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sm sm:text-lg">{getBusinessTypeIcon(business.type)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-white truncate">{business.name}</h3>
              <p className="text-blue-100 text-xs sm:text-sm truncate">{BUSINESS_TYPE_LABELS[business.type]}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Details - Mobile Optimized */}
      <div className="p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-3">
          {/* Location */}
          <div className="flex items-start space-x-2">
            <span className="text-gray-400 mt-0.5 text-sm">📍</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">{business.location}</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">📞</span>
            <p className="text-xs sm:text-sm text-gray-600 truncate">{business.phone}</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">📧</span>
            <p className="text-xs sm:text-sm text-gray-600 truncate">{business.email}</p>
          </div>

          {/* Employee Count */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">👥</span>
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {business.total_employees} Employee{business.total_employees !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Delete Button - Mobile Optimized */}
            <div className="flex space-x-3">
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(business);
                  }}
                  className="text-xs font-medium text-red-600 hover:text-red-700 active:text-red-800 min-h-[32px] px-2 py-1 rounded hover:bg-red-50 touch-manipulation"
                  aria-label={`Delete ${business.name}`}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Created Date Footer - Mobile Optimized */}
      <div className="px-3 py-2 sm:px-4 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center sm:text-left">
          Added {new Date(business.created_at).toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </p>
      </div>
    </div>
  );
}
