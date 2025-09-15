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
