import { supabase } from './supabase';
import { Business } from './business-api';

// Types
export interface ShiftTemplate {
  id: string;
  business_id: string;
  name: string;
  
  // Dual format storage
  start_label: string;      // "7:00 AM"
  end_label: string;        // "3:00 PM"
  start_min: number;        // 420
  end_min: number;          // 900
  
  color: string;
  is_active: boolean;
  
  // Legacy (deprecated but maintained for compatibility)
  /** @deprecated Use start_label */
  start_time: string;
  /** @deprecated Use end_label */
  end_time: string;
}

export interface ScheduleEmployee {
  id: string;
  full_name: string;
  employee_gid: string;
}

export interface Shift {
  id: string;
  schedule_id: string;
  employee_id: string;
  day_of_week: number;
  
  // Primary format (human-readable AM/PM)
  start_label: string;      // "9:00 AM"
  end_label: string;        // "5:00 PM"
  
  // Computation format (fast server math)
  start_min: number;        // 540
  end_min: number;          // 1020
  
  // Calculated fields
  duration_hours: number;   // 8.00 (from bulletproof integer math)
  
  // Metadata
  shift_template_id?: string;
  notes?: string;
  
  // Legacy fields (deprecated but maintained for compatibility)
  /** @deprecated Use start_label for display */
  start_time: string;       // "09:00:00"
  /** @deprecated Use end_label for display */
  end_time: string;         // "17:00:00"
}

export interface WeeklySchedule {
  id: string;
  business_id: string;
  week_start_date: string;
  status: 'draft' | 'posted';
  posted_at?: string;
  shifts: Shift[];
  employees: ScheduleEmployee[];
  total_hours_by_employee: Record<string, number>;
}

export interface CreateShiftTemplateDto {
  name: string;
  start_time: string;
  end_time: string;
  color?: string;
}

export interface CreateShiftDto {
  employee_id: string;
  day_of_week: number;
  
  // NEW: AM/PM format fields (primary input method)
  start_label?: string;     // "9:00 AM" 
  end_label?: string;       // "5:00 PM"
  
  // LEGACY: TIME format fields (backward compatibility)
  start_time?: string;      // "09:00:00"
  end_time?: string;        // "17:00:00"
  
  shift_template_id?: string;
  notes?: string;
}

export interface UpdateShiftDto {
  day_of_week?: number;
  
  // NEW: AM/PM format fields (primary input method)
  start_label?: string;     // "9:00 AM" 
  end_label?: string;       // "5:00 PM"
  
  // LEGACY: TIME format fields (backward compatibility)
  start_time?: string;      // "09:00:00"
  end_time?: string;        // "17:00:00"
  
  shift_template_id?: string;
  notes?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
}

export class SchedulesApi {
  // Shift Templates
  static async getShiftTemplates(businessId: string): Promise<ShiftTemplate[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/businesses/${businessId}/shift-templates`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch shift templates: ${response.statusText}`);
    }

    return response.json();
  }

  static async createShiftTemplate(businessId: string, data: CreateShiftTemplateDto): Promise<ShiftTemplate> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/businesses/${businessId}/shift-templates`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create shift template: ${response.statusText}`);
    }

    return response.json();
  }

  static async createDefaultShiftTemplates(businessId: string): Promise<ShiftTemplate[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/businesses/${businessId}/shift-templates/default`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to create default shift templates: ${response.statusText}`);
    }

    return response.json();
  }

  static async updateShiftTemplate(id: string, data: Partial<CreateShiftTemplateDto>): Promise<ShiftTemplate> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/shift-templates/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update shift template: ${response.statusText}`);
    }

    return response.json();
  }

  static async deleteShiftTemplate(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/shift-templates/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete shift template: ${response.statusText}`);
    }
  }

  // Weekly Schedules
  static async getWeeklySchedule(businessId: string, weekStart: string): Promise<WeeklySchedule> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/businesses/${businessId}/weeks/${weekStart}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch weekly schedule: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get weekly schedule filtered by status (draft or posted)
   * Enables proper separation between Edit Schedule and Posted Schedule tabs
   */
  static async getWeeklyScheduleByStatus(businessId: string, weekStart: string, status: 'draft' | 'posted'): Promise<WeeklySchedule | null> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/businesses/${businessId}/weeks/${weekStart}/${status}`, {
      headers,
    });

    if (response.status === 404) {
      // No schedule found for this status - return null
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch ${status} schedule: ${response.statusText}`);
    }

    return response.json();
  }

  static async createWeeklySchedule(businessId: string, weekStart: string): Promise<WeeklySchedule> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/businesses/${businessId}/weeks/${weekStart}`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to create weekly schedule: ${response.statusText}`);
    }

    return response.json();
  }

  static async postSchedule(scheduleId: string): Promise<WeeklySchedule> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/schedules/${scheduleId}/post`, {
      method: 'PUT',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to post schedule: ${response.statusText}`);
    }

    return response.json();
  }

  static async unpostSchedule(scheduleId: string): Promise<WeeklySchedule> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/schedules/${scheduleId}/unpost`, {
      method: 'PUT',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to unpost schedule: ${response.statusText}`);
    }

    return response.json();
  }

  // Shifts
  static async createShift(scheduleId: string, shift: CreateShiftDto): Promise<Shift> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/schedules/${scheduleId}/shifts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(shift),
    });

    if (!response.ok) {
      throw new Error(`Failed to create shift: ${response.statusText}`);
    }

    return response.json();
  }

  static async updateShift(shiftId: string, shift: UpdateShiftDto): Promise<Shift> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/shifts/${shiftId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(shift),
    });

    if (!response.ok) {
      throw new Error(`Failed to update shift: ${response.statusText}`);
    }

    return response.json();
  }

  static async deleteShift(shiftId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/shifts/${shiftId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete shift: ${response.statusText}`);
    }
  }

  static async bulkCreateShifts(scheduleId: string, shifts: CreateShiftDto[]): Promise<Shift[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/schedules/${scheduleId}/shifts/bulk`, {
      method: 'POST',
      headers,
      body: JSON.stringify(shifts),
    });

    if (!response.ok) {
      throw new Error(`Failed to create shifts: ${response.statusText}`);
    }

    return response.json();
  }

  // Utilities
  static async calculateEmployeeHours(scheduleId: string): Promise<Record<string, number>> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/schedules/schedules/${scheduleId}/hours`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to calculate employee hours: ${response.statusText}`);
    }

    return response.json();
  }
}

// Schedule window configuration
export const SCHEDULE_WINDOW_WEEKS = 4;

// Utility functions

/**
 * Get current week start (Sunday) - BULLETPROOF VERSION
 * No timezone complexity - simple and reliable
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
 * Get the start of the scheduling window (current Sunday) - BULLETPROOF VERSION
 * No timezone complexity - always returns current Sunday
 */
export function getScheduleWindowStart(): string {
  return getCurrentWeekStart();
}

/**
 * Get the end of the scheduling window (4 weeks from current Sunday) - BULLETPROOF VERSION
 */
export function getScheduleWindowEnd(): string {
  const startDate = getScheduleWindowStart();
  const start = new Date(startDate + 'T00:00:00');
  start.setDate(start.getDate() + (SCHEDULE_WINDOW_WEEKS * 7));
  return start.toISOString().split('T')[0];
}

/**
 * Check if a week is within the editable 4-week window - BULLETPROOF VERSION
 */
export function isWeekInEditableWindow(weekStart: string): boolean {
  const windowStart = getScheduleWindowStart();
  const windowEnd = getScheduleWindowEnd();
  return weekStart >= windowStart && weekStart < windowEnd;
}

/**
 * Check if a week is in the past - BULLETPROOF VERSION
 */
export function isWeekInPast(weekStart: string): boolean {
  const windowStart = getScheduleWindowStart();
  return weekStart < windowStart;
}

/**
 * Check if it's safe to navigate to next week (within window) - BULLETPROOF VERSION
 */
export function canNavigateToNextWeek(currentWeek: string): boolean {
  const nextWeek = getNextWeek(currentWeek);
  const windowEnd = getScheduleWindowEnd();
  return nextWeek < windowEnd;
}

/**
 * Format week range for display (Sunday to Saturday) - BULLETPROOF VERSION
 * No timezone complexity - what you see is what you get
 * Fixed: Properly handles date parsing to avoid timezone offset issues
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
  
  return `${startStr} - ${endStr}, ${year}`;
}

/**
 * Format time for display - BULLETPROOF VERSION
 * Prioritizes AM/PM labels, converts legacy TIME format without timezone complexity
 */
export function formatTime(timeString: string): string {
  // Check if this looks like an AM/PM format already (contains AM/PM)
  if (timeString.match(/\s?(AM|PM)$/i)) {
    return timeString; // Already in AM/PM format, return as-is
  }
  
  // Convert legacy TIME format (HH:MM:SS or HH:MM) to AM/PM
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Format shift time for display - uses new AM/PM labels when available
 * This is the preferred method for displaying shift times
 */
export function formatShiftTime(shift: Shift): { start: string; end: string } {
  return {
    start: shift.start_label || formatTime(shift.start_time),
    end: shift.end_label || formatTime(shift.end_time)
  };
}

/**
 * Format shift template time for display - uses new AM/PM labels when available
 */
export function formatTemplateTime(template: ShiftTemplate): { start: string; end: string } {
  return {
    start: template.start_label || formatTime(template.start_time),
    end: template.end_label || formatTime(template.end_time)
  };
}

export function getNextWeek(weekStart: string): string {
  const date = new Date(weekStart + 'T00:00:00');
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

export function getPreviousWeek(weekStart: string): string {
  const date = new Date(weekStart + 'T00:00:00');
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
}
