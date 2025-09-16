import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { WeeklySchedule, Shift, ScheduleEmployee } from './dto/week-schedule-response.dto';
import { 
  calculateShiftHours,
  parse12hToMinutes,
  formatMinutesToAmPm,
  canonicalizeTimeInput,
  minutesToLegacyTime,
  isValidAmPmTime
} from '../utils/time-parser';

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

  /**
   * Get weekly schedule only if it matches the specified status
   * This enables proper separation between draft and posted schedule views
   */
  async getWeeklyScheduleByStatus(businessId: string, weekStart: string, status: 'draft' | 'posted'): Promise<WeeklySchedule | null> {
    const supabase = this.supabaseService.admin;
    
    // Get the schedule filtered by status
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('weekly_schedules')
      .select('*')
      .eq('business_id', businessId)
      .eq('week_start_date', weekStart)
      .eq('status', status)
      .single();

    if (scheduleError) {
      if (scheduleError.code === 'PGRST116') {
        return null; // Schedule not found or doesn't match status
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

  /**
   * Create shift with dual storage support (AM/PM labels + legacy TIME format)
   * Supports both legacy format and new AM/PM format for seamless transition
   */
  async createShift(scheduleId: string, createDto: CreateShiftDto): Promise<Shift> {
    const supabase = this.supabaseService.admin;
    
    // PAST DAY VALIDATION: Prevent scheduling shifts in the past
    await this.validateShiftNotInPast(scheduleId, createDto.day_of_week);
    
    let startLabel: string;
    let endLabel: string;
    let startMin: number;
    let endMin: number;
    let startTime: string;
    let endTime: string;

    try {
      // Check if we have AM/PM labels (new format)
      if ((createDto as any).start_label && (createDto as any).end_label) {
        // New AM/PM format - canonicalize and validate
        startLabel = canonicalizeTimeInput((createDto as any).start_label);
        endLabel = canonicalizeTimeInput((createDto as any).end_label);
        
        // Convert to minutes for storage
        startMin = parse12hToMinutes(startLabel);
        endMin = parse12hToMinutes(endLabel);
        
        // Generate legacy format for backward compatibility
        startTime = minutesToLegacyTime(startMin);
        endTime = minutesToLegacyTime(endMin);
        
      } else if (createDto.start_time && createDto.end_time) {
        // Legacy TIME format - normalize and convert
        startTime = this.normalizeTimeFormat(createDto.start_time);
        endTime = this.normalizeTimeFormat(createDto.end_time);
        
        // Convert legacy to AM/PM format
        startLabel = this.convertLegacyTimeToAmPm(startTime);
        endLabel = this.convertLegacyTimeToAmPm(endTime);
        
        // Convert to minutes
        startMin = parse12hToMinutes(startLabel);
        endMin = parse12hToMinutes(endLabel);
        
      } else {
        throw new Error('Either start_label/end_label or start_time/end_time must be provided');
      }

      // Calculate duration for validation
      const durationHours = calculateShiftHours(startLabel, endLabel);
      
      // Check for duplicate shifts before inserting
      await this.checkForDuplicateShift(scheduleId, createDto.employee_id, createDto.day_of_week, startMin, endMin, startLabel, endLabel);
      
      // Insert shift with dual storage format
      const { data, error } = await supabase
        .from('shifts')
        .insert({
          schedule_id: scheduleId,
          employee_id: createDto.employee_id,
          day_of_week: createDto.day_of_week,
          
          // Primary storage (new bulletproof format)
          start_label: startLabel,
          end_label: endLabel,
          start_min: startMin,
          end_min: endMin,
          
          // Legacy compatibility (for rollback safety)
          start_time: startTime,
          end_time: endTime,
          
          shift_template_id: createDto.shift_template_id,
          notes: createDto.notes,
        })
        .select()
        .single();

      if (error) {
        // Handle database constraint violations with helpful messages
        if (error.code === '23505' && error.message.includes('unique_employee_day_times')) {
          // This should be rare since we check beforehand, but provides backup protection
          throw new BadRequestException(
            `Duplicate shift detected: Employee already has an identical shift at this time on this day. ` +
            `Please choose different times or remove the existing shift first.`
          );
        }
        throw new Error(`Failed to create shift: ${error.message}`);
      }

      return {
        ...data,
        duration_hours: durationHours,
      };
      
    } catch (parseError) {
      // Enhanced error handling with context
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      throw new BadRequestException(`Invalid time format: ${errorMessage}`);
    }
  }

  async updateShift(shiftId: string, updateDto: UpdateShiftDto): Promise<Shift> {
    const supabase = this.supabaseService.admin;
    
    // PAST DAY VALIDATION: If changing day_of_week, ensure it's not in the past
    if (updateDto.day_of_week !== undefined) {
      // Get the schedule_id for this shift
      const { data: shiftData, error: shiftError } = await supabase
        .from('shifts')
        .select('schedule_id')
        .eq('id', shiftId)
        .single();
        
      if (shiftError || !shiftData) {
        throw new NotFoundException(`Shift with ID ${shiftId} not found`);
      }
      
      await this.validateShiftNotInPast(shiftData.schedule_id, updateDto.day_of_week);
    }
    
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
      duration_hours: this.calculateShiftDuration(
        data.start_time, 
        data.end_time, 
        data.start_label, 
        data.end_label
      ),
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
      duration_hours: this.calculateShiftDuration(
        shift.start_time, 
        shift.end_time, 
        shift.start_label, 
        shift.end_label
      ),
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
      duration_hours: this.calculateShiftDuration(
        shift.start_time, 
        shift.end_time, 
        shift.start_label, 
        shift.end_label
      ),
    }));
  }

  /**
   * Calculate shift duration using bulletproof integer math
   * Handles both legacy TIME format and new AM/PM labels
   * Immune to server timezone and DST issues
   */
  private calculateShiftDuration(startTime: string, endTime: string, startLabel?: string, endLabel?: string): number {
    // Prefer AM/PM labels if available (bulletproof path)
    if (startLabel && endLabel) {
      try {
        return calculateShiftHours(startLabel, endLabel);
      } catch (error) {
        // Fall through to legacy calculation if labels are invalid
        console.warn('Failed to calculate duration from labels, using legacy method:', error);
      }
    }
    
    // Legacy fallback: convert TIME format to AM/PM and calculate
    // This maintains backward compatibility during transition
    try {
      const startAmPm = this.convertLegacyTimeToAmPm(startTime);
      const endAmPm = this.convertLegacyTimeToAmPm(endTime);
      return calculateShiftHours(startAmPm, endAmPm);
    } catch (error) {
      console.error('Failed to calculate shift duration:', error);
      // Ultimate fallback to prevent system failure
      return 8.0; // Default 8-hour shift
    }
  }

  /**
   * Convert legacy TIME format (HH:MM:SS) to AM/PM format
   * Used during transition period for backward compatibility
   */
  private convertLegacyTimeToAmPm(timeString: string): string {
    const [hours, minutes] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    return formatMinutesToAmPm(totalMinutes);
  }

  private normalizeTimeFormat(timeString: string): string {
    // If time is in HH:MM format, add :00 for seconds
    if (timeString.match(/^\d{1,2}:\d{2}$/)) {
      return `${timeString}:00`;
    }
    // If already in HH:MM:SS format, return as is
    return timeString;
  }

  /**
   * Check for duplicate shifts and provide clear error messages
   * Prevents creating identical shifts (same employee, same day, same exact times)
   */
  private async checkForDuplicateShift(
    scheduleId: string, 
    employeeId: string, 
    dayOfWeek: number, 
    startMin: number, 
    endMin: number,
    startLabel: string,
    endLabel: string
  ): Promise<void> {
    const supabase = this.supabaseService.admin;
    
    // Check if duplicate shift already exists
    const { data: existingShift, error } = await supabase
      .from('shifts')
      .select(`
        id,
        shift_template_id,
        shift_templates!inner(name)
      `)
      .eq('schedule_id', scheduleId)
      .eq('employee_id', employeeId)
      .eq('day_of_week', dayOfWeek)
      .eq('start_min', startMin)
      .eq('end_min', endMin)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Unexpected error (not "not found")
      throw new Error(`Failed to check for duplicate shift: ${error.message}`);
    }

    if (existingShift) {
      // Duplicate found - create helpful error message
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[dayOfWeek];
      // Handle the nested shift_templates object safely
      const templateName = (existingShift as any).shift_templates?.name || 'Unknown';
      
      throw new BadRequestException(
        `Duplicate shift detected: Employee already has a ${templateName} shift (${startLabel} - ${endLabel}) on ${dayName}. ` +
        `Please choose different times or remove the existing shift first.`
      );
    }
  }

  /**
   * Validate that a shift is not being scheduled for a past day
   * Prevents users from creating shifts for days that have already passed
   */
  private async validateShiftNotInPast(scheduleId: string, dayOfWeek: number): Promise<void> {
    const supabase = this.supabaseService.admin;
    
    // Get the weekly schedule to find the week_start_date
    const { data: schedule, error: scheduleError } = await supabase
      .from('weekly_schedules')
      .select('week_start_date')
      .eq('id', scheduleId)
      .single();
    
    if (scheduleError || !schedule) {
      throw new NotFoundException('Weekly schedule not found');
    }
    
    // Calculate the actual date of this shift
    const weekStartDate = new Date(schedule.week_start_date + 'T00:00:00');
    const shiftDate = new Date(weekStartDate);
    shiftDate.setDate(weekStartDate.getDate() + dayOfWeek);
    
    // Get current date (local time, no timezone complexity)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    // Check if shift date is in the past
    if (shiftDate < today) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[dayOfWeek];
      const shiftDateString = shiftDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      
      throw new BadRequestException(
        `Cannot schedule shifts for past days. ` +
        `${dayName} (${shiftDateString}) has already passed. ` +
        `Please select a current or future date.`
      );
    }
  }
}
