import { useState, useEffect } from 'react';

interface AMPMTimeInputProps {
  value?: string;           // "9:00 AM" or "9 AM" or ""
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

// Hour options: 1-12
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: (i + 1).toString()
}));

// Minute options: 00, 15, 30, 45 (common scheduling intervals)
const MINUTE_OPTIONS = [
  { value: 0, label: '00' },
  { value: 15, label: '15' },
  { value: 30, label: '30' },
  { value: 45, label: '45' }
];

/**
 * User-friendly AM/PM time input component
 * Replaces confusing 24-hour time pickers with familiar 12-hour format
 */
export function AMPMTimeInput({ 
  value = '', 
  onChange, 
  label, 
  error, 
  disabled = false,
  className = '',
  placeholder = 'Select time...'
}: AMPMTimeInputProps) {
  const [hour, setHour] = useState<number | ''>('');
  const [minute, setMinute] = useState<number>(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  // Parse incoming value (e.g., "9:00 AM", "10 PM", "14:30")
  useEffect(() => {
    if (!value) {
      setHour('');
      setMinute(0);
      setPeriod('AM');
      return;
    }

    // Handle AM/PM format
    const ampmMatch = value.match(/^(\d{1,2})(?::(\d{2}))?\s?(AM|PM)$/i);
    if (ampmMatch) {
      setHour(parseInt(ampmMatch[1]));
      setMinute(parseInt(ampmMatch[2] || '0'));
      setPeriod(ampmMatch[3].toUpperCase() as 'AM' | 'PM');
      return;
    }

    // Handle 24-hour format (legacy fallback)
    const timeMatch = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (timeMatch) {
      const hour24 = parseInt(timeMatch[1]);
      const min = parseInt(timeMatch[2]);
      
      if (hour24 === 0) {
        setHour(12);
        setPeriod('AM');
      } else if (hour24 <= 12) {
        setHour(hour24);
        setPeriod(hour24 === 12 ? 'PM' : 'AM');
      } else {
        setHour(hour24 - 12);
        setPeriod('PM');
      }
      setMinute(min);
    }
  }, [value]);

  // Update parent when internal state changes
  useEffect(() => {
    if (hour === '') {
      onChange('');
      return;
    }

    // Format as "H:MM AM/PM"
    const formattedTime = `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
    onChange(formattedTime);
  }, [hour, minute, period, onChange]);

  const baseSelectClass = `
    px-3 py-2 border border-gray-300 rounded-md 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-50 disabled:text-gray-500
    ${error ? 'border-red-500 focus:ring-red-500' : ''}
  `;

  const buttonClass = `
    px-3 py-2 border border-gray-300 rounded-md text-sm font-medium
    transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="grid grid-cols-4 gap-2">
        {/* Hour Selection */}
        <div>
          <select
            value={hour}
            onChange={(e) => setHour(e.target.value ? parseInt(e.target.value) : '')}
            disabled={disabled}
            className={`w-full ${baseSelectClass}`}
          >
            <option value="">Hr</option>
            {HOUR_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Minute Selection */}
        <div>
          <select
            value={minute}
            onChange={(e) => setMinute(parseInt(e.target.value))}
            disabled={disabled || hour === ''}
            className={`w-full ${baseSelectClass}`}
          >
            {MINUTE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* AM/PM Toggle */}
        <div className="col-span-2 flex">
          <button
            type="button"
            onClick={() => setPeriod('AM')}
            disabled={disabled || hour === ''}
            className={`
              ${buttonClass} flex-1 mr-1
              ${period === 'AM' 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => setPeriod('PM')}
            disabled={disabled || hour === ''}
            className={`
              ${buttonClass} flex-1 ml-1
              ${period === 'PM' 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            PM
          </button>
        </div>
      </div>

      {/* Display Current Selection */}
      {hour !== '' && (
        <div className="mt-2 text-sm text-gray-600">
          Selected: <span className="font-medium text-gray-900">
            {hour}:{minute.toString().padStart(2, '0')} {period}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Help Text */}
      {!error && placeholder && hour === '' && (
        <p className="mt-2 text-sm text-gray-500">{placeholder}</p>
      )}
    </div>
  );
}
