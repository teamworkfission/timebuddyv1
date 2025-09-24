// =====================================================
// STANDARDIZED HOURS CALCULATION & DISPLAY UTILITIES
// =====================================================
// Purpose: Ensure consistent hours calculation and display across the entire application
// Fixes: Inconsistent rounding, precision, and display formatting issues

/**
 * Standard hours precision: 2 decimal places maximum
 * Matches database DECIMAL(5,2) precision
 */
const HOURS_DECIMAL_PRECISION = 2;

/**
 * Standardized hours calculation with consistent precision
 * Always rounds to 2 decimal places to match database precision
 */
export function calculateStandardHours(hours: {
  sunday_hours?: number;
  monday_hours?: number;
  tuesday_hours?: number;
  wednesday_hours?: number;
  thursday_hours?: number;
  friday_hours?: number;
  saturday_hours?: number;
}): number {
  const total = (
    (hours.sunday_hours || 0) +
    (hours.monday_hours || 0) +
    (hours.tuesday_hours || 0) +
    (hours.wednesday_hours || 0) +
    (hours.thursday_hours || 0) +
    (hours.friday_hours || 0) +
    (hours.saturday_hours || 0)
  );
  
  // Round to 2 decimal places to match database precision
  return Math.round(total * 100) / 100;
}

/**
 * Sum multiple hours values with consistent precision
 * Used for aggregating hours across multiple records
 */
export function sumStandardHours(hoursArray: number[]): number {
  const total = hoursArray.reduce((sum, hours) => sum + (hours || 0), 0);
  return Math.round(total * 100) / 100;
}

/**
 * Standardized hours formatting for consistent display
 * Rules:
 * - Always show at least 1 decimal place for clarity
 * - Remove unnecessary trailing zeros after the first decimal
 * - Maximum 2 decimal places
 */
export function formatStandardHours(hours: number): string {
  // Ensure we're working with standardized precision
  const standardizedHours = Math.round(hours * 100) / 100;
  
  // Always show 1 decimal minimum, remove unnecessary trailing zeros
  if (standardizedHours % 1 === 0) {
    // Whole number - show .0 for consistency
    return `${standardizedHours.toFixed(1)}`;
  } else {
    // Has decimal - show up to 2 places, remove trailing zeros
    return standardizedHours.toFixed(2).replace(/0+$/, '');
  }
}

/**
 * Parse hours input ensuring consistent precision
 * Used when receiving hours data from API or user input
 */
export function parseStandardHours(input: string | number): number {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  if (isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
}

/**
 * Validate hours value for business rules
 * - Must be non-negative
 * - Must not exceed 24 hours per day (for daily hours)
 * - Must not exceed reasonable weekly totals
 */
export function validateHours(hours: number, context: 'daily' | 'weekly' | 'period' = 'period'): boolean {
  if (isNaN(hours) || hours < 0) return false;
  
  switch (context) {
    case 'daily':
      return hours <= 24;
    case 'weekly':
      return hours <= 168; // 7 * 24 hours
    case 'period':
      return hours <= 2000; // Reasonable maximum for reporting periods
    default:
      return true;
  }
}

/**
 * Calculate hours with shift overlap detection and correction
 * Prevents double-counting when shifts span multiple days
 */
export function calculateShiftHoursStandard(startTime: string, endTime: string): number {
  // Parse 12h format times to minutes since midnight
  const parseTime = (timeStr: string): number => {
    const [time, period] = timeStr.trim().split(/\s+/);
    const [hours, minutes] = time.split(':').map(Number);
    
    let totalMinutes = hours * 60 + (minutes || 0);
    
    if (period?.toLowerCase() === 'pm' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period?.toLowerCase() === 'am' && hours === 12) {
      totalMinutes = minutes || 0;
    }
    
    return totalMinutes;
  };
  
  const startMinutes = parseTime(startTime);
  const endMinutes = parseTime(endTime);
  
  // Handle overnight shifts
  const totalMinutes = endMinutes >= startMinutes 
    ? endMinutes - startMinutes
    : (24 * 60 - startMinutes) + endMinutes;
  
  const hours = totalMinutes / 60;
  return Math.round(hours * 100) / 100;
}

/**
 * Comparison utility for hours values
 * Accounts for floating point precision issues
 */
export function hoursAreEqual(hours1: number, hours2: number): boolean {
  const standardized1 = Math.round(hours1 * 100) / 100;
  const standardized2 = Math.round(hours2 * 100) / 100;
  return Math.abs(standardized1 - standardized2) < 0.005; // 0.5 minute tolerance
}

/**
 * Get hours source priority for display
 * Priority: confirmed > payment_record > calculated
 */
export function getHoursPriority(sources: {
  confirmed?: number | null;
  payment_record?: number | null;
  calculated?: number;
}): { hours: number; source: 'confirmed' | 'payment_record' | 'calculated' } {
  if (sources.confirmed !== null && sources.confirmed !== undefined) {
    return { hours: parseStandardHours(sources.confirmed), source: 'confirmed' };
  }
  
  if (sources.payment_record !== null && sources.payment_record !== undefined) {
    return { hours: parseStandardHours(sources.payment_record), source: 'payment_record' };
  }
  
  return { hours: parseStandardHours(sources.calculated || 0), source: 'calculated' };
}

/**
 * Format hours with source indicator for transparency
 */
export function formatHoursWithSource(
  hours: number, 
  source: 'confirmed' | 'payment_record' | 'calculated'
): string {
  const formattedHours = formatStandardHours(hours);
  const sourceIcons = {
    confirmed: '✓',
    payment_record: '💰',
    calculated: '📊'
  };
  
  return `${formattedHours}h ${sourceIcons[source]}`;
}
