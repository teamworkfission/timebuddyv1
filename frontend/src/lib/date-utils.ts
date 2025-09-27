/**
 * SINGLE SOURCE OF TRUTH for all date calculations
 * All components must use these functions to ensure consistency
 * 
 * Week Definition: Sunday = start of week (US standard)
 * Date Format: YYYY-MM-DD (ISO 8601)
 */

/**
 * Get current week start (Sunday) - BULLETPROOF VERSION
 * This is the canonical implementation - all other getCurrentWeekStart functions should be removed
 */
export function getCurrentWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, etc.
  const daysToSunday = -dayOfWeek; // Always go back to Sunday
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + daysToSunday);
  sunday.setHours(0, 0, 0, 0);
  return sunday.toISOString().split('T')[0];
}

/**
 * Get next week start date (Sunday)
 */
export function getNextWeek(weekStart: string): string {
  const date = new Date(weekStart + 'T00:00:00');
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

/**
 * Get previous week start date (Sunday)
 */
export function getPreviousWeek(weekStart: string): string {
  const date = new Date(weekStart + 'T00:00:00');
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
}

/**
 * Format week range for display (Sunday to Saturday)
 * Fixed timezone parsing to avoid offset issues
 */
export function formatWeekRange(weekStart: string): string {
  // Fix timezone parsing issue: ensure date is interpreted in local time
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Sunday + 6 = Saturday
  
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric' 
  };
  
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', options);
  const year = start.getFullYear();
  
  return `${startStr} - ${endStr}`;
}

/**
 * Get default date range for payments (current week: Sunday to Saturday)
 * Replaces the incorrect implementation in payments-api.ts
 */
export function getDefaultDateRange(): { start: string; end: string } {
  const weekStart = getCurrentWeekStart();
  const weekEnd = new Date(weekStart + 'T00:00:00');
  weekEnd.setDate(weekEnd.getDate() + 6); // Sunday + 6 = Saturday
  
  return {
    start: weekStart,
    end: weekEnd.toISOString().split('T')[0],
  };
}

/**
 * Check if a week is within the editable window
 * Only prevents past week editing, allows unlimited future scheduling
 */
export function isWeekInEditableWindow(weekStart: string): boolean {
  const windowStart = getCurrentWeekStart();
  return weekStart >= windowStart;
}

/**
 * Check if a week is in the past
 */
export function isWeekInPast(weekStart: string): boolean {
  const windowStart = getCurrentWeekStart();
  return weekStart < windowStart;
}

/**
 * Format day with date for display (e.g., "Mon 23")
 */
export function formatDayWithDate(weekStart: string, dayIndex: number, dayAbbrev: string): string {
  const date = new Date(weekStart + 'T00:00:00');
  date.setDate(date.getDate() + dayIndex);
  return `${dayAbbrev} ${date.getDate()}`;
}

/**
 * Calculate total hours from daily hours object
 */
export function calculateTotalHours(hours: {
  sunday_hours?: number;
  monday_hours?: number;
  tuesday_hours?: number;
  wednesday_hours?: number;
  thursday_hours?: number;
  friday_hours?: number;
  saturday_hours?: number;
}): number {
  const total = [
    hours.sunday_hours || 0,
    hours.monday_hours || 0,
    hours.tuesday_hours || 0,
    hours.wednesday_hours || 0,
    hours.thursday_hours || 0,
    hours.friday_hours || 0,
    hours.saturday_hours || 0,
  ].reduce((sum, h) => sum + h, 0);

  return Math.round(total * 100) / 100;
}

/**
 * Validate hours input (0-24, max 2 decimal places)
 */
export function validateHours(hours: number | string): boolean {
  if (typeof hours === 'string') {
    hours = parseFloat(hours);
  }
  
  if (isNaN(hours) || hours < 0 || hours > 24) {
    return false;
  }
  
  // Check max 2 decimal places
  const decimalPlaces = (hours.toString().split('.')[1] || '').length;
  return decimalPlaces <= 2;
}

/**
 * Check if a specific day within a week is in the past
 * @param weekStart - The week start date (YYYY-MM-DD)
 * @param dayOfWeek - Day of week (0=Sunday, 1=Monday, etc.)
 * @returns boolean - true if the day is in the past
 */
export function isDayInPast(weekStart: string, dayOfWeek: number): boolean {
  const weekStartDate = new Date(weekStart + 'T00:00:00');
  const targetDate = new Date(weekStartDate);
  targetDate.setDate(weekStartDate.getDate() + dayOfWeek);
  
  // Get current date (local time, no timezone complexity)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
  
  return targetDate < today;
}

/**
 * Get the full date for a specific day within a week
 * @param weekStart - The week start date (YYYY-MM-DD)  
 * @param dayOfWeek - Day of week (0=Sunday, 1=Monday, etc.)
 * @returns Date object for the specific day
 */
export function getDateForDay(weekStart: string, dayOfWeek: number): Date {
  const weekStartDate = new Date(weekStart + 'T00:00:00');
  const targetDate = new Date(weekStartDate);
  targetDate.setDate(weekStartDate.getDate() + dayOfWeek);
  return targetDate;
}

/**
 * Format a specific day with full date info for display
 * @param weekStart - The week start date (YYYY-MM-DD)
 * @param dayOfWeek - Day of week (0=Sunday, 1=Monday, etc.)
 * @returns formatted string like "Monday, Sep 25, 2025"
 */
export function formatDayWithFullDate(weekStart: string, dayOfWeek: number): string {
  const date = getDateForDay(weekStart, dayOfWeek);
  const dateString = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  return dateString;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
