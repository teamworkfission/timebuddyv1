// =====================================================
// CONFIRMED HOURS API CLIENT
// =====================================================
// Purpose: Frontend API client for employee hours confirmation system
// Integration: Works with backend /schedules/employee/hours endpoints

import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface ConfirmedHoursRecord {
  id: string;
  employee_id: string;
  business_id: string;
  week_start_date: string;
  sunday_hours: number;
  monday_hours: number;
  tuesday_hours: number;
  wednesday_hours: number;
  thursday_hours: number;
  friday_hours: number;
  saturday_hours: number;
  total_hours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledHours {
  sunday_hours: number;
  monday_hours: number;
  tuesday_hours: number;
  wednesday_hours: number;
  thursday_hours: number;
  friday_hours: number;
  saturday_hours: number;
  total_hours: number;
}

export interface WeeklyHoursData {
  confirmed_hours?: ConfirmedHoursRecord;
  scheduled_hours: ScheduledHours;
  business: {
    business_id: string;
    name: string;
  };
}

export interface CreateHoursRequest {
  business_id: string;
  week_start_date: string;
  sunday_hours?: number;
  monday_hours?: number;
  tuesday_hours?: number;
  wednesday_hours?: number;
  thursday_hours?: number;
  friday_hours?: number;
  saturday_hours?: number;
  notes?: string;
}

export interface UpdateHoursRequest {
  sunday_hours?: number;
  monday_hours?: number;
  tuesday_hours?: number;
  wednesday_hours?: number;
  thursday_hours?: number;
  friday_hours?: number;
  saturday_hours?: number;
  notes?: string;
}

export interface SubmitHoursRequest {
  notes?: string;
}

export interface RejectHoursRequest {
  rejection_reason: string;
  notes?: string;
}

// =====================================================
// API HELPER FUNCTIONS
// =====================================================

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('No authentication token found');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Use default error message if JSON parsing fails
    }
    
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  
  return response.text() as T;
}

// =====================================================
// EMPLOYEE API FUNCTIONS
// =====================================================

/**
 * Get weekly hours data with scheduled hours prefill
 * Returns both confirmed hours (if exists) and scheduled hours from posted schedules
 */
export async function getWeeklyHours(
  businessId: string,
  weekStart: string
): Promise<WeeklyHoursData> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(
    `${API_BASE_URL}/schedules/employee/hours/${businessId}/${weekStart}`,
    {
      method: 'GET',
      headers,
    }
  );

  return handleResponse<WeeklyHoursData>(response);
}

/**
 * Create new confirmed hours record
 */
export async function createConfirmedHours(
  data: CreateHoursRequest
): Promise<ConfirmedHoursRecord> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/schedules/employee/hours`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  return handleResponse<ConfirmedHoursRecord>(response);
}

/**
 * Update existing confirmed hours (draft status only)
 */
export async function updateConfirmedHours(
  id: string,
  data: UpdateHoursRequest
): Promise<ConfirmedHoursRecord> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/schedules/employee/hours/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });

  return handleResponse<ConfirmedHoursRecord>(response);
}

/**
 * Submit confirmed hours for employer approval
 */
export async function submitConfirmedHours(
  id: string,
  data: SubmitHoursRequest = {}
): Promise<ConfirmedHoursRecord> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/schedules/employee/hours/${id}/submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  return handleResponse<ConfirmedHoursRecord>(response);
}

/**
 * Get list of employee's confirmed hours records
 */
export async function getConfirmedHoursList(
  businessId?: string
): Promise<ConfirmedHoursRecord[]> {
  const headers = await getAuthHeaders();
  
  const params = new URLSearchParams();
  if (businessId) {
    params.append('business_id', businessId);
  }
  
  const url = `${API_BASE_URL}/schedules/employee/hours/list${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  return handleResponse<ConfirmedHoursRecord[]>(response);
}

// =====================================================
// EMPLOYER API FUNCTIONS
// =====================================================

/**
 * Get confirmed hours for employer's business (submitted/approved only)
 */
export async function getEmployerConfirmedHoursList(
  businessId: string,
  status?: 'submitted' | 'approved'
): Promise<ConfirmedHoursRecord[]> {
  const headers = await getAuthHeaders();
  
  const params = new URLSearchParams();
  if (status) {
    params.append('status', status);
  }
  
  const url = `${API_BASE_URL}/schedules/employer/hours/${businessId}${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  return handleResponse<ConfirmedHoursRecord[]>(response);
}

/**
 * Approve submitted hours (employer only)
 */
export async function approveConfirmedHours(
  id: string,
  notes?: string
): Promise<ConfirmedHoursRecord> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/schedules/employer/hours/${id}/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ notes }),
  });

  return handleResponse<ConfirmedHoursRecord>(response);
}

/**
 * Reject submitted hours with reason (employer only)
 */
export async function rejectConfirmedHours(
  id: string,
  rejection_reason: string,
  notes?: string
): Promise<ConfirmedHoursRecord> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/schedules/employer/hours/${id}/reject`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ rejection_reason, notes }),
  });

  return handleResponse<ConfirmedHoursRecord>(response);
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Calculate total hours from daily hours
 * Uses standardized calculation for consistency across the app
 */
// MOVED TO date-utils.ts - Import from there instead
export { calculateTotalHours } from './date-utils';

// MOVED TO date-utils.ts - Import from there instead  
export { getCurrentWeekStart } from './date-utils';

// MOVED TO date-utils.ts - Import from there instead
export { getNextWeek } from './date-utils';

// MOVED TO date-utils.ts - Import from there instead
export { getPreviousWeek } from './date-utils';

// MOVED TO date-utils.ts - Import from there instead
export { formatWeekRange } from './date-utils';

// MOVED TO date-utils.ts - Import from there instead
export { validateHours } from './date-utils';

/**
 * Format hours for display with standardized formatting
 * Ensures consistent display across the entire application
 */
export function formatHours(hours: number): string {
  // Apply consistent precision rounding first
  const standardizedHours = Math.round(hours * 100) / 100;
  
  // Always show at least 1 decimal place for clarity
  if (standardizedHours % 1 === 0) {
    // Whole number - show .0 for consistency
    return `${standardizedHours.toFixed(1)}`;
  } else {
    // Has decimal - show up to 2 places, remove trailing zeros after first decimal
    return standardizedHours.toFixed(2).replace(/\.?0+$/, '').replace(/\.$/, '.0');
  }
}

// MOVED TO date-utils.ts - Import from there instead  
export { formatDayWithDate } from './date-utils';
