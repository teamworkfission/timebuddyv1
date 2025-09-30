// React import not needed for functional components
import { Business, BUSINESS_TYPE_LABELS } from '../../lib/business-api';
import { BusinessActions } from './BusinessActions';

interface BusinessTileProps {
  business: Business;
  onEdit?: (business: Business) => void;
  onDelete?: (business: Business) => void;
  onAddEmployee?: (business: Business) => void;
  onViewEmployees?: (business: Business) => void;
  onPaymentsReports?: (business: Business) => void;
}

export function BusinessTile({ business, onEdit, onDelete, onAddEmployee, onViewEmployees, onPaymentsReports }: BusinessTileProps) {
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

  const getVerificationStatusBadge = () => {
    const status = business.verification_status;
    
    if (status === 'approved') {
      return (
        <div className="absolute top-2 left-2 z-10 flex items-center space-x-1 bg-green-100 border border-green-300 px-2 py-1 rounded-full shadow-sm">
          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-medium text-green-800">Approved</span>
        </div>
      );
    } else if (status === 'rejected') {
      return (
        <div className="absolute top-2 left-2 z-10 flex items-center space-x-1 bg-red-100 border border-red-300 px-2 py-1 rounded-full shadow-sm">
          <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-medium text-red-800">Rejected</span>
        </div>
      );
    } else {
      // Default to pending for new businesses or when status is undefined/pending
      return (
        <div className="absolute top-2 left-2 z-10 flex items-center space-x-1 bg-amber-100 border border-amber-300 px-2 py-1 rounded-full shadow-sm">
          <svg className="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-medium text-amber-800">Pending</span>
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden relative">
      {/* Verification Status Badge */}
      {getVerificationStatusBadge()}
      
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
            <a 
              href={`tel:${business.phone}`}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline truncate transition-colors"
              title="Call phone number"
            >
              {business.phone}
            </a>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">📧</span>
            <a 
              href={`mailto:${business.email}`}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline truncate transition-colors"
              title="Send email"
            >
              {business.email}
            </a>
          </div>

          {/* Professional Action Buttons */}
          <BusinessActions
            business={business}
            onAddEmployee={onAddEmployee}
            onViewEmployees={onViewEmployees}
            onPaymentsReports={onPaymentsReports}
          />
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
