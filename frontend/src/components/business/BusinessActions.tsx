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
  const isApproved = business.verification_status === 'approved';
  const isPending = !business.verification_status || business.verification_status === 'pending';
  const isRejected = business.verification_status === 'rejected';

  return (
    <div className="space-y-3">
      {/* Employee Count Row */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">👥</span>
          {onViewEmployees && isApproved ? (
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
            <span className={`text-sm font-medium ${isApproved ? 'text-gray-700' : 'text-gray-500'}`}>
              {business.total_employees} Employee{business.total_employees !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons Grid - Professional Layout */}
      {isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs font-medium text-amber-800">Awaiting Approval</p>
              <p className="text-xs text-amber-700">Business features will be available after admin approval</p>
            </div>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-xs font-medium text-red-800 mb-1">Application Rejected</p>
              {business.verification_notes ? (
                <div className="text-xs text-red-700">
                  <p className="font-medium mb-1">Admin Comment:</p>
                  <p className="bg-red-100 p-2 rounded text-red-800 leading-relaxed">{business.verification_notes}</p>
                </div>
              ) : (
                <p className="text-xs text-red-700">Please contact support for more information</p>
              )}
            </div>
          </div>
        </div>
      )}

      {isApproved && (
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
      )}

      {/* Professional Spacing */}
      <div className="h-1"></div>
    </div>
  );
}
