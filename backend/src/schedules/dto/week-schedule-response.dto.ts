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
