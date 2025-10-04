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
import { 
  CreateConfirmedHoursDto, 
  UpdateConfirmedHoursDto, 
  ConfirmedHoursResponseDto,
  WeeklyHoursWithScheduleDto,
  SubmitHoursDto,
  ApproveHoursDto,
  RejectHoursDto
} from './dto/confirmed-hours.dto';

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
      
      // Check for overlapping shifts before inserting
      await this.checkForOverlappingShifts(scheduleId, createDto.employee_id, createDto.day_of_week, startMin, endMin, startLabel, endLabel);
      
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

  /**
   * Update shift with dual storage support (AM/PM labels + legacy TIME format)
   * Supports both legacy format and new AM/PM format for seamless transition
   */
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
    
    // Prepare update data with dual format support
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Copy non-time fields directly
    if (updateDto.day_of_week !== undefined) updateData.day_of_week = updateDto.day_of_week;
    if (updateDto.shift_template_id !== undefined) updateData.shift_template_id = updateDto.shift_template_id;
    if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;

    // Handle time updates with dual format conversion
    const hasNewFormat = (updateDto as any).start_label || (updateDto as any).end_label;
    const hasLegacyFormat = updateDto.start_time || updateDto.end_time;

    if (hasNewFormat || hasLegacyFormat) {
      let startLabel: string;
      let endLabel: string;
      let startMin: number;
      let endMin: number;
      let startTime: string;
      let endTime: string;

      try {
        if (hasNewFormat) {
          // New AM/PM format - canonicalize and validate
          if ((updateDto as any).start_label) {
            startLabel = canonicalizeTimeInput((updateDto as any).start_label);
            startMin = parse12hToMinutes(startLabel);
            startTime = minutesToLegacyTime(startMin);
            
            updateData.start_label = startLabel;
            updateData.start_min = startMin;
            updateData.start_time = startTime;
          }
          
          if ((updateDto as any).end_label) {
            endLabel = canonicalizeTimeInput((updateDto as any).end_label);
            endMin = parse12hToMinutes(endLabel);
            endTime = minutesToLegacyTime(endMin);
            
            updateData.end_label = endLabel;
            updateData.end_min = endMin;
            updateData.end_time = endTime;
          }

        } else if (hasLegacyFormat) {
          // Legacy TIME format - normalize and convert
          if (updateDto.start_time) {
            startTime = this.normalizeTimeFormat(updateDto.start_time);
            startLabel = this.convertLegacyTimeToAmPm(startTime);
            startMin = parse12hToMinutes(startLabel);
            
            updateData.start_time = startTime;
            updateData.start_label = startLabel;
            updateData.start_min = startMin;
          }
          
          if (updateDto.end_time) {
            endTime = this.normalizeTimeFormat(updateDto.end_time);
            endLabel = this.convertLegacyTimeToAmPm(endTime);
            endMin = parse12hToMinutes(endLabel);
            
            updateData.end_time = endTime;
            updateData.end_label = endLabel;
            updateData.end_min = endMin;
          }
        }

      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
        throw new BadRequestException(`Invalid time format: ${errorMessage}`);
      }
    }
    
    const { data, error } = await supabase
      .from('shifts')
      .update(updateData)
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

  // Employee Schedule Methods

  async getEmployeeSchedules(employeeUserId: string, weekStart: string): Promise<{
    schedules: Array<WeeklySchedule & { business_name: string }>;
    businesses: Array<{ business_id: string; name: string }>;
  }> {
    const supabase = this.supabaseService.admin;
    
    // First get the employee record from user_id
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', employeeUserId)
      .single();
      
    if (empError || !employee) {
      throw new NotFoundException('Employee profile not found');
    }

    // Get all businesses this employee works for
    const { data: businessEmployees, error: beError } = await supabase
      .from('business_employees')
      .select(`
        business_id,
        businesses!inner(
          business_id,
          name
        )
      `)
      .eq('employee_id', employee.id) as any;
      
    if (beError) {
      throw new Error(`Failed to fetch employee businesses: ${beError.message}`);
    }

    if (!businessEmployees || businessEmployees.length === 0) {
      return { schedules: [], businesses: [] };
    }

    const businesses = businessEmployees.map(be => ({
      business_id: be.businesses?.business_id,
      name: be.businesses?.name
    }));

    const businessIds = businesses.map(b => b.business_id);
    
    // Get posted schedules for this week across all businesses
    const { data: weeklySchedules, error: wsError } = await supabase
      .from('weekly_schedules')
      .select(`
        *,
        businesses!inner(
          name
        )
      `)
      .in('business_id', businessIds)
      .eq('week_start_date', weekStart)
      .eq('status', 'posted') as any; // Only show posted schedules to employees
      
    if (wsError) {
      throw new Error(`Failed to fetch weekly schedules: ${wsError.message}`);
    }

    // Get confirmed hours for all businesses this week (for total hours calculation)
    const { data: confirmedHoursRecords } = await supabase
      .from('employee_confirmed_hours')
      .select('business_id, total_hours')
      .eq('employee_id', employee.id)
      .in('business_id', businessIds)
      .eq('week_start_date', weekStart);

    // Create lookup for confirmed hours by business
    const confirmedHoursByBusiness = (confirmedHoursRecords || []).reduce((acc, record) => {
      acc[record.business_id] = record.total_hours;
      return acc;
    }, {} as Record<string, number>);

    // Get shifts for each schedule and use confirmed hours as source of truth
    const schedulesWithShifts = await Promise.all(
      (weeklySchedules || []).map(async (schedule) => {
        const shifts = await this.getEmployeeScheduleShifts(schedule.id, employee.id);
        const employees = [{ 
          id: employee.id, 
          full_name: 'You', // Simple display for employee view
          employee_gid: '' 
        }];
        
        // PRIORITY: Use confirmed hours if available, otherwise calculate from shifts
        const confirmedHours = confirmedHoursByBusiness[schedule.business_id];
        const calculatedHours = this.calculateTotalHours(shifts);
        const totalHours = confirmedHours !== undefined ? confirmedHours : calculatedHours;
        
        if (confirmedHours !== undefined) {
          console.log(`📊 Using confirmed hours for ${schedule.business_name}: ${confirmedHours}h (calculated: ${calculatedHours}h)`);
        }
        
        const scheduleWithDetails = {
          ...schedule,
          business_name: schedule.businesses?.name,
          shifts,
          employees,
          total_hours_by_employee: { [employee.id]: totalHours },
        };
        
        // DEBUG: Log to verify posted_at is included
        console.log('🔍 BACKEND DEBUG: Schedule object:', {
          id: scheduleWithDetails.id,
          business_name: scheduleWithDetails.business_name,
          posted_at: scheduleWithDetails.posted_at,
          status: scheduleWithDetails.status,
        });
        
        return scheduleWithDetails;
      })
    );

    console.log('🔍 BACKEND DEBUG: Final response schedules count:', schedulesWithShifts.length);
    if (schedulesWithShifts.length > 0) {
      console.log('🔍 BACKEND DEBUG: First schedule posted_at:', schedulesWithShifts[0].posted_at);
    }

    return {
      schedules: schedulesWithShifts,
      businesses
    };
  }

  private async getEmployeeScheduleShifts(scheduleId: string, employeeId: string): Promise<Shift[]> {
    const supabase = this.supabaseService.admin;
    
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('schedule_id', scheduleId)
      .eq('employee_id', employeeId) // Only shifts for this employee
      .order('day_of_week')
      .order('start_time');

    if (error) {
      throw new Error(`Failed to fetch employee shifts: ${error.message}`);
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

  private calculateTotalHours(shifts: Shift[]): number {
    return shifts.reduce((total, shift) => total + shift.duration_hours, 0);
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
   * Check for overlapping shifts and provide clear error messages
   * Prevents creating shifts that overlap with existing shifts for the same employee
   */
  private async checkForOverlappingShifts(
    scheduleId: string, 
    employeeId: string, 
    dayOfWeek: number, 
    startMin: number, 
    endMin: number,
    startLabel: string,
    endLabel: string
  ): Promise<void> {
    const supabase = this.supabaseService.admin;
    
    // Get ALL existing shifts for this employee on this day
    const { data: existingShifts, error } = await supabase
      .from('shifts')
      .select(`
        id,
        start_min,
        end_min,
        start_label,
        end_label,
        shift_template_id,
        shift_templates(name)
      `)
      .eq('schedule_id', scheduleId)
      .eq('employee_id', employeeId)
      .eq('day_of_week', dayOfWeek);

    if (error) {
      throw new Error(`Failed to check for overlapping shifts: ${error.message}`);
    }

    // Check each existing shift for overlap
    for (const existingShift of existingShifts || []) {
      const existingStart = existingShift.start_min;
      const existingEnd = existingShift.end_min;
      
      // Normalize overnight shifts for comparison (when end < start, it crosses midnight)
      const newStart = startMin;
      const newEnd = endMin < startMin ? endMin + 1440 : endMin;
      const normalizedExistingEnd = existingEnd < existingStart ? existingEnd + 1440 : existingEnd;
      
      // Core overlap detection: newStart < existingEnd && newEnd > existingStart
      const hasOverlap = newStart < normalizedExistingEnd && newEnd > existingStart;
      
      if (hasOverlap) {
        // Overlap found - create helpful error message
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[dayOfWeek];
        const templateName = (existingShift.shift_templates as any)?.name || 'Custom';
        
        throw new BadRequestException(
          `Shift overlap detected: Employee already has a ${templateName} shift (${existingShift.start_label} - ${existingShift.end_label}) on ${dayName} that overlaps with the new shift (${startLabel} - ${endLabel}). ` +
          `Please choose different times or remove the existing shift first.`
        );
      }
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

  // =====================================================
  // EMPLOYEE CONFIRMED HOURS METHODS
  // =====================================================

  async getEmployeeWeeklyHours(
    businessId: string, 
    weekStart: string, 
    userId: string
  ): Promise<WeeklyHoursWithScheduleDto> {
    const supabase = this.supabaseService.admin;
    
    // Get employee record
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (empError || !employee) {
      throw new NotFoundException('Employee profile not found');
    }

    // Get business details
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('business_id, name')
      .eq('business_id', businessId)
      .single();
      
    if (bizError || !business) {
      throw new NotFoundException('Business not found');
    }

    // Check if employee works for this business
    const { data: businessEmployee, error: beError } = await supabase
      .from('business_employees')
      .select('id')
      .eq('business_id', businessId)
      .eq('employee_id', employee.id)
      .single();
      
    if (beError || !businessEmployee) {
      throw new BadRequestException('Employee is not associated with this business');
    }

    // Get confirmed hours if they exist
    let { data: confirmedHours } = await supabase
      .from('employee_confirmed_hours')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('business_id', businessId)
      .eq('week_start_date', weekStart)
      .single();

    // Get scheduled hours using database function
    const { data: scheduledHoursResult, error: schedError } = await supabase
      .rpc('get_scheduled_hours_for_week', {
        p_employee_id: employee.id,
        p_business_id: businessId,
        p_week_start: weekStart
      });

    if (schedError) {
      throw new BadRequestException(`Failed to get scheduled hours: ${schedError.message}`);
    }

    const scheduledHours = scheduledHoursResult || {
      sunday_hours: 0, monday_hours: 0, tuesday_hours: 0, 
      wednesday_hours: 0, thursday_hours: 0, friday_hours: 0, saturday_hours: 0
    };

    // Calculate total scheduled hours
    const totalScheduledHours = Object.values(scheduledHours as Record<string, number>)
      .reduce((sum, hours) => sum + hours, 0);

    // AUTO-CREATE CONFIRMED HOURS: If no confirmed hours exist and there are scheduled hours,
    // automatically create a draft confirmed hours record prefilled with scheduled hours
    if (!confirmedHours && totalScheduledHours > 0) {
      console.log(`🔧 Auto-creating confirmed hours for employee ${employee.id}, week ${weekStart}, scheduled hours: ${totalScheduledHours}h`);
      
      const { data: newConfirmedHours, error: createError } = await supabase
        .from('employee_confirmed_hours')
        .insert({
          employee_id: employee.id,
          business_id: businessId,
          week_start_date: weekStart,
          sunday_hours: scheduledHours.sunday_hours || 0,
          monday_hours: scheduledHours.monday_hours || 0,
          tuesday_hours: scheduledHours.tuesday_hours || 0,
          wednesday_hours: scheduledHours.wednesday_hours || 0,
          thursday_hours: scheduledHours.thursday_hours || 0,
          friday_hours: scheduledHours.friday_hours || 0,
          saturday_hours: scheduledHours.saturday_hours || 0,
          status: 'draft',
          notes: 'Auto-generated from scheduled hours'
        })
        .select()
        .single();

      if (!createError && newConfirmedHours) {
        confirmedHours = newConfirmedHours;
        console.log(`✅ Successfully auto-created confirmed hours with ID: ${confirmedHours.id}`);
      } else {
        console.warn(`⚠️ Failed to auto-create confirmed hours: ${createError?.message}`);
      }
    }

    return {
      confirmed_hours: confirmedHours || undefined,
      scheduled_hours: {
        ...scheduledHours,
        total_hours: totalScheduledHours
      },
      business: {
        business_id: business.business_id,
        name: business.name
      }
    };
  }

  async createConfirmedHours(
    dto: CreateConfirmedHoursDto, 
    userId: string
  ): Promise<ConfirmedHoursResponseDto> {
    const supabase = this.supabaseService.admin;
    
    // Get employee record
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (empError || !employee) {
      throw new NotFoundException('Employee profile not found');
    }

    // Check business association
    const { data: businessEmployee, error: beError } = await supabase
      .from('business_employees')
      .select('id')
      .eq('business_id', dto.business_id)
      .eq('employee_id', employee.id)
      .single();
      
    if (beError || !businessEmployee) {
      throw new BadRequestException('Employee is not associated with this business');
    }

    // Create confirmed hours record
    const { data: confirmedHours, error } = await supabase
      .from('employee_confirmed_hours')
      .insert({
        employee_id: employee.id,
        business_id: dto.business_id,
        week_start_date: dto.week_start_date,
        sunday_hours: dto.sunday_hours || 0,
        monday_hours: dto.monday_hours || 0,
        tuesday_hours: dto.tuesday_hours || 0,
        wednesday_hours: dto.wednesday_hours || 0,
        thursday_hours: dto.thursday_hours || 0,
        friday_hours: dto.friday_hours || 0,
        saturday_hours: dto.saturday_hours || 0,
        notes: dto.notes
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create confirmed hours: ${error.message}`);
    }

    return confirmedHours;
  }

  async updateConfirmedHours(
    id: string, 
    dto: UpdateConfirmedHoursDto, 
    userId: string
  ): Promise<ConfirmedHoursResponseDto> {
    const supabase = this.supabaseService.admin;
    
    // Get employee record
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (empError || !employee) {
      throw new NotFoundException('Employee profile not found');
    }

    // Update only if owned by employee and in draft OR rejected status
    const updateData: any = {};
    if (dto.sunday_hours !== undefined) updateData.sunday_hours = dto.sunday_hours;
    if (dto.monday_hours !== undefined) updateData.monday_hours = dto.monday_hours;
    if (dto.tuesday_hours !== undefined) updateData.tuesday_hours = dto.tuesday_hours;
    if (dto.wednesday_hours !== undefined) updateData.wednesday_hours = dto.wednesday_hours;
    if (dto.thursday_hours !== undefined) updateData.thursday_hours = dto.thursday_hours;
    if (dto.friday_hours !== undefined) updateData.friday_hours = dto.friday_hours;
    if (dto.saturday_hours !== undefined) updateData.saturday_hours = dto.saturday_hours;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    // Clear rejection fields when updating rejected hours
    const { data: currentRecord, error: fetchError } = await supabase
      .from('employee_confirmed_hours')
      .select('status')
      .eq('id', id)
      .eq('employee_id', employee.id)
      .single();

    if (fetchError || !currentRecord) {
      throw new NotFoundException('Confirmed hours record not found');
    }

    // If updating rejected hours, clear rejection fields and set status to draft
    if (currentRecord.status === 'rejected') {
      updateData.status = 'draft';
      updateData.rejection_reason = null;
      updateData.rejected_at = null;
      updateData.rejected_by = null;
    }

    // Use atomic RPC function to prevent check_rejected_fields constraint violation
    try {
      const { data: rpcResults, error: rpcError } = await supabase.rpc('update_confirmed_hours_atomic', {
        p_id: id,
        p_employee_id: employee.id,
        p_update_data: updateData,
        p_allowed_statuses: ['draft', 'rejected']
      });

      if (rpcError) {
        throw rpcError;
      }

      // RPC returns array, get first result
      const confirmedHours = rpcResults && rpcResults.length > 0 ? rpcResults[0] : null;
      if (!confirmedHours) {
        throw new NotFoundException('Confirmed hours record not found or not editable');
      }

      return confirmedHours;
    } catch (rpcError) {
      // Fallback to direct update if RPC function fails
      console.warn('RPC update failed, falling back to direct update:', rpcError.message);
      
      const { data: confirmedHours, error } = await supabase
        .from('employee_confirmed_hours')
        .update(updateData)
        .eq('id', id)
        .eq('employee_id', employee.id)
        .in('status', ['draft', 'rejected']) // Can update draft or rejected hours
        .select()
        .single();

      if (error) {
        throw new BadRequestException(`Failed to update confirmed hours: ${error.message}`);
      }

      if (!confirmedHours) {
        throw new NotFoundException('Confirmed hours record not found or not editable');
      }

      return confirmedHours;
    }
  }

  async submitConfirmedHours(
    id: string, 
    dto: SubmitHoursDto, 
    userId: string
  ): Promise<ConfirmedHoursResponseDto> {
    const supabase = this.supabaseService.admin;
    
    // Get employee record
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (empError || !employee) {
      throw new NotFoundException('Employee profile not found');
    }

    // Get current record to check if it's rejected
    const { data: currentRecord, error: fetchError } = await supabase
      .from('employee_confirmed_hours')
      .select('status')
      .eq('id', id)
      .eq('employee_id', employee.id)
      .single();

    if (fetchError || !currentRecord) {
      throw new NotFoundException('Confirmed hours record not found');
    }

    // Submit hours (change status to submitted)
    const updateData: any = { status: 'submitted' };
    if (dto.notes) updateData.notes = dto.notes;

    // If resubmitting rejected hours, clear rejection fields
    if (currentRecord.status === 'rejected') {
      updateData.rejection_reason = null;
      updateData.rejected_at = null;
      updateData.rejected_by = null;
    }

    const { data: confirmedHours, error } = await supabase
      .from('employee_confirmed_hours')
      .update(updateData)
      .eq('id', id)
      .eq('employee_id', employee.id)
      .in('status', ['draft', 'rejected']) // Can submit draft or rejected hours
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to submit confirmed hours: ${error.message}`);
    }

    if (!confirmedHours) {
      throw new NotFoundException('Confirmed hours record not found or already submitted');
    }

    return confirmedHours;
  }

  async approveConfirmedHours(
    id: string, 
    dto: ApproveHoursDto, 
    userId: string
  ): Promise<ConfirmedHoursResponseDto> {
    const supabase = this.supabaseService.admin;
    
    // Update hours (change status to approved) - RLS policy handles employer check
    const updateData: any = { 
      status: 'approved',
      approved_by: userId
    };
    if (dto.notes) updateData.notes = dto.notes;

    const { data: confirmedHours, error } = await supabase
      .from('employee_confirmed_hours')
      .update(updateData)
      .eq('id', id)
      .eq('status', 'submitted')
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to approve confirmed hours: ${error.message}`);
    }

    if (!confirmedHours) {
      throw new NotFoundException('Confirmed hours record not found or not in submitted status');
    }

    return confirmedHours;
  }

  async rejectConfirmedHours(
    id: string, 
    dto: RejectHoursDto, 
    userId: string
  ): Promise<ConfirmedHoursResponseDto> {
    const supabase = this.supabaseService.admin;
    
    // Update hours (change status to rejected) - RLS policy handles employer check
    const updateData: any = { 
      status: 'rejected',
      rejected_by: userId,
      rejection_reason: dto.rejection_reason
    };
    if (dto.notes) updateData.notes = dto.notes;

    const { data: confirmedHours, error } = await supabase
      .from('employee_confirmed_hours')
      .update(updateData)
      .eq('id', id)
      .eq('status', 'submitted')
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to reject confirmed hours: ${error.message}`);
    }

    if (!confirmedHours) {
      throw new NotFoundException('Confirmed hours record not found or not in submitted status');
    }

    return confirmedHours;
  }

  async getEmployeeConfirmedHoursList(
    userId: string,
    businessId?: string
  ): Promise<ConfirmedHoursResponseDto[]> {
    const supabase = this.supabaseService.admin;
    
    // Get employee record
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (empError || !employee) {
      throw new NotFoundException('Employee profile not found');
    }

    let query = supabase
      .from('employee_confirmed_hours')
      .select('*')
      .eq('employee_id', employee.id)
      .order('week_start_date', { ascending: false });

    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { data: confirmedHoursList, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to get confirmed hours list: ${error.message}`);
    }

    return confirmedHoursList || [];
  }

  async getEmployerConfirmedHoursList(
    businessId: string,
    userId: string,
    status?: 'submitted' | 'approved'
  ): Promise<ConfirmedHoursResponseDto[]> {
    const supabase = this.supabaseService.admin;
    
    // Verify business ownership - this will be handled by RLS policy
    let query = supabase
      .from('employee_confirmed_hours')
      .select(`
        *,
        employees!inner(full_name, employee_gid)
      `)
      .eq('business_id', businessId)
      .order('week_start_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.in('status', ['submitted', 'approved']);
    }

    const { data: confirmedHoursList, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to get confirmed hours for business: ${error.message}`);
    }

    return confirmedHoursList || [];
  }

  // =====================================================
  // COPY PREVIOUS WEEK SCHEDULE
  // =====================================================

  async copyPreviousWeekSchedule(
    businessId: string, 
    targetWeekStart: string, 
    userId: string
  ): Promise<WeeklySchedule> {
    const supabase = this.supabaseService.admin;
    
    // Calculate previous week (subtract 7 days)
    const targetDate = new Date(targetWeekStart + 'T00:00:00');
    const previousWeekDate = new Date(targetDate);
    previousWeekDate.setDate(targetDate.getDate() - 7);
    const previousWeekStart = previousWeekDate.toISOString().split('T')[0];
    
    // Find previous week's posted schedule
    const { data: previousSchedule, error: prevError } = await supabase
      .from('weekly_schedules')
      .select('id')
      .eq('business_id', businessId)
      .eq('week_start_date', previousWeekStart)
      .eq('status', 'posted')
      .single();
      
    if (prevError || !previousSchedule) {
      throw new NotFoundException('No posted schedule found for previous week');
    }
    
    // Get all shifts from previous week
    const { data: previousShifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('employee_id, day_of_week, start_label, end_label, start_min, end_min, shift_template_id, notes')
      .eq('schedule_id', previousSchedule.id);
      
    if (shiftsError) {
      throw new Error(`Failed to fetch previous week shifts: ${shiftsError.message}`);
    }
    
    if (!previousShifts || previousShifts.length === 0) {
      throw new BadRequestException('Previous week has no shifts to copy');
    }
    
    // Create or get target schedule
    let targetSchedule = await this.getWeeklySchedule(businessId, targetWeekStart);
    if (!targetSchedule) {
      targetSchedule = await this.createWeeklySchedule(
        { business_id: businessId, week_start_date: targetWeekStart }, 
        userId
      );
    }
    
    // Copy shifts with same day-of-week logic
    const copyPromises = previousShifts.map(shift => 
      this.createShift(targetSchedule.id, {
        employee_id: shift.employee_id,
        day_of_week: shift.day_of_week,
        start_label: shift.start_label,
        end_label: shift.end_label,
        shift_template_id: shift.shift_template_id,
        notes: shift.notes
      }).catch(error => {
        // Log individual shift copy failures but don't stop the whole process
        console.warn(`Failed to copy shift for employee ${shift.employee_id}:`, error.message);
        return null;
      })
    );
    
    const results = await Promise.all(copyPromises);
    const successCount = results.filter(r => r !== null).length;
    
    if (successCount === 0) {
      throw new BadRequestException('Failed to copy any shifts from previous week');
    }
    
    // Return updated schedule
    return this.getWeeklySchedule(businessId, targetWeekStart);
  }
}
