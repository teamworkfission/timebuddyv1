import { supabase } from './supabase';

// Types
export interface ShiftTemplate {
  id: string;
  business_id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
  is_active: boolean;
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
  start_time: string;
  end_time: string;
  shift_template_id?: string;
  notes?: string;
  duration_hours: number;
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
  start_time: string;
  end_time: string;
  shift_template_id?: string;
  notes?: string;
}

export interface UpdateShiftDto {
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
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

// Utility functions
export function getCurrentWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMonday);
  return monday.toISOString().split('T')[0];
}

export function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric' 
  };
  
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', options);
  const year = start.getFullYear();
  
  return `${startStr} - ${endStr}, ${year}`;
}

export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function getNextWeek(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

export function getPreviousWeek(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
}
