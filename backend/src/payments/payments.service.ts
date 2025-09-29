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

      // FIXED: Use overlapping range logic instead of strict containment
      // Include payment periods that have ANY overlap with the requested date range
      // This ensures cross-month weeks appear in reports for both months they span
      if (startDate) {
        // Payment period must end after (or on) the report start date
        query = query.gte('period_end', startDate);
      }
      
      if (endDate) {
        // Payment period must start before (or on) the report end date  
        query = query.lte('period_start', endDate);
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

  async getPaymentReports(
    businessId: string,
    startDate: string,
    endDate: string
  ): Promise<PayrollReport> {
    try {
      // Single source of truth: Always use payment records with status = 'paid'
      const paymentRecords = await this.getPaymentRecords(businessId, startDate, endDate);
      
      let totalHours = 0;

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

      // No need to get rates since we use actual payment record amounts

      // Build employee stats from actual payment records (not theoretical calculations)
      const employeeStats = new Map();
      let totalPaid = 0;

      // Process paid payment records with MONTHLY ALLOCATION
      for (const record of paymentRecords.filter(r => r.status === 'paid')) {
        const employeeId = record.employee_id;
        const employeeName = employeeMap.get(employeeId) || 'Unknown';

        // Calculate monthly allocation for this payment period
        const monthlyAllocation = await this.calculateMonthlyAllocation(
          businessId, 
          employeeId, 
          record.period_start, 
          record.period_end, 
          record.hourly_rate,
          startDate, 
          endDate
        );

        // Only include if there are allocated hours/pay for this period
        if (monthlyAllocation.hours > 0) {
          if (!employeeStats.has(employeeId)) {
            employeeStats.set(employeeId, {
              employee_id: employeeId,
              employee_name: employeeName,
              total_hours: 0,
              gross_pay: 0,
              net_pay: 0,
              payment_count: 0,
            });
          }

          const employee = employeeStats.get(employeeId);
          employee.total_hours += monthlyAllocation.hours;
          employee.gross_pay += monthlyAllocation.amount;
          employee.net_pay += monthlyAllocation.amount;
          employee.payment_count += 1;
          
          totalPaid += monthlyAllocation.amount;
          totalHours += monthlyAllocation.hours;
        }
      }

      // Create timeline data from paid payment records with MONTHLY ALLOCATION
      const timelineMap = new Map();
      for (const record of paymentRecords.filter(r => r.status === 'paid' && r.paid_at)) {
        // Calculate allocation for this payment
        const monthlyAllocation = await this.calculateMonthlyAllocation(
          businessId, 
          record.employee_id, 
          record.period_start, 
          record.period_end, 
          record.hourly_rate,
          startDate, 
          endDate
        );
        
        if (monthlyAllocation.amount > 0) {
          const date = record.paid_at!.split('T')[0]; // Extract date part
          timelineMap.set(date, (timelineMap.get(date) || 0) + monthlyAllocation.amount);
        }
      }

      const timelineData = Array.from(timelineMap.entries()).map(([date, amount]) => ({
        date,
        amount,
      })).sort((a, b) => a.date.localeCompare(b.date));

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

  // =====================================================
  // DETAILED MONTHLY EMPLOYEE BREAKDOWN
  // =====================================================

  async getEmployeeMonthlyBreakdown(
    businessId: string,
    startDate: string,
    endDate: string
  ) {
    try {
      // Get all payment records for the business within the date range
      // FIXED: Use overlapping range logic to include cross-month payments
      const { data: paymentRecords, error } = await this.supabaseService.admin
        .from('payment_records')
        .select(`
          *,
          employees!inner(
            id,
            full_name
          )
        `)
        .eq('business_id', businessId)
        .gte('period_end', startDate)
        .lte('period_start', endDate)
        .order('period_start', { ascending: true });

      if (error) {
        throw new BadRequestException(`Failed to fetch payment records: ${error.message}`);
      }

      // Group records by employee
      const employeeBreakdown = new Map();
      let totalPaid = 0;
      let totalHours = 0;

      for (const record of paymentRecords || []) {
        const employeeId = record.employee_id;
        const employeeName = record.employees?.full_name || 'Unknown Employee';

        if (!employeeBreakdown.has(employeeId)) {
          employeeBreakdown.set(employeeId, {
            employee_id: employeeId,
            employee_name: employeeName,
            total_hours: 0,
            gross_pay: 0,
            total_advances: 0,
            total_bonuses: 0,
            total_deductions: 0,
            net_pay: 0,
            final_amount_paid: 0,
            payment_records: []
          });
        }

        const employee = employeeBreakdown.get(employeeId);
        
        // Calculate monthly allocation for this payment period
        const monthlyAllocation = await this.calculateMonthlyAllocation(
          businessId, 
          record.employee_id, 
          record.period_start, 
          record.period_end, 
          record.hourly_rate,
          startDate, 
          endDate
        );
        
        // Use allocated amounts instead of full payment amounts
        employee.total_hours += monthlyAllocation.hours;
        employee.gross_pay += monthlyAllocation.amount;
        employee.total_advances += (record.advances || 0) * (monthlyAllocation.hours / (record.total_hours || 1));
        employee.total_bonuses += (record.bonuses || 0) * (monthlyAllocation.hours / (record.total_hours || 1));
        employee.total_deductions += (record.deductions || 0) * (monthlyAllocation.hours / (record.total_hours || 1));
        employee.net_pay += monthlyAllocation.amount;
        
        // Only count paid records towards final amount paid
        if (record.status === 'paid') {
          employee.final_amount_paid += monthlyAllocation.amount;
          totalPaid += monthlyAllocation.amount;
        }
        
        totalHours += monthlyAllocation.hours;

        // Only add payment record if there are allocated hours for this period
        if (monthlyAllocation.hours > 0) {
          employee.payment_records.push({
            id: record.id,
            period_start: record.period_start,
            period_end: record.period_end,
            total_hours: monthlyAllocation.hours, // Show allocated hours only
            hourly_rate: record.hourly_rate || 0,
            gross_pay: monthlyAllocation.amount, // Show allocated amount only
            advances: (record.advances || 0) * (monthlyAllocation.hours / (record.total_hours || 1)),
            bonuses: (record.bonuses || 0) * (monthlyAllocation.hours / (record.total_hours || 1)),
            deductions: (record.deductions || 0) * (monthlyAllocation.hours / (record.total_hours || 1)),
            net_pay: monthlyAllocation.amount, // Show allocated amount only
            status: record.status,
            payment_method: record.payment_method,
            notes: record.notes,
            paid_at: record.paid_at,
            is_partial_allocation: monthlyAllocation.hours < (record.total_hours || 0)
          });
        }
      }

      // Apply consistent precision to all values
      const employees = Array.from(employeeBreakdown.values()).map(emp => ({
        ...emp,
        total_hours: Math.round(emp.total_hours * 100) / 100,
        gross_pay: Math.round(emp.gross_pay * 100) / 100,
        total_advances: Math.round(emp.total_advances * 100) / 100,
        total_bonuses: Math.round(emp.total_bonuses * 100) / 100,
        total_deductions: Math.round(emp.total_deductions * 100) / 100,
        net_pay: Math.round(emp.net_pay * 100) / 100,
        final_amount_paid: Math.round(emp.final_amount_paid * 100) / 100
      }));

      return {
        business_id: businessId,
        period_start: startDate,
        period_end: endDate,
        total_paid: Math.round(totalPaid * 100) / 100,
        total_hours: Math.round(totalHours * 100) / 100,
        employee_count: employees.length,
        employees
      };

    } catch (error) {
      throw new BadRequestException(`Failed to generate employee breakdown: ${error.message}`);
    }
  }

  /**
   * Calculate the portion of a cross-month payment that belongs to a specific reporting period
   * Uses daily hour breakdown to accurately allocate payments across months
   */
  private async calculateMonthlyAllocation(
    businessId: string,
    employeeId: string,
    paymentPeriodStart: string,
    paymentPeriodEnd: string,
    hourlyRate: number,
    reportStart: string,
    reportEnd: string
  ): Promise<{ hours: number; amount: number }> {
    try {
      // Get the daily hour breakdown for this payment period
      const { data: confirmedHours, error } = await this.supabaseService.admin
        .from('employee_confirmed_hours')
        .select('week_start_date, sunday_hours, monday_hours, tuesday_hours, wednesday_hours, thursday_hours, friday_hours, saturday_hours')
        .eq('business_id', businessId)
        .eq('employee_id', employeeId)
        .eq('week_start_date', paymentPeriodStart)
        .eq('status', 'approved')
        .single();

      if (error || !confirmedHours) {
        // Fallback: If no daily breakdown, assume uniform distribution
        console.warn(`No daily hour breakdown found for employee ${employeeId} for week ${paymentPeriodStart}, using uniform distribution`);
        const paymentStartDate = new Date(paymentPeriodStart + 'T00:00:00');
        const paymentEndDate = new Date(paymentPeriodEnd + 'T00:00:00');
        const reportStartDate = new Date(reportStart + 'T00:00:00');
        const reportEndDate = new Date(reportEnd + 'T00:00:00');
        
        const overlapStart = new Date(Math.max(paymentStartDate.getTime(), reportStartDate.getTime()));
        const overlapEnd = new Date(Math.min(paymentEndDate.getTime(), reportEndDate.getTime()));
        
        if (overlapStart <= overlapEnd) {
          const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const totalPaymentDays = Math.ceil((paymentEndDate.getTime() - paymentStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          // Get total hours from payment record (this is a simplified fallback)
          const { data: paymentRecord } = await this.supabaseService.admin
            .from('payment_records')
            .select('total_hours')
            .eq('business_id', businessId)
            .eq('employee_id', employeeId)
            .eq('period_start', paymentPeriodStart)
            .eq('period_end', paymentPeriodEnd)
            .single();
            
          const totalHours = paymentRecord?.total_hours || 0;
          const allocatedHours = Math.round((totalHours * (overlapDays / totalPaymentDays)) * 100) / 100;
          const allocatedAmount = Math.round((allocatedHours * hourlyRate) * 100) / 100;
          
          return { hours: allocatedHours, amount: allocatedAmount };
        }
        
        return { hours: 0, amount: 0 };
      }

      // Calculate which daily hours fall within the reporting period
      const weekStartDate = new Date(confirmedHours.week_start_date + 'T00:00:00');
      const reportStartDate = new Date(reportStart + 'T00:00:00');
      const reportEndDate = new Date(reportEnd + 'T00:00:00');
      
      let allocatedHours = 0;
      
      // Check each day of the week
      const dailyHours = [
        confirmedHours.sunday_hours || 0,    // Day 0: Sunday
        confirmedHours.monday_hours || 0,    // Day 1: Monday  
        confirmedHours.tuesday_hours || 0,   // Day 2: Tuesday
        confirmedHours.wednesday_hours || 0, // Day 3: Wednesday
        confirmedHours.thursday_hours || 0,  // Day 4: Thursday
        confirmedHours.friday_hours || 0,    // Day 5: Friday
        confirmedHours.saturday_hours || 0   // Day 6: Saturday
      ];
      
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDate = new Date(weekStartDate);
        currentDate.setDate(weekStartDate.getDate() + dayOffset);
        
        // Check if this day falls within the reporting period
        if (currentDate >= reportStartDate && currentDate <= reportEndDate) {
          allocatedHours += dailyHours[dayOffset];
        }
      }
      
      const allocatedAmount = Math.round((allocatedHours * hourlyRate) * 100) / 100;
      
      return { 
        hours: Math.round(allocatedHours * 100) / 100, 
        amount: allocatedAmount 
      };
    } catch (error) {
      console.error(`Error calculating monthly allocation: ${error.message}`);
      return { hours: 0, amount: 0 };
    }
  }
}
