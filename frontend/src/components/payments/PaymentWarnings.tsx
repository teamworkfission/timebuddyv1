import { AlertTriangle, AlertCircle, Info, Clock } from 'lucide-react';
import { EmployeeWithHours } from '../../lib/payments-api';

interface PaymentWarningsProps {
  employee: EmployeeWithHours;
  hours: number;
  rate: number;
  hasOverlap?: boolean;
  className?: string;
}

interface Warning {
  type: 'error' | 'warning' | 'info';
  message: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function PaymentWarnings({ 
  employee, 
  hours, 
  rate, 
  hasOverlap = false,
  className = ""
}: PaymentWarningsProps) {
  const warnings: Warning[] = [];

  // Missing rate warning
  if (!rate || rate <= 0) {
    warnings.push({
      type: 'error',
      message: 'No hourly rate set for this employee. Payment cannot be calculated.',
      icon: <AlertTriangle className="w-4 h-4" />,
      action: {
        label: 'Set Rate Now',
        onClick: () => {
          // This would trigger the rate editing mode
          console.log('Set rate for employee', employee.id);
        }
      }
    });
  }

  // Zero hours warning
  if (hours === 0) {
    warnings.push({
      type: 'warning',
      message: 'No hours scheduled for this period. Verify schedule is posted.',
      icon: <Clock className="w-4 h-4" />
    });
  }

  // High hours warning (over 40 hours)
  if (hours > 40) {
    warnings.push({
      type: 'warning',
      message: `${hours} hours scheduled. Consider overtime regulations.`,
      icon: <AlertCircle className="w-4 h-4" />
    });
  }

  // Overlap warning
  if (hasOverlap) {
    warnings.push({
      type: 'warning',
      message: 'Overlapping payment periods detected. Review for duplicates.',
      icon: <AlertTriangle className="w-4 h-4" />
    });
  }

  // Payment already made info
  if (employee.paymentRecord?.status === 'paid') {
    warnings.push({
      type: 'info',
      message: `Payment completed on ${new Date(employee.paymentRecord.paid_at!).toLocaleDateString()}`,
      icon: <Info className="w-4 h-4" />
    });
  }

  // Very low rate warning (under $7.25)
  if (rate > 0 && rate < 7.25) {
    warnings.push({
      type: 'warning', 
      message: 'Rate is below federal minimum wage ($7.25/hour).',
      icon: <AlertTriangle className="w-4 h-4" />
    });
  }

  if (warnings.length === 0) {
    return null;
  }

  const getWarningStyles = (type: Warning['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIconColor = (type: Warning['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-amber-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {warnings.map((warning, index) => (
        <div
          key={index}
          className={`
            flex items-start space-x-3 p-3 rounded-lg border
            ${getWarningStyles(warning.type)}
          `}
        >
          <div className={`flex-shrink-0 mt-0.5 ${getIconColor(warning.type)}`}>
            {warning.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{warning.message}</p>
          </div>

          {warning.action && (
            <button
              onClick={warning.action.onClick}
              className="flex-shrink-0 text-sm font-medium underline hover:no-underline transition-colors"
            >
              {warning.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// Standalone components for specific warnings
export function MissingRateWarning({ 
  employeeName, 
  onSetRate 
}: { 
  employeeName: string; 
  onSetRate: () => void; 
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-red-800 font-medium">Rate Required</h4>
          <p className="text-red-700 text-sm mt-1">
            {employeeName} doesn't have an hourly rate set. Set a rate to enable payment calculations.
          </p>
        </div>
        <button
          onClick={onSetRate}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Set Rate
        </button>
      </div>
    </div>
  );
}

export function OverlapWarning({ 
  employeeName, 
  periodStart, 
  periodEnd 
}: { 
  employeeName: string; 
  periodStart: string; 
  periodEnd: string; 
}) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-amber-800 font-medium">Payment Period Overlap</h4>
          <p className="text-amber-700 text-sm mt-1">
            {employeeName} already has a paid record that overlaps with the period{' '}
            {new Date(periodStart).toLocaleDateString()} to {new Date(periodEnd).toLocaleDateString()}.
            Review to prevent duplicate payments.
          </p>
        </div>
      </div>
    </div>
  );
}

export function SuccessMessage({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="text-green-800">{children}</div>
      </div>
    </div>
  );
}
