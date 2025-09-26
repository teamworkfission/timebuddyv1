import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { SchedulesService } from '../schedules/schedules.service';
import { SetEmployeeRateDto } from './dto/set-employee-rate.dto';
import { CreatePaymentRecordDto } from './dto/create-payment-record.dto';
import { UpdatePaymentRecordDto, MarkAsPaidDto } from './dto/update-payment-record.dto';

export interface EmployeeRate {
  id: string;
  business_id: string;
  employee_id: string;
  hourly_rate: number;
  effective_from: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  business_id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  hourly_rate: number;
  gross_pay: number;
  advances: number;
  bonuses: number;
  deductions: number;
  net_pay: number;
  status: 'calculated' | 'paid';
  payment_method?: string;
  notes?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentCalculation {
  employee_id: string;
  total_hours: number;
  hourly_rate: number;
  gross_pay: number;
  net_pay: number;
  period_start: string;
  period_end: string;
}

export interface PayrollReport {
  business_id: string;
  period_start: string;
  period_end: string;
  total_paid: number;
  total_hours: number;
  employee_count: number;
  employees: {
    employee_id: string;
    employee_name: string;
    total_hours: number;
    gross_pay: number;
    net_pay: number;
    payment_count: number;
  }[];
  timeline_data?: {
    date: string;
    amount: number;
  }[];
}

@Injectable()
export class PaymentsService {
  constructor(
    private supabaseService: SupabaseService,
    private schedulesService: SchedulesService,
  ) {}

  // =====================================================
  // EMPLOYEE RATES MANAGEMENT
  // =====================================================

  async getCurrentEmployeeRates(businessId: string): Promise<EmployeeRate[]> {
    try {
      const { data, error } = await this.supabaseService.admin
        .from('v_current_employee_rates')
        .select('*')
        .eq('business_id', businessId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new BadRequestException(`Failed to get current employee rates: ${error.message}`);
    }
  }

  async setEmployeeRate(dto: SetEmployeeRateDto): Promise<EmployeeRate> {
    try {
      const { data, error } = await this.supabaseService.admin
        .from('employee_rates')
        .insert(dto)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new ConflictException('Employee rate for this date already exists');
        }
        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new BadRequestException(`Failed to set employee rate: ${error.message}`);
    }
  }

  async updateEmployeeRate(id: string, dto: Partial<SetEmployeeRateDto>): Promise<EmployeeRate> {
    try {
      const { data, error } = await this.supabaseService.admin
        .from('employee_rates')
        .update(dto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Employee rate not found');

      return data;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to update employee rate: ${error.message}`);
    }
  }

  async getRateHistory(businessId: string, employeeId: string): Promise<EmployeeRate[]> {
    try {
      const { data, error } = await this.supabaseService.admin
        .from('employee_rates')
        .select('*')
        .eq('business_id', businessId)
        .eq('employee_id', employeeId)
        .order('effective_from', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new BadRequestException(`Failed to get rate history: ${error.message}`);
    }
  }

  // =====================================================
  // PAYMENT CALCULATIONS & INTEGRATION
  // =====================================================

  async getEmployeeHours(
    businessId: string, 
    startDate: string, 
    endDate: string
  ): Promise<Record<string, number>> {
    try {
      // Get all schedules for the business within the date range
      const { data: schedules, error } = await this.supabaseService.admin
        .from('weekly_schedules')
        .select('id, week_start_date')
        .eq('business_id', businessId)
        .gte('week_start_date', startDate)
        .lte('week_start_date', endDate)
        .eq('status', 'posted'); // Only include posted schedules

      if (error) throw error;
      
      const hoursByEmployee: Record<string, number> = {};

      // First, get confirmed hours for the period (prioritized)
      const { data: confirmedHours, error: confirmedError } = await this.supabaseService.admin
        .from('employee_confirmed_hours')
        .select('employee_id, total_hours')
        .eq('business_id', businessId)
        .gte('week_start_date', startDate)
        .lte('week_start_date', endDate)
        .eq('status', 'approved'); // Only use approved confirmed hours

      if (confirmedError) {
        console.warn('Failed to get confirmed hours, falling back to calculated:', confirmedError.message);
      }

      // Build set of employees with confirmed hours
      const employeesWithConfirmedHours = new Set<string>();
      if (confirmedHours) {
        confirmedHours.forEach(record => {
          const employeeId = record.employee_id;
          employeesWithConfirmedHours.add(employeeId);
          // Apply consistent hours precision (2 decimal places)
          const hours = Math.round((record.total_hours || 0) * 100) / 100;
          hoursByEmployee[employeeId] = Math.round(((hoursByEmployee[employeeId] || 0) + hours) * 100) / 100;
        });
      }

      // Calculate scheduled hours for employees without confirmed hours
      for (const schedule of schedules || []) {
        const scheduleHours = await this.schedulesService.calculateEmployeeHours(schedule.id);
        
        // Only use calculated hours if no confirmed hours exist for that employee
        Object.entries(scheduleHours).forEach(([employeeId, hours]) => {
          if (!employeesWithConfirmedHours.has(employeeId)) {
            // Apply consistent hours precision (2 decimal places)
            const standardizedHours = Math.round(hours * 100) / 100;
            hoursByEmployee[employeeId] = Math.round(((hoursByEmployee[employeeId] || 0) + standardizedHours) * 100) / 100;
          }
        });
      }

      return hoursByEmployee;
    } catch (error) {
      throw new BadRequestException(`Failed to get employee hours: ${error.message}`);
    }
  }

  /**
   * Get detailed hours breakdown showing both confirmed and calculated hours
   * Used by employer to see discrepancies and make decisions
   * 
   * STANDARDIZED: Uses confirmed hours table as primary source for all calculations
   * to ensure consistency between employee (42.5h) and employer (42.5h) views
   */
  async getDetailedEmployeeHours(
    businessId: string, 
    startDate: string, 
    endDate: string
  ): Promise<Record<string, { confirmed: number | null, calculated: number, source: 'confirmed' | 'calculated' }>> {
    try {
      const hoursByEmployee: Record<string, { confirmed: number | null, calculated: number, source: 'confirmed' | 'calculated' }> = {};

      // Get confirmed hours
      const { data: confirmedHours } = await this.supabaseService.admin
        .from('employee_confirmed_hours')
        .select('employee_id, total_hours')
        .eq('business_id', businessId)
        .gte('week_start_date', startDate)
        .lte('week_start_date', endDate)
        .eq('status', 'approved');

      // Get ALL confirmed hours (all statuses) for "calculated" fallback
      const { data: allConfirmedHours } = await this.supabaseService.admin
        .from('employee_confirmed_hours')
        .select('employee_id, total_hours, status')
        .eq('business_id', businessId)
        .gte('week_start_date', startDate)
        .lte('week_start_date', endDate);

      // Use confirmed hours as primary calculation source, fall back to scheduled only if none exist
      const calculatedHours: Record<string, number> = {};
      const employeesWithConfirmedHours = new Set<string>();

      // First, use confirmed hours (any status) for calculation
      allConfirmedHours?.forEach(record => {
        employeesWithConfirmedHours.add(record.employee_id);
        const hours = Math.round((record.total_hours || 0) * 100) / 100;
        calculatedHours[record.employee_id] = Math.round(((calculatedHours[record.employee_id] || 0) + hours) * 100) / 100;
      });

      // Only fall back to scheduled calculation for employees WITHOUT any confirmed hours
      if (employeesWithConfirmedHours.size === 0 || allConfirmedHours?.length === 0) {
        const { data: schedules } = await this.supabaseService.admin
          .from('weekly_schedules')
          .select('id, week_start_date')
          .eq('business_id', businessId)
          .gte('week_start_date', startDate)
          .lte('week_start_date', endDate)
          .eq('status', 'posted');

        for (const schedule of schedules || []) {
          const scheduleHours = await this.schedulesService.calculateEmployeeHours(schedule.id);
          Object.entries(scheduleHours).forEach(([employeeId, hours]) => {
            if (!employeesWithConfirmedHours.has(employeeId)) {
              calculatedHours[employeeId] = (calculatedHours[employeeId] || 0) + hours;
            }
          });
        }
      }

      // Build confirmed hours map
      const confirmedHoursMap: Record<string, number> = {};
      confirmedHours?.forEach(record => {
        confirmedHoursMap[record.employee_id] = (confirmedHoursMap[record.employee_id] || 0) + (record.total_hours || 0);
      });

      // Combine all employees
      const allEmployeeIds = new Set([...Object.keys(calculatedHours), ...Object.keys(confirmedHoursMap)]);
      
      allEmployeeIds.forEach(employeeId => {
        const confirmed = confirmedHoursMap[employeeId] || null;
        const calculated = calculatedHours[employeeId] || 0;
        
        hoursByEmployee[employeeId] = {
          confirmed,
          calculated,
          source: confirmed !== null ? 'confirmed' : 'calculated'
        };
      });

      return hoursByEmployee;
    } catch (error) {
      throw new BadRequestException(`Failed to get detailed employee hours: ${error.message}`);
    }
  }

  async calculatePayForPeriod(
    businessId: string,
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<PaymentCalculation> {
    try {
      // Get employee hours for the period
      const hoursByEmployee = await this.getEmployeeHours(businessId, startDate, endDate);
      const totalHours = hoursByEmployee[employeeId] || 0;

      // Get current rate for employee
      const currentRates = await this.getCurrentEmployeeRates(businessId);
      const employeeRate = currentRates.find(rate => rate.employee_id === employeeId);

      if (!employeeRate) {
        throw new BadRequestException(`No hourly rate found for employee ${employeeId}`);
      }

      const grossPay = totalHours * employeeRate.hourly_rate;

      return {
        employee_id: employeeId,
        total_hours: totalHours,
        hourly_rate: employeeRate.hourly_rate,
        gross_pay: grossPay,
        net_pay: grossPay, // Before adjustments
        period_start: startDate,
        period_end: endDate,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to calculate pay: ${error.message}`);
    }
  }

  // =====================================================
  // PAYMENT RECORDS MANAGEMENT
  // =====================================================

  async createPaymentRecord(dto: CreatePaymentRecordDto): Promise<PaymentRecord> {
    try {
      const { data, error } = await this.supabaseService.admin
        .from('payment_records')
        .insert(dto)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new ConflictException('Payment record already exists for this period');
        }
        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new BadRequestException(`Failed to create payment record: ${error.message}`);
    }
  }

  async updatePaymentRecord(id: string, dto: UpdatePaymentRecordDto): Promise<PaymentRecord> {
    try {
      const { data, error } = await this.supabaseService.admin
        .from('payment_records')
        .update(dto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Payment record not found');

      return data;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to update payment record: ${error.message}`);
    }
  }

  async markAsPaid(id: string, markAsPaidDto: MarkAsPaidDto): Promise<PaymentRecord> {
    try {
      const { data, error } = await this.supabaseService.admin
        .from('payment_records')
        .update({
          status: 'paid',
          payment_method: markAsPaidDto.payment_method,
          notes: markAsPaidDto.notes,
          paid_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new ConflictException('Payment already marked as paid for this period');
        }
        throw error;
      }
      
      if (!data) throw new NotFoundException('Payment record not found');

      return data;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to mark payment as paid: ${error.message}`);
    }
  }

  async getPaymentRecords(
    businessId: string, 
    startDate?: string, 
    endDate?: string,
    employeeId?: string
  ): Promise<PaymentRecord[]> {
    try {
      let query = this.supabaseService.admin
        .from('payment_records')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('period_start', startDate);
      }
      
      if (endDate) {
        query = query.lte('period_end', endDate);
      }

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new BadRequestException(`Failed to get payment records: ${error.message}`);
    }
  }

  async deletePaymentRecord(id: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.admin
        .from('payment_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw new BadRequestException(`Failed to delete payment record: ${error.message}`);
    }
  }

  /**
   * Get employee record by user ID for authentication/authorization
   */
  async getEmployeeByUserId(userId: string): Promise<{ id: string; employee_gid: string } | null> {
    try {
      const { data, error } = await this.supabaseService.admin
        .from('employees')
        .select('id, employee_gid')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No employee found for this user ID
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      throw new BadRequestException(`Failed to get employee record: ${error.message}`);
    }
  }

  // =====================================================
  // REPORTING & ANALYTICS
  // =====================================================

  /**
   * Calculate monthly hours for employees handling weeks that span multiple months
   * Only includes hours that fall within the specified month
   */
  async getMonthlyEmployeeHours(
    businessId: string,
    year: number,
    month: number // 1-12
  ): Promise<Record<string, number>> {
    try {
      // Get the first and last day of the month
      const monthStart = new Date(year, month - 1, 1); // month is 0-indexed in Date constructor
      const monthEnd = new Date(year, month, 0); // 0th day of next month = last day of current month
      
      const monthStartStr = monthStart.toISOString().split('T')[0];
      const monthEndStr = monthEnd.toISOString().split('T')[0];

      // Find all weeks that intersect with this month
      // A week intersects if it starts before or on month end AND ends after or on month start
      const { data: confirmedHours, error } = await this.supabaseService.admin
        .from('employee_confirmed_hours')
        .select(`
          employee_id, 
          week_start_date,
          sunday_hours,
          monday_hours, 
          tuesday_hours,
          wednesday_hours,
          thursday_hours,
          friday_hours,
          saturday_hours
        `)
        .eq('business_id', businessId)
        .eq('status', 'approved')
        .lte('week_start_date', monthEndStr) // Week starts before or on month end
        .gte('week_start_date', new Date(monthStart.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Week starts within 6 days before month start (to catch weeks that end in the month)

      if (error) throw error;

      const monthlyHours: Record<string, number> = {};

      if (confirmedHours) {
        for (const weekRecord of confirmedHours) {
          const weekStart = new Date(weekRecord.week_start_date + 'T00:00:00');
          const dailyHours = [
            weekRecord.sunday_hours || 0,
            weekRecord.monday_hours || 0,
            weekRecord.tuesday_hours || 0,
            weekRecord.wednesday_hours || 0,
            weekRecord.thursday_hours || 0,
            weekRecord.friday_hours || 0,
            weekRecord.saturday_hours || 0
          ];

          let monthlyHoursForWeek = 0;

          // Check each day of the week to see if it falls within the target month
          for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + dayIndex);
            
            // Check if this day is within the target month
            if (currentDay >= monthStart && currentDay <= monthEnd) {
              monthlyHoursForWeek += dailyHours[dayIndex];
            }
          }

          if (monthlyHoursForWeek > 0) {
            const employeeId = weekRecord.employee_id;
            monthlyHours[employeeId] = Math.round(((monthlyHours[employeeId] || 0) + monthlyHoursForWeek) * 100) / 100;
          }
        }
      }

      return monthlyHours;
    } catch (error) {
      throw new BadRequestException(`Failed to calculate monthly employee hours: ${error.message}`);
    }
  }

  async getPaymentReports(
    businessId: string,
    startDate: string,
    endDate: string
  ): Promise<PayrollReport> {
    try {
      // Check if this is a full month request
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      const isFullMonth = start.getDate() === 1 && end.getMonth() === start.getMonth() && 
                         end.getDate() === new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();

      let employeeHoursData: Record<string, number> = {};
      let totalHours = 0;

      if (isFullMonth) {
        // Use monthly calculation for full month requests
        employeeHoursData = await this.getMonthlyEmployeeHours(
          businessId,
          start.getFullYear(),
          start.getMonth() + 1 // Convert to 1-12 range
        );
        totalHours = Object.values(employeeHoursData).reduce((sum, hours) => sum + hours, 0);
      } else {
        // Fall back to payment records for custom date ranges
        const paymentRecords = await this.getPaymentRecords(businessId, startDate, endDate);
        paymentRecords.forEach(record => {
          if (record.status === 'paid') {
            const hours = Math.round(record.total_hours * 100) / 100;
            employeeHoursData[record.employee_id] = (employeeHoursData[record.employee_id] || 0) + hours;
            totalHours += hours;
          }
        });
      }

      // Get employee details
      const { data: employees, error } = await this.supabaseService.admin
        .from('business_employees')
        .select(`
          employee_id,
          employees (
            id,
            full_name
          )
        `)
        .eq('business_id', businessId);

      if (error) throw error;

      const employeeMap = new Map();
      employees?.forEach((emp: any) => {
        const employeeName = emp.employees?.full_name || 'Unknown Employee';
        employeeMap.set(emp.employee_id, employeeName);
      });

      // Get employee rates for pay calculation
      const currentRates = await this.getCurrentEmployeeRates(businessId);
      const rateMap = new Map();
      currentRates.forEach(rate => {
        rateMap.set(rate.employee_id, rate.hourly_rate);
      });

      // Build employee stats from hours data
      const employeeStats = new Map();
      let totalPaid = 0;

      Object.entries(employeeHoursData).forEach(([employeeId, hours]) => {
        const employeeName = employeeMap.get(employeeId) || 'Unknown';
        const hourlyRate = rateMap.get(employeeId) || 0;
        const grossPay = hours * hourlyRate;
        const netPay = grossPay; // Simplified for now

        totalPaid += netPay;

        employeeStats.set(employeeId, {
          employee_id: employeeId,
          employee_name: employeeName,
          total_hours: hours,
          gross_pay: grossPay,
          net_pay: netPay,
          payment_count: 1, // Simplified for monthly view
        });
      });

      // Create timeline data - only available for payment record based reports
      let timelineData: { date: string; amount: number }[] = [];
      if (!isFullMonth) {
        const paymentRecords = await this.getPaymentRecords(businessId, startDate, endDate);
        const timelineMap = new Map();
        paymentRecords
          .filter(record => record.status === 'paid' && record.paid_at)
          .forEach(record => {
            const date = record.paid_at!.split('T')[0]; // Extract date part
            timelineMap.set(date, (timelineMap.get(date) || 0) + record.net_pay);
          });

        timelineData = Array.from(timelineMap.entries()).map(([date, amount]) => ({
          date,
          amount,
        })).sort((a, b) => a.date.localeCompare(b.date));
      }

      return {
        business_id: businessId,
        period_start: startDate,
        period_end: endDate,
        total_paid: Math.round(totalPaid * 100) / 100,
        // Ensure consistent hours precision for the total
        total_hours: Math.round(totalHours * 100) / 100,
        employee_count: employeeStats.size,
        // Apply consistent precision to all employee hours
        employees: Array.from(employeeStats.values()).map(emp => ({
          ...emp,
          total_hours: Math.round(emp.total_hours * 100) / 100,
          gross_pay: Math.round(emp.gross_pay * 100) / 100,
          net_pay: Math.round(emp.net_pay * 100) / 100
        })),
        timeline_data: timelineData,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to generate payment reports: ${error.message}`);
    }
  }

}
