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
          hoursByEmployee[employeeId] = (hoursByEmployee[employeeId] || 0) + (record.total_hours || 0);
        });
      }

      // Calculate scheduled hours for employees without confirmed hours
      for (const schedule of schedules || []) {
        const scheduleHours = await this.schedulesService.calculateEmployeeHours(schedule.id);
        
        // Only use calculated hours if no confirmed hours exist for that employee
        Object.entries(scheduleHours).forEach(([employeeId, hours]) => {
          if (!employeesWithConfirmedHours.has(employeeId)) {
            hoursByEmployee[employeeId] = (hoursByEmployee[employeeId] || 0) + hours;
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

      // Get all schedules for calculated hours
      const { data: schedules } = await this.supabaseService.admin
        .from('weekly_schedules')
        .select('id, week_start_date')
        .eq('business_id', businessId)
        .gte('week_start_date', startDate)
        .lte('week_start_date', endDate)
        .eq('status', 'posted');

      // Calculate scheduled hours for all employees
      const calculatedHours: Record<string, number> = {};
      for (const schedule of schedules || []) {
        const scheduleHours = await this.schedulesService.calculateEmployeeHours(schedule.id);
        Object.entries(scheduleHours).forEach(([employeeId, hours]) => {
          calculatedHours[employeeId] = (calculatedHours[employeeId] || 0) + hours;
        });
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

  // =====================================================
  // REPORTING & ANALYTICS
  // =====================================================

  async getPaymentReports(
    businessId: string,
    startDate: string,
    endDate: string
  ): Promise<PayrollReport> {
    try {
      // Get payment records for the period
      const paymentRecords = await this.getPaymentRecords(businessId, startDate, endDate);
      
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

      // Aggregate data by employee
      const employeeStats = new Map();
      let totalPaid = 0;
      let totalHours = 0;

      paymentRecords.forEach(record => {
        if (record.status === 'paid') {
          totalPaid += record.net_pay;
          totalHours += record.total_hours;

          const employeeName = employeeMap.get(record.employee_id) || 'Unknown';
          
          if (!employeeStats.has(record.employee_id)) {
            employeeStats.set(record.employee_id, {
              employee_id: record.employee_id,
              employee_name: employeeName,
              total_hours: 0,
              gross_pay: 0,
              net_pay: 0,
              payment_count: 0,
            });
          }

          const stats = employeeStats.get(record.employee_id);
          stats.total_hours += record.total_hours;
          stats.gross_pay += record.gross_pay;
          stats.net_pay += record.net_pay;
          stats.payment_count += 1;
        }
      });

      // Create timeline data (grouped by date)
      const timelineMap = new Map();
      paymentRecords
        .filter(record => record.status === 'paid' && record.paid_at)
        .forEach(record => {
          const date = record.paid_at!.split('T')[0]; // Extract date part
          timelineMap.set(date, (timelineMap.get(date) || 0) + record.net_pay);
        });

      const timelineData = Array.from(timelineMap.entries()).map(([date, amount]) => ({
        date,
        amount,
      })).sort((a, b) => a.date.localeCompare(b.date));

      return {
        business_id: businessId,
        period_start: startDate,
        period_end: endDate,
        total_paid: totalPaid,
        total_hours: totalHours,
        employee_count: employeeStats.size,
        employees: Array.from(employeeStats.values()),
        timeline_data: timelineData,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to generate payment reports: ${error.message}`);
    }
  }

  async exportPayrollData(
    businessId: string,
    format: 'csv',
    startDate: string,
    endDate: string,
    employeeId?: string
  ): Promise<string> {
    try {
      const paymentRecords = await this.getPaymentRecords(businessId, startDate, endDate, employeeId);
      
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

      // Generate CSV
      const headers = [
        'Employee Name',
        'Employee ID', 
        'Period Start',
        'Period End',
        'Total Hours',
        'Hourly Rate',
        'Gross Pay',
        'Bonuses',
        'Advances',
        'Deductions',
        'Net Pay',
        'Status',
        'Payment Method',
        'Paid Date',
        'Notes'
      ].join(',');

      const rows = paymentRecords.map(record => [
        `"${employeeMap.get(record.employee_id) || 'Unknown'}"`,
        record.employee_id,
        record.period_start,
        record.period_end,
        record.total_hours,
        record.hourly_rate,
        record.gross_pay,
        record.bonuses || 0,
        record.advances || 0,
        record.deductions || 0,
        record.net_pay,
        record.status,
        record.payment_method || '',
        record.paid_at?.split('T')[0] || '',
        `"${record.notes || ''}"`
      ].join(','));

      return [headers, ...rows].join('\n');
    } catch (error) {
      throw new BadRequestException(`Failed to export payroll data: ${error.message}`);
    }
  }
}
