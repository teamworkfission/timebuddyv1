/**
 * Production-safe time parsing utilities with ZERO Date object dependencies
 * Immune to server timezone issues and DST transitions
 * 
 * These utilities provide bulletproof time handling for the US Weekly Scheduling System:
 * - Parse AM/PM formats to minutes (0-1439) 
 * - Handle overnight shifts correctly (10 PM → 6 AM = 8 hours)
 * - Canonicalize user inputs ("9 am" → "9:00 AM")
 * - Calculate shift durations with integer math only
 */

/**
 * Parse 12-hour AM/PM time to minutes since midnight (0-1439)
 * Handles flexible input: "9 AM", "9:00 AM", "9:30 PM", "12:00 AM", etc.
 * 
 * @param label - Time string in AM/PM format
 * @returns Minutes since midnight (0-1439)
 * @throws Error for invalid time formats
 */
export function parse12hToMinutes(label: string): number {
  // Flexible regex: accepts "9 AM", "9:00 AM", "9:30 PM", "12:00 AM"
  const match = label.trim().toUpperCase().match(/^([1-9]|1[0-2])(?::([0-5][0-9]))?\s?(AM|PM)$/);
  
  if (!match) {
    throw new Error(`Invalid time format: "${label}". Expected format: "H:MM AM/PM" or "H AM/PM"`);
  }
  
  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3];
  
  // Validate parsed values
  if (hour < 1 || hour > 12) {
    throw new Error(`Invalid hour: ${hour}. Must be 1-12`);
  }
  
  if (minute < 0 || minute > 59) {
    throw new Error(`Invalid minute: ${minute}. Must be 0-59`);
  }
  
  // Convert 12-hour to 24-hour format
  if (ampm === 'AM') {
    hour = hour % 12;          // 12 AM → 0, others unchanged
  } else {
    hour = (hour % 12) + 12;   // 12 PM → 12, others +12
  }
  
  return hour * 60 + minute;
}

/**
 * Convert minutes since midnight back to 12-hour AM/PM format
 * 
 * @param minutes - Minutes since midnight (0-1439)
 * @returns Formatted time string (e.g., "9:30 AM", "10:00 PM")
 */
export function formatMinutesToAmPm(minutes: number): string {
  if (minutes < 0 || minutes > 1439) {
    throw new Error(`Invalid minutes: ${minutes}. Must be 0-1439`);
  }
  
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  
  const ampm = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  
  return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Canonicalize time input to standard format
 * Converts flexible input like "9 am", "10:30PM" to "9:00 AM", "10:30 PM"
 * 
 * @param input - Raw time input from user
 * @returns Canonicalized time string
 */
export function canonicalizeTimeInput(input: string): string {
  // Clean up spacing and case
  const cleaned = input.trim().replace(/\s+/g, ' ').toUpperCase();
  
  // Parse to minutes and back to get canonical format
  const minutes = parse12hToMinutes(cleaned);
  return formatMinutesToAmPm(minutes);
}

/**
 * Calculate shift duration in hours using bulletproof integer math
 * Handles overnight shifts correctly (e.g., 10:00 PM → 6:00 AM = 8.00 hours)
 * 
 * @param startLabel - Start time in AM/PM format
 * @param endLabel - End time in AM/PM format  
 * @returns Duration in hours with 2 decimal precision
 */
export function calculateShiftHours(startLabel: string, endLabel: string): number {
  const startMinutes = parse12hToMinutes(startLabel);
  const endMinutes = parse12hToMinutes(endLabel);
  
  // Handle overnight shifts: if end <= start, assume next day
  const totalMinutes = endMinutes >= startMinutes 
    ? endMinutes - startMinutes
    : (1440 - startMinutes) + endMinutes;  // 1440 = minutes in a day
    
  // Convert to hours with 2 decimal precision
  return Math.round((totalMinutes / 60) * 100) / 100;
}

/**
 * Convert minutes to legacy TIME format for rollback compatibility
 * Used to populate legacy start_time/end_time columns
 * 
 * @param minutes - Minutes since midnight (0-1439)
 * @returns Legacy time format (HH:MM:SS)
 */
export function minutesToLegacyTime(minutes: number): string {
  if (minutes < 0 || minutes > 1439) {
    throw new Error(`Invalid minutes: ${minutes}. Must be 0-1439`);
  }
  
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
}

/**
 * Validate AM/PM time string format
 * Used for DTO validation
 * 
 * @param timeString - Time string to validate
 * @returns true if valid AM/PM format
 */
export function isValidAmPmTime(timeString: string): boolean {
  try {
    parse12hToMinutes(timeString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current time in AM/PM format
 * Used for testing and default values
 * 
 * @returns Current time in "H:MM AM/PM" format
 */
export function getCurrentTimeAmPm(): string {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return formatMinutesToAmPm(minutes);
}

// Export validation regex for DTO decorators
export const AM_PM_TIME_REGEX = /^([1-9]|1[0-2])(?::[0-5][0-9])?\s?(AM|PM)$/i;
