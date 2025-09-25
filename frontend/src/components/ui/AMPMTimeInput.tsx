import { useState, useEffect, useCallback, useRef } from 'react';

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
  const previousTimeRef = useRef<string>('');

  // Parse incoming value (e.g., "09:00", "14:30", "9:00 AM")
  useEffect(() => {
    if (!value) {
      setHour('');
      setMinute(0);
      setPeriod('AM');
      return;
    }

    // Handle AM/PM format first
    const ampmMatch = value.match(/^(\d{1,2})(?::(\d{2}))?\s?(AM|PM)$/i);
    if (ampmMatch) {
      setHour(parseInt(ampmMatch[1]));
      setMinute(parseInt(ampmMatch[2] || '0'));
      setPeriod(ampmMatch[3].toUpperCase() as 'AM' | 'PM');
      return;
    }

    // Handle 24-hour format (HH:MM or HH:MM:SS)
    const timeMatch = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (timeMatch) {
      const hour24 = parseInt(timeMatch[1]);
      const min = parseInt(timeMatch[2]);
      
      if (hour24 === 0) {
        setHour(12);
        setPeriod('AM');
      } else if (hour24 === 12) {
        setHour(12);
        setPeriod('PM');
      } else if (hour24 < 12) {
        setHour(hour24);
        setPeriod('AM');
      } else {
        setHour(hour24 - 12);
        setPeriod('PM');
      }
      setMinute(min);
    }
  }, [value]);

  // Convert AM/PM to 24-hour format (used for parsing legacy values)
  const convertTo24Hour = useCallback((hour: number, minute: number, period: 'AM' | 'PM'): string => {
    let hour24 = hour;
    
    if (period === 'AM' && hour === 12) {
      hour24 = 0;
    } else if (period === 'PM' && hour !== 12) {
      hour24 = hour + 12;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }, []);

  // Update parent when internal state changes
  useEffect(() => {
    let formattedTime = '';
    
    if (hour !== '') {
      // Format time in AM/PM format for backend compatibility
      formattedTime = `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
    }

    // Only call onChange if the value actually changed
    if (formattedTime !== previousTimeRef.current) {
      previousTimeRef.current = formattedTime;
      onChange(formattedTime);
    }
  }, [hour, minute, period, onChange]); // Include onChange but use ref to prevent loops

  const baseSelectClass = `
    px-3 py-2 border border-gray-300 rounded-md 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-50 disabled:text-gray-500
    ${error ? 'border-red-500 focus:ring-red-500' : ''}
  `;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="grid grid-cols-3 gap-3">
        {/* Hour Selection */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Hour</label>
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
          <label className="block text-xs text-gray-500 mb-1">Min</label>
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

        {/* AM/PM Selection */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Period</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'AM' | 'PM')}
            disabled={disabled || hour === ''}
            className={`w-full ${baseSelectClass}`}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>

      {/* Selected Time Display - Better Integration */}
      {hour !== '' && (
        <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">Selected Time:</span>
            <span className="text-sm font-semibold text-blue-900">
              {hour}:{minute.toString().padStart(2, '0')} {period}
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 rounded-md border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Help Text */}
      {!error && placeholder && hour === '' && (
        <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-sm text-gray-600">{placeholder}</p>
        </div>
      )}
    </div>
  );
}
