import { Business } from './business-api';

/**
 * Simplified timezone utilities that use server-resolved timezone data
 * This replaces the complex client-side timezone detection
 */

/**
 * Get the timezone for a business
 * Returns the server-resolved timezone or fallback to UTC
 */
export function getBusinessTimezone(business: Business): string {
  return business.timezone || 'UTC';
}

/**
 * Get current week start (Sunday) in business timezone
 */
export function getCurrentWeekStartForBusiness(business: Business): string {
  const timezone = getBusinessTimezone(business);
  return getCurrentWeekStartInTimezone(timezone);
}

/**
 * Get current week start (Sunday) in a specific timezone
 */
export function getCurrentWeekStartInTimezone(timezone: string): string {
  const now = new Date();
  
  // Get current time in the specified timezone
  const businessTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const dayOfWeek = businessTime.getDay(); // 0=Sunday
  const daysToSunday = -dayOfWeek; // Go back to Sunday
  
  const sunday = new Date(businessTime);
  sunday.setDate(businessTime.getDate() + daysToSunday);
  sunday.setHours(0, 0, 0, 0);
  
  return sunday.toISOString().split('T')[0];
}

/**
 * Get the end of the scheduling window (4 weeks from current Sunday)
 */
export function getScheduleWindowEnd(business: Business, windowWeeks: number = 4): string {
  const startDate = getCurrentWeekStartForBusiness(business);
  const start = new Date(startDate);
  start.setDate(start.getDate() + (windowWeeks * 7));
  return start.toISOString().split('T')[0];
}

/**
 * Check if a week is within the editable window
 */
export function isWeekInEditableWindow(weekStart: string, business: Business, windowWeeks: number = 4): boolean {
  const windowStart = getCurrentWeekStartForBusiness(business);
  const windowEnd = getScheduleWindowEnd(business, windowWeeks);
  return weekStart >= windowStart && weekStart < windowEnd;
}

/**
 * Check if a week is in the past
 */
export function isWeekInPast(weekStart: string, business: Business): boolean {
  const windowStart = getCurrentWeekStartForBusiness(business);
  return weekStart < windowStart;
}

/**
 * Check if it's safe to navigate to next week (within window)
 */
export function canNavigateToNextWeek(currentWeek: string, business: Business, windowWeeks: number = 4): boolean {
  const nextWeek = getNextWeek(currentWeek);
  const windowEnd = getScheduleWindowEnd(business, windowWeeks);
  return nextWeek < windowEnd;
}

/**
 * Format week range for display (Sunday to Saturday)
 */
export function formatWeekRange(weekStart: string, business: Business): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Sunday + 6 = Saturday
  
  const timezone = getBusinessTimezone(business);
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric',
    timeZone: timezone
  };
  
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', options);
  const year = start.getFullYear();
  
  return `${startStr} - ${endStr}, ${year}`;
}

/**
 * Format time string with timezone awareness
 */
export function formatTime(timeString: string, business: Business, format: 'short' | 'long' = 'short'): string {
  // Simple time formatting - can be enhanced if needed
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Get next week date
 */
export function getNextWeek(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

/**
 * Get previous week date
 */
export function getPreviousWeek(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
}

/**
 * Check if business has resolved timezone
 */
export function hasResolvedTimezone(business: Business): boolean {
  return !!(business.timezone && business.timezone_resolved_at);
}

/**
 * Get timezone display info for UI
 */
export function getTimezoneDisplayInfo(business: Business): {
  timezone: string;
  abbreviation: string;
  isResolved: boolean;
} {
  if (!hasResolvedTimezone(business)) {
    return {
      timezone: 'UTC',
      abbreviation: 'UTC',
      isResolved: false
    };
  }

  const timezone = business.timezone!;
  
  // Get timezone abbreviation
  const now = new Date();
  const abbreviation = now.toLocaleString('en-US', { 
    timeZone: timezone, 
    timeZoneName: 'short' 
  }).split(' ').pop() || timezone;

  return {
    timezone,
    abbreviation,
    isResolved: true
  };
}
