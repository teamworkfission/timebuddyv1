import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRange {
  start: string;
  end: string;
}

interface MonthNavigatorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  disabled?: boolean;
}

export function MonthNavigator({ 
  value, 
  onChange, 
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

  // Initialize with current month if no value provided and sync monthOffset with actual date range
  useEffect(() => {
    if (!value.start || !value.end) {
      const currentMonthRange = getMonthRange(0);
      onChange(currentMonthRange);
      setMonthOffset(0);
    } else {
      // Calculate the correct monthOffset based on the current date range
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      const rangeStart = new Date(value.start + 'T00:00:00');
      const rangeMonth = rangeStart.getMonth();
      const rangeYear = rangeStart.getFullYear();
      
      // Calculate the offset from current month to range month
      const calculatedOffset = (rangeYear - currentYear) * 12 + (rangeMonth - currentMonth);
      setMonthOffset(calculatedOffset);
    }
  }, [value.start, value.end]);

  // Handle previous month navigation
  const handlePreviousMonth = () => {
    if (disabled) return;
    
    const newOffset = monthOffset - 1;
    const newRange = getMonthRange(newOffset);
    
    setMonthOffset(newOffset);
    onChange(newRange);
  };

  // Handle next month navigation
  const handleNextMonth = () => {
    if (disabled || monthOffset >= 0) return; // Can't go beyond current month
    
    const newOffset = monthOffset + 1;
    const newRange = getMonthRange(newOffset);
    
    setMonthOffset(newOffset);
    onChange(newRange);
  };

  // Handle current month navigation
  const handleCurrentMonth = () => {
    if (disabled || monthOffset === 0) return;
    
    const newRange = getMonthRange(0);
    
    setMonthOffset(0);
    onChange(newRange);
  };

  // Check if we're currently viewing the current month
  const isCurrentMonth = monthOffset === 0;

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center justify-center space-x-6">
        {/* Previous Month Button */}
        <button
          onClick={handlePreviousMonth}
          disabled={disabled}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>previous</span>
        </button>

        {/* Month Name Display - Always show actual month being viewed */}
        {isCurrentMonth ? (
          // When on current month, show the actual month name
          <div className="text-center">
            <div className="px-4 py-2 text-lg font-semibold text-blue-600">
              {formatMonth(monthOffset)}
            </div>
          </div>
        ) : (
          // When on previous months, show as clickable button to return to current
          <button
            onClick={handleCurrentMonth}
            disabled={disabled}
            className="text-center px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <div className="text-lg font-semibold">{formatMonth(monthOffset)}</div>
            <div className="text-xs text-gray-500">click to return to current</div>
          </button>
        )}

        {/* Next Month Button */}
        <button
          onClick={handleNextMonth}
          disabled={disabled || monthOffset >= 0} // Disable if at current month or beyond
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Show selected period dates only */}
      <div className="mt-3 text-center">
        <div className="text-xs text-gray-500">
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
