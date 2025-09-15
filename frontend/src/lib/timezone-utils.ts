// US State to Timezone Mapping with DST Support
// This determines timezone based on business location (state)

export interface TimezoneInfo {
  iana: string; // IANA timezone identifier (e.g., 'America/New_York')
  abbreviation: string; // Standard time abbreviation (e.g., 'EST')
  dstAbbreviation: string; // Daylight saving time abbreviation (e.g., 'EDT')
  utcOffset: number; // Standard time offset from UTC in hours
  dstOffset: number; // DST offset from UTC in hours
}

// Comprehensive US state to timezone mapping
export const US_STATE_TIMEZONES: Record<string, TimezoneInfo> = {
  // Eastern Time Zone
  'CT': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Connecticut
  'DE': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Delaware
  'FL': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Florida (most of)
  'GA': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Georgia
  'IN': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Indiana (most of)
  'KY': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Kentucky (eastern)
  'ME': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Maine
  'MD': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Maryland
  'MA': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Massachusetts
  'MI': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Michigan (most of)
  'NH': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // New Hampshire
  'NJ': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // New Jersey
  'NY': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // New York
  'NC': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // North Carolina
  'OH': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Ohio
  'PA': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Pennsylvania
  'RI': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Rhode Island
  'SC': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // South Carolina
  'TN': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Tennessee (eastern)
  'VT': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Vermont
  'VA': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // Virginia
  'WV': { iana: 'America/New_York', abbreviation: 'EST', dstAbbreviation: 'EDT', utcOffset: -5, dstOffset: -4 }, // West Virginia

  // Central Time Zone
  'AL': { iana: 'America/Chicago', abbreviation: 'CST', dstAbbreviation: 'CDT', utcOffset: -6, dstOffset: -5 }, // Alabama
  'AR': { iana: 'America/Chicago', abbreviation: 'CST', dstAbbreviation: 'CDT', utcOffset: -6, dstOffset: -5 }, // Arkansas
  'IL': { iana: 'America/Chicago', abbreviation: 'CST', dstAbbreviation: 'CDT', utcOffset: -6, dstOffset: -5 }, // Illinois
  'IA': { iana: 'America/Chicago', abbreviation: 'CST', dstAbbreviation: 'CDT', utcOffset: -6, dstOffset: -5 }, // Iowa
  'KS': { iana: 'America/Chicago', abbreviation: 'CST', dstAbbreviation: 'CDT', utcOffset: -6, dstOffset: -5 }, // Kansas (most of)
  'LA': { iana: 'America/Chicago', abbreviation: 'CST', dstAbbreviation: 'CDT', utcOffset: -6, dstOffset: -5 }, // Louisiana
  'MN': { iana: 'America/Chicago', abbreviation: 'CST', dstAbbreviation: 'CDT', utcOffset: -6, dstOffset: -5 }, // Minnesota
  'MS': { iana: 'America/Chicago', abbreviation: 'CST', dstAbbreviation: 'CDT', utcOffset: -6, dstOffset: -5 }, // Mississippi
  'MO': { iana: 'America/Chicago', abbreviation: 'CST', dstAbbreviation: 'CDT', utcOffset: -6, dstOffset: -5 }, // Missouri
  'NE': { iana: 'America/Chicago', abbreviation: 'CST', dstAbbreviation: 'CDT', utcOffset: -6, dstOffset: -5 }, // Nebraska (eastern)
  'ND': { iana: 'America/Chicago', abbreviation: 'CST', dstAbbreviation: 'CDT', utcOffset: -6, dstOffset: -5 }, // North Dakota (eastern)
  'OK': { iana: 'America/Chicago', abbreviation: 'CST', dstAbbreviation: 'CDT', utcOffset: -6, dstOffset: -5 }, // Oklahoma
  'SD': { iana: 'America/Chicago', abbreviation: 'CST', dstAbbreviation: 'CDT', utcOffset: -6, dstOffset: -5 }, // South Dakota (eastern)
  'TX': { iana: 'America/Chicago', abbreviation: 'CST', dstAbbreviation: 'CDT', utcOffset: -6, dstOffset: -5 }, // Texas (most of)
  'WI': { iana: 'America/Chicago', abbreviation: 'CST', dstAbbreviation: 'CDT', utcOffset: -6, dstOffset: -5 }, // Wisconsin

  // Mountain Time Zone
  'AZ': { iana: 'America/Phoenix', abbreviation: 'MST', dstAbbreviation: 'MST', utcOffset: -7, dstOffset: -7 }, // Arizona (no DST)
  'CO': { iana: 'America/Denver', abbreviation: 'MST', dstAbbreviation: 'MDT', utcOffset: -7, dstOffset: -6 }, // Colorado
  'ID': { iana: 'America/Denver', abbreviation: 'MST', dstAbbreviation: 'MDT', utcOffset: -7, dstOffset: -6 }, // Idaho (southern)
  'MT': { iana: 'America/Denver', abbreviation: 'MST', dstAbbreviation: 'MDT', utcOffset: -7, dstOffset: -6 }, // Montana
  'NV': { iana: 'America/Los_Angeles', abbreviation: 'PST', dstAbbreviation: 'PDT', utcOffset: -8, dstOffset: -7 }, // Nevada (most of)
  'NM': { iana: 'America/Denver', abbreviation: 'MST', dstAbbreviation: 'MDT', utcOffset: -7, dstOffset: -6 }, // New Mexico
  'UT': { iana: 'America/Denver', abbreviation: 'MST', dstAbbreviation: 'MDT', utcOffset: -7, dstOffset: -6 }, // Utah
  'WY': { iana: 'America/Denver', abbreviation: 'MST', dstAbbreviation: 'MDT', utcOffset: -7, dstOffset: -6 }, // Wyoming

  // Pacific Time Zone
  'CA': { iana: 'America/Los_Angeles', abbreviation: 'PST', dstAbbreviation: 'PDT', utcOffset: -8, dstOffset: -7 }, // California
  'OR': { iana: 'America/Los_Angeles', abbreviation: 'PST', dstAbbreviation: 'PDT', utcOffset: -8, dstOffset: -7 }, // Oregon
  'WA': { iana: 'America/Los_Angeles', abbreviation: 'PST', dstAbbreviation: 'PDT', utcOffset: -8, dstOffset: -7 }, // Washington

  // Alaska Time Zone
  'AK': { iana: 'America/Anchorage', abbreviation: 'AKST', dstAbbreviation: 'AKDT', utcOffset: -9, dstOffset: -8 }, // Alaska

  // Hawaii-Aleutian Time Zone
  'HI': { iana: 'Pacific/Honolulu', abbreviation: 'HST', dstAbbreviation: 'HST', utcOffset: -10, dstOffset: -10 }, // Hawaii (no DST)
};

/**
 * Extract state abbreviation from business location string
 * Expected formats:
 * - "Birmingham, AL, USA"
 * - "123 Main St, Birmingham, AL, USA"
 * - "Birmingham, AL 35203, USA"
 */
export function extractStateFromLocation(location: string): string | null {
  if (!location) return null;
  
  // Split by comma and look for state pattern
  const parts = location.split(',').map(part => part.trim());
  
  for (const part of parts) {
    // Look for US state abbreviation (2 uppercase letters)
    const stateMatch = part.match(/^([A-Z]{2})(\s|$)/);
    if (stateMatch) {
      const state = stateMatch[1];
      if (US_STATE_TIMEZONES[state]) {
        return state;
      }
    }
  }
  
  return null;
}

/**
 * Get timezone information for a business based on its location
 */
export function getTimezoneFromLocation(location: string): TimezoneInfo | null {
  const state = extractStateFromLocation(location);
  if (!state) return null;
  
  return US_STATE_TIMEZONES[state] || null;
}

/**
 * Check if a timezone observes daylight saving time
 */
export function observesDST(timezoneInfo: TimezoneInfo): boolean {
  return timezoneInfo.utcOffset !== timezoneInfo.dstOffset;
}

/**
 * Get current timezone info based on whether DST is in effect
 */
export function getCurrentTimezoneInfo(timezoneInfo: TimezoneInfo): {
  abbreviation: string;
  utcOffset: number;
  isDST: boolean;
} {
  const now = new Date();
  const isDST = isDaylightSavingTime(now, timezoneInfo.iana);
  
  return {
    abbreviation: isDST ? timezoneInfo.dstAbbreviation : timezoneInfo.abbreviation,
    utcOffset: isDST ? timezoneInfo.dstOffset : timezoneInfo.utcOffset,
    isDST
  };
}

/**
 * Check if daylight saving time is in effect for a given date and timezone
 */
export function isDaylightSavingTime(date: Date, ianaTimezone: string): boolean {
  try {
    // Use Intl.DateTimeFormat to detect if DST is in effect
    const january = new Date(date.getFullYear(), 0, 1);
    const july = new Date(date.getFullYear(), 6, 1);
    
    const januaryOffset = getTimezoneOffset(january, ianaTimezone);
    const julyOffset = getTimezoneOffset(july, ianaTimezone);
    const currentOffset = getTimezoneOffset(date, ianaTimezone);
    
    // DST is in effect if current offset is different from standard time offset
    const standardOffset = Math.max(januaryOffset, julyOffset);
    return currentOffset < standardOffset;
  } catch (error) {
    console.warn('Could not determine DST status:', error);
    return false;
  }
}

/**
 * Get timezone offset in minutes for a specific date and timezone
 */
function getTimezoneOffset(date: Date, ianaTimezone: string): number {
  try {
    const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const local = new Date(date.toLocaleString('en-US', { timeZone: ianaTimezone }));
    return (utc.getTime() - local.getTime()) / 60000; // Convert to minutes
  } catch (error) {
    console.warn('Could not calculate timezone offset:', error);
    return 0;
  }
}

/**
 * Convert UTC date to local date in business timezone
 */
export function convertToBusinessTimezone(utcDate: Date, timezoneInfo: TimezoneInfo): Date {
  try {
    return new Date(utcDate.toLocaleString('en-US', { timeZone: timezoneInfo.iana }));
  } catch (error) {
    console.warn('Could not convert to business timezone:', error);
    return utcDate;
  }
}

/**
 * Convert local business time to UTC
 */
export function convertToUTC(localDate: Date, timezoneInfo: TimezoneInfo): Date {
  try {
    // Create a date string in the business timezone and parse as UTC
    const localString = localDate.toISOString().slice(0, -1); // Remove 'Z'
    const utc = new Date(localString + 'Z');
    
    // Adjust for timezone offset
    const currentTzInfo = getCurrentTimezoneInfo(timezoneInfo);
    utc.setUTCHours(utc.getUTCHours() - currentTzInfo.utcOffset);
    
    return utc;
  } catch (error) {
    console.warn('Could not convert to UTC:', error);
    return localDate;
  }
}

/**
 * Format time in business timezone
 */
export function formatTimeInBusinessTimezone(
  utcTime: string, 
  timezoneInfo: TimezoneInfo,
  format: 'short' | 'long' = 'short'
): string {
  try {
    const [hours, minutes] = utcTime.split(':');
    const utcDate = new Date();
    utcDate.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const localDate = convertToBusinessTimezone(utcDate, timezoneInfo);
    
    if (format === 'long') {
      return localDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timezoneInfo.iana,
        timeZoneName: 'short'
      });
    }
    
    return localDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezoneInfo.iana
    });
  } catch (error) {
    console.warn('Could not format time in business timezone:', error);
    // Fallback to simple format
    const [hours, minutes] = utcTime.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }
}

/**
 * Get week start (Sunday) in business timezone - SIMPLIFIED
 */
export function getBusinessWeekStart(timezoneInfo: TimezoneInfo, referenceDate: Date = new Date()): string {
  try {
    // SIMPLE: Get time in business timezone and find Sunday
    const businessTime = new Date(referenceDate.toLocaleString('en-US', { timeZone: timezoneInfo.iana }));
    const dayOfWeek = businessTime.getDay(); // 0=Sunday
    const daysToSunday = -dayOfWeek; // Go back to Sunday
    const sunday = new Date(businessTime);
    sunday.setDate(businessTime.getDate() + daysToSunday);
    sunday.setHours(0, 0, 0, 0);
    
    return sunday.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Error in getBusinessWeekStart, falling back to UTC calculation:', error);
    // Fallback to UTC calculation
    const dayOfWeek = referenceDate.getDay();
    const daysToSunday = -dayOfWeek;
    const sunday = new Date(referenceDate);
    sunday.setDate(referenceDate.getDate() + daysToSunday);
    sunday.setHours(0, 0, 0, 0);
    return sunday.toISOString().split('T')[0];
  }
}

/**
 * Default fallback timezone (Eastern Time)
 */
export const DEFAULT_TIMEZONE: TimezoneInfo = US_STATE_TIMEZONES['NY'];
