import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';

interface DateRange {
  start: string;
  end: string;
}

interface MonthNavigatorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onApply?: () => void;
  disabled?: boolean;
}

export function MonthNavigator({ 
  value, 
  onChange, 
  onApply,
  disabled = false
}: MonthNavigatorProps) {
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month, -1 = last month, etc.
  
  // Helper function to get month date range
  const getMonthRange = (offset: number): DateRange => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    
    const firstDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    };
  };

  // Helper function to format month display
  const formatMonth = (offset: number): string => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    
    return targetDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Initialize with current month if no value provided
  useEffect(() => {
    if (!value.start || !value.end) {
      const currentMonthRange = getMonthRange(0);
      onChange(currentMonthRange);
      setMonthOffset(0);
    }
  }, []);

  // Handle previous month navigation
  const handlePreviousMonth = () => {
    if (disabled) return;
    
    const newOffset = monthOffset - 1;
    const newRange = getMonthRange(newOffset);
    
    setMonthOffset(newOffset);
    onChange(newRange);
    onApply?.();
  };

  // Handle current month navigation
  const handleCurrentMonth = () => {
    if (disabled || monthOffset === 0) return;
    
    const newRange = getMonthRange(0);
    
    setMonthOffset(0);
    onChange(newRange);
    onApply?.();
  };

  // Check if we're currently viewing the current month
  const isCurrentMonth = monthOffset === 0;

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center justify-center space-x-4">
        {/* Previous Months Button */}
        <button
          onClick={handlePreviousMonth}
          disabled={disabled}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>previous months</span>
        </button>

        {/* Current Month Display/Button */}
        {isCurrentMonth ? (
          // When on current month, show as non-clickable text
          <div className="px-4 py-2 text-lg font-semibold text-gray-900">
            {formatMonth(monthOffset)}
          </div>
        ) : (
          // When on previous months, show as clickable button to return to current
          <button
            onClick={handleCurrentMonth}
            disabled={disabled}
            className="px-4 py-2 text-lg font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            current month
          </button>
        )}

        {/* Display the actual month name when not on current month */}
        {!isCurrentMonth && (
          <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border">
            Viewing: {formatMonth(monthOffset)}
          </div>
        )}
      </div>

      {/* Optional: Show selected period info */}
      <div className="mt-3 text-center">
        <div className="text-sm text-gray-600">
          <strong>Selected Period:</strong>{' '}
          {value.start && value.end ? (
            <>
              {new Date(value.start + 'T00:00:00').toLocaleDateString()} to{' '}
              {new Date(value.end + 'T00:00:00').toLocaleDateString()}
            </>
          ) : (
            'No period selected'
          )}
        </div>
      </div>
    </div>
  );
}
