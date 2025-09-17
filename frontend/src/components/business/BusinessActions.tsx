import { Business } from '../../lib/business-api';
import { Button } from '../ui/Button';

interface BusinessActionsProps {
  business: Business;
  onAddEmployee?: (business: Business) => void;
  onViewEmployees?: (business: Business) => void;
  onPaymentsReports?: (business: Business) => void;
}

export function BusinessActions({ 
  business, 
  onAddEmployee, 
  onViewEmployees, 
  onPaymentsReports
}: BusinessActionsProps) {
  return (
    <div className="space-y-3">
      {/* Employee Count Row */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">👥</span>
          {onViewEmployees ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onViewEmployees(business);
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              {business.total_employees} Employee{business.total_employees !== 1 ? 's' : ''}
            </button>
          ) : (
            <span className="text-sm font-medium text-gray-700">
              {business.total_employees} Employee{business.total_employees !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons Grid - Professional Layout */}
      <div className="grid grid-cols-1 gap-2">
        {/* Primary Action: Add Employee */}
        {onAddEmployee && (
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddEmployee(business);
            }}
            variant="primary"
            size="sm"
            className="w-full justify-center"
          >
            <div className="flex items-center space-x-2">
              <span className="text-base">👤</span>
              <span>Add Employee</span>
            </div>
          </Button>
        )}

        {/* Secondary Action: Payments & Reports */}
        {onPaymentsReports && (
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPaymentsReports(business);
            }}
            variant="outline"
            size="sm"
            className="w-full justify-center bg-gradient-to-r from-green-50 to-blue-50 border-green-200 text-green-700 hover:bg-gradient-to-r hover:from-green-100 hover:to-blue-100 hover:border-green-300"
          >
            <div className="flex items-center space-x-2">
              <span className="text-base">📊</span>
              <span>Payments & Reports</span>
            </div>
          </Button>
        )}
      </div>

      {/* Professional Spacing */}
      <div className="h-1"></div>
    </div>
  );
}
