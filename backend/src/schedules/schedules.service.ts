import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { WeeklySchedule, Shift, ScheduleEmployee } from './dto/week-schedule-response.dto';

@Injectable()
export class SchedulesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getOrCreateWeeklySchedule(businessId: string, weekStart: string, userId: string): Promise<WeeklySchedule> {
    // First try to get existing schedule
    let schedule = await this.getWeeklySchedule(businessId, weekStart);
    
    if (!schedule) {
      // Create new schedule if it doesn't exist
      schedule = await this.createWeeklySchedule({ business_id: businessId, week_start_date: weekStart }, userId);
    }

    return schedule;
  }

  async getWeeklySchedule(businessId: string, weekStart: string): Promise<WeeklySchedule | null> {
    const supabase = this.supabaseService.admin;
    
    // Get the schedule
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('weekly_schedules')
      .select('*')
      .eq('business_id', businessId)
      .eq('week_start_date', weekStart)
      .single();

    if (scheduleError) {
      if (scheduleError.code === 'PGRST116') {
        return null; // Schedule not found
      }
      throw new Error(`Failed to fetch weekly schedule: ${scheduleError.message}`);
    }

    // Get employees for this business
    const employees = await this.getBusinessEmployees(businessId);

    // Get shifts for this schedule
    const shifts = await this.getScheduleShifts(scheduleData.id);

    // Calculate total hours
    const totalHours = await this.calculateEmployeeHours(scheduleData.id);

    return {
      ...scheduleData,
      employees,
      shifts,
      total_hours_by_employee: totalHours,
    };
  }

  async createWeeklySchedule(createDto: CreateScheduleDto, userId: string): Promise<WeeklySchedule> {
    const supabase = this.supabaseService.admin;
    
    // Validate that week_start_date is a Sunday (US standard week structure)
    // Using T00:00:00 to ensure local time parsing and avoid timezone conversion issues
    const date = new Date(createDto.week_start_date + 'T00:00:00');
    if (date.getDay() !== 0) {
      throw new BadRequestException('week_start_date must be a Sunday (US standard week structure)');
    }

    const { data, error } = await supabase
      .from('weekly_schedules')
      .insert({
        business_id: createDto.business_id,
        week_start_date: createDto.week_start_date,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new BadRequestException(`Schedule for week ${createDto.week_start_date} already exists for this business`);
      }
      throw new Error(`Failed to create weekly schedule: ${error.message}`);
    }

    // Get employees and return complete schedule
    const employees = await this.getBusinessEmployees(createDto.business_id);

    return {
      ...data,
      employees,
      shifts: [],
      total_hours_by_employee: {},
    };
  }

  async postSchedule(scheduleId: string): Promise<WeeklySchedule> {
    const supabase = this.supabaseService.admin;
    
    const { data, error } = await supabase
      .from('weekly_schedules')
      .update({
        status: 'posted',
        posted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
      }
      throw new Error(`Failed to post schedule: ${error.message}`);
    }

    // Return complete schedule data
    const employees = await this.getBusinessEmployees(data.business_id);
    const shifts = await this.getScheduleShifts(scheduleId);
    const totalHours = await this.calculateEmployeeHours(scheduleId);

    return {
      ...data,
      employees,
      shifts,
      total_hours_by_employee: totalHours,
    };
  }

  async unpostSchedule(scheduleId: string): Promise<WeeklySchedule> {
    const supabase = this.supabaseService.admin;
    
    const { data, error } = await supabase
      .from('weekly_schedules')
      .update({
        status: 'draft',
        posted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
      }
      throw new Error(`Failed to unpost schedule: ${error.message}`);
    }

    // Return complete schedule data
    const employees = await this.getBusinessEmployees(data.business_id);
    const shifts = await this.getScheduleShifts(scheduleId);
    const totalHours = await this.calculateEmployeeHours(scheduleId);

    return {
      ...data,
      employees,
      shifts,
      total_hours_by_employee: totalHours,
    };
  }

  async createShift(scheduleId: string, createDto: CreateShiftDto): Promise<Shift> {
    const supabase = this.supabaseService.admin;
    
    // Normalize time format to HH:MM:SS if only HH:MM is provided
    const normalizedDto = {
      ...createDto,
      start_time: this.normalizeTimeFormat(createDto.start_time),
      end_time: this.normalizeTimeFormat(createDto.end_time),
    };
    
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        schedule_id: scheduleId,
        ...normalizedDto,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create shift: ${error.message}`);
    }

    // Calculate duration and return
    return {
      ...data,
      duration_hours: this.calculateShiftDuration(data.start_time, data.end_time),
    };
  }

  async updateShift(shiftId: string, updateDto: UpdateShiftDto): Promise<Shift> {
    const supabase = this.supabaseService.admin;
    
    // Normalize time formats if provided
    const normalizedDto = { ...updateDto };
    if (updateDto.start_time) {
      normalizedDto.start_time = this.normalizeTimeFormat(updateDto.start_time);
    }
    if (updateDto.end_time) {
      normalizedDto.end_time = this.normalizeTimeFormat(updateDto.end_time);
    }
    
    const { data, error } = await supabase
      .from('shifts')
      .update({
        ...normalizedDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shiftId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Shift with ID ${shiftId} not found`);
      }
      throw new Error(`Failed to update shift: ${error.message}`);
    }

    return {
      ...data,
      duration_hours: this.calculateShiftDuration(data.start_time, data.end_time),
    };
  }

  async deleteShift(shiftId: string): Promise<void> {
    const supabase = this.supabaseService.admin;
    
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', shiftId);

    if (error) {
      throw new Error(`Failed to delete shift: ${error.message}`);
    }
  }

  async bulkCreateShifts(scheduleId: string, shifts: CreateShiftDto[]): Promise<Shift[]> {
    const supabase = this.supabaseService.admin;
    
    const shiftsWithScheduleId = shifts.map(shift => ({
      schedule_id: scheduleId,
      ...shift,
      start_time: this.normalizeTimeFormat(shift.start_time),
      end_time: this.normalizeTimeFormat(shift.end_time),
    }));

    const { data, error } = await supabase
      .from('shifts')
      .insert(shiftsWithScheduleId)
      .select();

    if (error) {
      throw new Error(`Failed to create shifts: ${error.message}`);
    }

    return data.map(shift => ({
      ...shift,
      duration_hours: this.calculateShiftDuration(shift.start_time, shift.end_time),
    }));
  }

  async calculateEmployeeHours(scheduleId: string): Promise<Record<string, number>> {
    const shifts = await this.getScheduleShifts(scheduleId);
    const hoursByEmployee: Record<string, number> = {};

    shifts.forEach(shift => {
      if (!hoursByEmployee[shift.employee_id]) {
        hoursByEmployee[shift.employee_id] = 0;
      }
      hoursByEmployee[shift.employee_id] += shift.duration_hours;
    });

    return hoursByEmployee;
  }

  private async getBusinessEmployees(businessId: string): Promise<ScheduleEmployee[]> {
    const supabase = this.supabaseService.admin;
    
    const { data, error } = await supabase
      .from('business_employees')
      .select(`
        id,
        employees!inner (
          id,
          full_name,
          employee_gid
        )
      `)
      .eq('business_id', businessId);

    if (error) {
      throw new Error(`Failed to fetch business employees: ${error.message}`);
    }

    return (data || []).map((item: any) => ({
      id: item.employees.id,
      full_name: item.employees.full_name,
      employee_gid: item.employees.employee_gid,
    })).filter(Boolean);
  }

  private async getScheduleShifts(scheduleId: string): Promise<Shift[]> {
    const supabase = this.supabaseService.admin;
    
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('day_of_week')
      .order('start_time');

    if (error) {
      throw new Error(`Failed to fetch schedule shifts: ${error.message}`);
    }

    return data.map(shift => ({
      ...shift,
      duration_hours: this.calculateShiftDuration(shift.start_time, shift.end_time),
    }));
  }

  private calculateShiftDuration(startTime: string, endTime: string): number {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    // Handle overnight shifts
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
    
    const durationMs = end.getTime() - start.getTime();
    return durationMs / (1000 * 60 * 60); // Convert to hours
  }

  private normalizeTimeFormat(timeString: string): string {
    // If time is in HH:MM format, add :00 for seconds
    if (timeString.match(/^\d{1,2}:\d{2}$/)) {
      return `${timeString}:00`;
    }
    // If already in HH:MM:SS format, return as is
    return timeString;
  }
}
