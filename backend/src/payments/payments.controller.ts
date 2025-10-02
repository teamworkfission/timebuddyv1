import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query,
  Request,
  BadRequestException,
  Header,
  UnauthorizedException
} from '@nestjs/common';
import { PaymentsService, PaymentCalculation } from './payments.service';
import { AuthService } from '../auth/auth.service';
import { SetEmployeeRateDto } from './dto/set-employee-rate.dto';
import { CreatePaymentRecordDto } from './dto/create-payment-record.dto';
import { UpdatePaymentRecordDto, MarkAsPaidDto } from './dto/update-payment-record.dto';
import { PaymentReportDto } from './dto/payment-report.dto';
import { MonthlyBreakdownReport } from './dto/employee-breakdown.dto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly authService: AuthService,
  ) {}

  private async getEmployerIdFromRequest(request: any): Promise<string> {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    try {
      const user = await this.authService.verifyToken(authHeader);
      if (!user || user.role !== 'employer') {
        throw new UnauthorizedException('Invalid token or insufficient permissions');
      }
      return user.id;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // =====================================================
  // EMPLOYEE RATES MANAGEMENT
  // =====================================================

  @Get('rates/:businessId')
  async getCurrentRates(
    @Param('businessId') businessId: string,
    @Request() req
  ) {
    await this.getEmployerIdFromRequest(req);
    return this.paymentsService.getCurrentEmployeeRates(businessId);
  }

  @Post('rates')
  async setEmployeeRate(
    @Body() setEmployeeRateDto: SetEmployeeRateDto,
    @Request() req
  ) {
    await this.getEmployerIdFromRequest(req);
    return this.paymentsService.setEmployeeRate(setEmployeeRateDto);
  }

  @Put('rates/:id')
  async updateEmployeeRate(
    @Param('id') id: string,
    @Body() updateDto: Partial<SetEmployeeRateDto>,
    @Request() req
  ) {
    return this.paymentsService.updateEmployeeRate(id, updateDto);
  }

  @Get('rates/:businessId/history/:employeeId')
  async getRateHistory(
    @Param('businessId') businessId: string,
    @Param('employeeId') employeeId: string,
    @Request() req
  ) {
    return this.paymentsService.getRateHistory(businessId, employeeId);
  }

  // =====================================================
  // PAYMENT RECORDS MANAGEMENT
  // =====================================================

  @Get('records/:businessId')
  async getPaymentRecords(
    @Param('businessId') businessId: string,
    @Request() req,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('employee_id') employeeId?: string,
  ) {
    // Get authenticated user info
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header required');
    }

    const userInfo = await this.authService.verifyToken(authHeader);
    if (!userInfo) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    // Check if user is an employee - employees can only see their own payment records
    if (userInfo.role === 'employee') {
      // Get the employee record for this user
      const employeeRecord = await this.paymentsService.getEmployeeByUserId(userInfo.userId);
      if (!employeeRecord) {
        throw new UnauthorizedException('Employee record not found');
      }

      // Force employee_id to be the authenticated user's employee ID
      // Prevent employees from seeing other employees' payment data
      const enforceEmployeeId = employeeRecord.id;
      
      return this.paymentsService.getPaymentRecords(businessId, startDate, endDate, enforceEmployeeId);
    }

    // Employers can see all payment records for their business
    // TODO: Add business ownership verification for employers
    return this.paymentsService.getPaymentRecords(businessId, startDate, endDate, employeeId);
  }

  @Post('records')
  async createPaymentRecord(
    @Body() createPaymentRecordDto: CreatePaymentRecordDto,
    @Request() req
  ) {
    return this.paymentsService.createPaymentRecord(createPaymentRecordDto);
  }

  @Put('records/:id')
  async updatePaymentRecord(
    @Param('id') id: string,
    @Body() updatePaymentRecordDto: UpdatePaymentRecordDto,
    @Request() req
  ) {
    return this.paymentsService.updatePaymentRecord(id, updatePaymentRecordDto);
  }

  @Patch('records/:id/mark-paid')
  async markAsPaid(
    @Param('id') id: string,
    @Body() markAsPaidDto: MarkAsPaidDto,
    @Request() req
  ) {
    return this.paymentsService.markAsPaid(id, markAsPaidDto);
  }

  @Delete('records/:id')
  async deletePaymentRecord(
    @Param('id') id: string,
    @Request() req
  ) {
    await this.paymentsService.deletePaymentRecord(id);
    return { message: 'Payment record deleted successfully' };
  }

  // =====================================================
  // SCHEDULE INTEGRATION
  // =====================================================

  @Get('hours/:businessId')
  async getEmployeeHours(
    @Param('businessId') businessId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Request() req
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('start_date and end_date are required');
    }

    return this.paymentsService.getEmployeeHours(businessId, startDate, endDate);
  }

  @Get('hours-detailed/:businessId')
  async getDetailedEmployeeHours(
    @Param('businessId') businessId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Request() req
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('start_date and end_date are required');
    }

    return this.paymentsService.getDetailedEmployeeHours(businessId, startDate, endDate);
  }

  @Post('calculate')
  async calculatePayForPeriod(
    @Body() calculateDto: {
      business_id: string;
      employee_id: string;
      start_date: string;
      end_date: string;
    },
    @Request() req
  ) {
    const { business_id, employee_id, start_date, end_date } = calculateDto;
    
    if (!business_id || !employee_id || !start_date || !end_date) {
      throw new BadRequestException('business_id, employee_id, start_date, and end_date are required');
    }

    return this.paymentsService.calculatePayForPeriod(
      business_id,
      employee_id, 
      start_date,
      end_date
    );
  }

  // =====================================================
  // REPORTS & ANALYTICS
  // =====================================================

  @Get('reports/:businessId')
  async getPaymentReports(
    @Param('businessId') businessId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Request() req
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('start_date and end_date are required');
    }

    return this.paymentsService.getPaymentReports(businessId, startDate, endDate);
  }

  @Get('summary/:businessId')
  async getBusinessSummary(
    @Param('businessId') businessId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Request() req?
  ) {
    // Default to last 30 days if no dates provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.paymentsService.getPaymentReports(businessId, start, end);
  }

  @Get('employee-breakdown/:businessId')
  async getEmployeeMonthlyBreakdown(
    @Param('businessId') businessId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Request() req
  ): Promise<MonthlyBreakdownReport> {
    // Allow both employers and employees to access this endpoint
    // Employees will only see their own data (filtered by service layer)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header required');
    }

    const userInfo = await this.authService.verifyToken(authHeader);
    if (!userInfo) {
      throw new UnauthorizedException('Invalid authentication token');
    }
    
    if (!startDate || !endDate) {
      throw new BadRequestException('start_date and end_date are required');
    }

    // If employee, get their employee_id and filter results
    if (userInfo.role === 'employee') {
      const employeeRecord = await this.paymentsService.getEmployeeByUserId(userInfo.userId);
      if (!employeeRecord) {
        throw new UnauthorizedException('Employee record not found');
      }
      
      // Get the breakdown and filter to only this employee's data
      const breakdown = await this.paymentsService.getEmployeeMonthlyBreakdown(businessId, startDate, endDate);
      
      // Filter employees array to only include the current employee
      return {
        ...breakdown,
        employees: breakdown.employees.filter(emp => emp.employee_id === employeeRecord.id)
      };
    }

    // Employers see all employees
    return this.paymentsService.getEmployeeMonthlyBreakdown(businessId, startDate, endDate);
  }


  // =====================================================
  // BULK OPERATIONS
  // =====================================================

  @Post('bulk/calculate/:businessId')
  async bulkCalculatePayForPeriod(
    @Param('businessId') businessId: string,
    @Body() bulkDto: {
      start_date: string;
      end_date: string;
      employee_ids?: string[];
    },
    @Request() req
  ) {
    const { start_date, end_date, employee_ids } = bulkDto;
    
    if (!start_date || !end_date) {
      throw new BadRequestException('start_date and end_date are required');
    }

    // Get all hours for the period
    const allHours = await this.paymentsService.getEmployeeHours(businessId, start_date, end_date);
    
    // Filter by specific employees if provided
    const targetEmployees = employee_ids || Object.keys(allHours);
    
    // Calculate pay for each employee
    const calculations = await Promise.all(
      targetEmployees.map(employeeId => 
        this.paymentsService.calculatePayForPeriod(businessId, employeeId, start_date, end_date)
          .catch(error => ({
            employee_id: employeeId,
            error: error.message
          }))
      )
    );

    return {
      business_id: businessId,
      period: { start_date, end_date },
      calculations
    };
  }

  @Post('bulk/create-records/:businessId')
  async bulkCreatePaymentRecords(
    @Param('businessId') businessId: string,
    @Body() bulkDto: {
      start_date: string;
      end_date: string;
      employee_ids?: string[];
      default_adjustments?: {
        advances?: number;
        bonuses?: number;
        deductions?: number;
      };
    },
    @Request() req
  ) {
    const { start_date, end_date, employee_ids, default_adjustments = {} } = bulkDto;
    
    if (!start_date || !end_date) {
      throw new BadRequestException('start_date and end_date are required');
    }

    // First, calculate pay for all employees
    const calculations = await this.bulkCalculatePayForPeriod(businessId, { start_date, end_date, employee_ids }, req);
    
    // Create payment records for successful calculations
    const successfulCalculations = calculations.calculations.filter(calc => 
      'total_hours' in calc && !('error' in calc)
    ) as PaymentCalculation[];
    
    const createPromises = successfulCalculations.map(calc => {
      const createDto: CreatePaymentRecordDto = {
        business_id: businessId,
        employee_id: calc.employee_id,
        period_start: start_date,
        period_end: end_date,
        total_hours: calc.total_hours,
        hourly_rate: calc.hourly_rate,
        advances: default_adjustments.advances || 0,
        bonuses: default_adjustments.bonuses || 0,
        deductions: default_adjustments.deductions || 0,
      };
      
      return this.paymentsService.createPaymentRecord(createDto)
        .catch(error => ({
          employee_id: calc.employee_id,
          error: error.message
        }));
    });

    const results = await Promise.all(createPromises);

    return {
      business_id: businessId,
      period: { start_date, end_date },
      created_records: results.filter(result => !('error' in result)),
      errors: results.filter(result => 'error' in result)
    };
  }
}
