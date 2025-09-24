import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateRange {
  start: string;
  end: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onApply?: () => void;
  label?: string;
  showApplyButton?: boolean;
  disabled?: boolean;
}

export function DateRangePicker({ 
  value, 
  onChange, 
  onApply,
  label = "Date Range",
  showApplyButton = true,
  disabled = false
}: DateRangePickerProps) {
  const [tempRange, setTempRange] = useState(value);
  const [isApplied, setIsApplied] = useState(true);

  const handleStartChange = (start: string) => {
    const newRange = { ...tempRange, start };
    setTempRange(newRange);
    setIsApplied(false);
    
    if (!showApplyButton) {
      onChange(newRange);
      setIsApplied(true);
    }
  };

  const handleEndChange = (end: string) => {
    const newRange = { ...tempRange, end };
    setTempRange(newRange);
    setIsApplied(false);
    
    if (!showApplyButton) {
      onChange(newRange);
      setIsApplied(true);
    }
  };

  const handleApply = () => {
    onChange(tempRange);
    setIsApplied(true);
    onApply?.();
  };

  const getQuickRanges = () => {
    const today = new Date();
    const ranges = [
      {
        label: 'This Week',
        getValue: () => {
          const sunday = new Date(today);
          sunday.setDate(today.getDate() - today.getDay());
          const saturday = new Date(sunday);
          saturday.setDate(sunday.getDate() + 6);
          return {
            start: sunday.toISOString().split('T')[0],
            end: saturday.toISOString().split('T')[0],
          };
        }
      },
      {
        label: 'Last Week', 
        getValue: () => {
          const lastSunday = new Date(today);
          lastSunday.setDate(today.getDate() - today.getDay() - 7);
          const lastSaturday = new Date(lastSunday);
          lastSaturday.setDate(lastSunday.getDate() + 6);
          return {
            start: lastSunday.toISOString().split('T')[0],
            end: lastSaturday.toISOString().split('T')[0],
          };
        }
      },
      {
        label: 'This Month',
        getValue: () => {
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          return {
            start: firstDay.toISOString().split('T')[0],
            end: lastDay.toISOString().split('T')[0],
          };
        }
      },
      {
        label: 'Last Month',
        getValue: () => {
          const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
          return {
            start: firstDay.toISOString().split('T')[0],
            end: lastDay.toISOString().split('T')[0],
          };
        }
      }
    ];
    return ranges;
  };

  const handleQuickRange = (range: DateRange) => {
    setTempRange(range);
    if (showApplyButton) {
      setIsApplied(false);
    } else {
      onChange(range);
      setIsApplied(true);
    }
  };

  const isValidRange = tempRange.start && tempRange.end && tempRange.start <= tempRange.end;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Calendar className="w-5 h-5 text-gray-500" />
        <h3 className="font-medium text-gray-900">{label}</h3>
      </div>

      {/* Quick Range Buttons - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        {getQuickRanges().map((range) => (
          <button
            key={range.label}
            onClick={() => handleQuickRange(range.getValue())}
            disabled={disabled}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 space-y-3 sm:space-y-0">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={tempRange.start}
            onChange={(e) => handleStartChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={tempRange.end}
            onChange={(e) => handleEndChange(e.target.value)}
            disabled={disabled}
            min={tempRange.start}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {showApplyButton && (
          <div className="flex space-x-2">
            <button
              onClick={handleApply}
              disabled={disabled || !isValidRange || isApplied}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {!isValidRange && tempRange.start && tempRange.end && (
        <p className="text-sm text-red-600">
          End date must be after start date
        </p>
      )}

      {!isApplied && showApplyButton && isValidRange && (
        <p className="text-sm text-amber-600">
          Click "Apply" to update the data
        </p>
      )}

      {/* Current Range Display */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <strong>Selected Period:</strong>{' '}
        {value.start && value.end ? (
          <>
            {new Date(value.start + 'T00:00:00').toLocaleDateString()} to{' '}
            {new Date(value.end + 'T00:00:00').toLocaleDateString()}
            {' '}
            ({Math.ceil((new Date(value.end + 'T00:00:00').getTime() - new Date(value.start + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
          </>
        ) : (
          'No dates selected'
        )}
      </div>
    </div>
  );
}
