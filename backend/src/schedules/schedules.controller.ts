import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { ShiftTemplatesService } from './shift-templates.service';
import { AuthService } from '../auth/auth.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto';
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto';
import { 
  CreateConfirmedHoursDto, 
  UpdateConfirmedHoursDto, 
  SubmitHoursDto, 
  ApproveHoursDto,
  RejectHoursDto
} from './dto/confirmed-hours.dto';

@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly shiftTemplatesService: ShiftTemplatesService,
    private readonly authService: AuthService,
  ) {}

  private async getUserIdFromRequest(request: any): Promise<string> {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const { id: userId } = await this.authService.verifyToken(token);
    
    return userId;
  }

  // Shift Templates Endpoints
  @Get('businesses/:businessId/shift-templates')
  async getShiftTemplates(@Param('businessId') businessId: string) {
    return this.shiftTemplatesService.getBusinessTemplates(businessId);
  }

  @Post('businesses/:businessId/shift-templates')
  async createShiftTemplate(
    @Param('businessId') businessId: string,
    @Body() createDto: CreateShiftTemplateDto,
  ) {
    return this.shiftTemplatesService.createTemplate(businessId, createDto);
  }

  @Post('businesses/:businessId/shift-templates/default')
  async createDefaultShiftTemplates(@Param('businessId') businessId: string) {
    return this.shiftTemplatesService.createDefaultTemplates(businessId);
  }

  @Put('shift-templates/:id')
  async updateShiftTemplate(
    @Param('id') id: string,
    @Body() updateDto: UpdateShiftTemplateDto,
  ) {
    return this.shiftTemplatesService.updateTemplate(id, updateDto);
  }

  @Delete('shift-templates/:id')
  async deleteShiftTemplate(@Param('id') id: string) {
    await this.shiftTemplatesService.deleteTemplate(id);
    return { message: 'Shift template deleted successfully' };
  }

  // Weekly Schedules Endpoints
  @Get('businesses/:businessId/weeks/:weekStart')
  async getWeeklySchedule(
    @Param('businessId') businessId: string,
    @Param('weekStart') weekStart: string,
    @Request() req: any,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    return this.schedulesService.getOrCreateWeeklySchedule(
      businessId,
      weekStart,
      userId,
    );
  }

  /**
   * Get weekly schedule filtered by status (draft or posted)
   * Enables proper separation between Edit Schedule and Posted Schedule tabs
   */
  @Get('businesses/:businessId/weeks/:weekStart/:status')
  async getWeeklyScheduleByStatus(
    @Param('businessId') businessId: string,
    @Param('weekStart') weekStart: string,
    @Param('status') status: 'draft' | 'posted',
  ) {
    // Validate status parameter
    if (!['draft', 'posted'].includes(status)) {
      throw new BadRequestException('Status must be either "draft" or "posted"');
    }
    
    return this.schedulesService.getWeeklyScheduleByStatus(
      businessId,
      weekStart,
      status,
    );
  }

  @Post('businesses/:businessId/weeks/:weekStart')
  async createWeeklySchedule(
    @Param('businessId') businessId: string,
    @Param('weekStart') weekStart: string,
    @Request() req: any,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    const createDto: CreateScheduleDto = {
      business_id: businessId,
      week_start_date: weekStart,
    };
    return this.schedulesService.createWeeklySchedule(createDto, userId);
  }

  @Put('schedules/:scheduleId/post')
  async postSchedule(@Param('scheduleId') scheduleId: string) {
    return this.schedulesService.postSchedule(scheduleId);
  }

  @Put('schedules/:scheduleId/unpost')
  async unpostSchedule(@Param('scheduleId') scheduleId: string) {
    return this.schedulesService.unpostSchedule(scheduleId);
  }

  // Individual Shifts Endpoints
  @Post('schedules/:scheduleId/shifts')
  async createShift(
    @Param('scheduleId') scheduleId: string,
    @Body() createDto: CreateShiftDto,
  ) {
    return this.schedulesService.createShift(scheduleId, createDto);
  }

  @Put('shifts/:shiftId')
  async updateShift(
    @Param('shiftId') shiftId: string,
    @Body() updateDto: UpdateShiftDto,
  ) {
    return this.schedulesService.updateShift(shiftId, updateDto);
  }

  @Delete('shifts/:shiftId')
  async deleteShift(@Param('shiftId') shiftId: string) {
    await this.schedulesService.deleteShift(shiftId);
    return { message: 'Shift deleted successfully' };
  }

  @Post('schedules/:scheduleId/shifts/bulk')
  async bulkCreateShifts(
    @Param('scheduleId') scheduleId: string,
    @Body() shifts: CreateShiftDto[],
  ) {
    return this.schedulesService.bulkCreateShifts(scheduleId, shifts);
  }

  // Utility Endpoints
  @Get('schedules/:scheduleId/hours')
  async calculateEmployeeHours(@Param('scheduleId') scheduleId: string) {
    return this.schedulesService.calculateEmployeeHours(scheduleId);
  }

  // Employee Schedule Endpoints
  @Get('employee/schedules/week/:weekStart')
  async getEmployeeWeeklySchedules(
    @Param('weekStart') weekStart: string,
    @Request() req: any,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    return this.schedulesService.getEmployeeSchedules(userId, weekStart);
  }

  // =====================================================
  // EMPLOYEE CONFIRMED HOURS ENDPOINTS
  // =====================================================

  /**
   * Get employee's weekly hours with scheduled hours prefill
   * Returns both confirmed hours (if exists) and scheduled hours from posted schedules
   */
  @Get('employee/hours/:businessId/:weekStart')
  async getEmployeeWeeklyHours(
    @Param('businessId') businessId: string,
    @Param('weekStart') weekStart: string,
    @Request() req: any,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    return this.schedulesService.getEmployeeWeeklyHours(businessId, weekStart, userId);
  }

  /**
   * Create new confirmed hours record for employee
   */
  @Post('employee/hours')
  async createConfirmedHours(
    @Body() createDto: CreateConfirmedHoursDto,
    @Request() req: any,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    return this.schedulesService.createConfirmedHours(createDto, userId);
  }

  /**
   * Update existing confirmed hours (only draft status)
   */
  @Put('employee/hours/:id')
  async updateConfirmedHours(
    @Param('id') id: string,
    @Body() updateDto: UpdateConfirmedHoursDto,
    @Request() req: any,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    return this.schedulesService.updateConfirmedHours(id, updateDto, userId);
  }

  /**
   * Submit confirmed hours for employer approval
   */
  @Post('employee/hours/:id/submit')
  async submitConfirmedHours(
    @Param('id') id: string,
    @Body() submitDto: SubmitHoursDto,
    @Request() req: any,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    return this.schedulesService.submitConfirmedHours(id, submitDto, userId);
  }

  /**
   * Get list of employee's confirmed hours records
   */
  @Get('employee/hours/list')
  async getEmployeeConfirmedHoursList(
    @Query('business_id') businessId: string | undefined,
    @Request() req: any,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    return this.schedulesService.getEmployeeConfirmedHoursList(userId, businessId);
  }

  // =====================================================
  // EMPLOYER CONFIRMED HOURS ENDPOINTS
  // =====================================================

  /**
   * Get confirmed hours for employer's business (submitted/approved only)
   */
  @Get('employer/hours/:businessId')
  async getEmployerConfirmedHoursList(
    @Param('businessId') businessId: string,
    @Query('status') status: 'submitted' | 'approved' | undefined,
    @Request() req: any,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    return this.schedulesService.getEmployerConfirmedHoursList(businessId, userId, status);
  }

  /**
   * Approve submitted hours (employer only)
   */
  @Post('employer/hours/:id/approve')
  async approveConfirmedHours(
    @Param('id') id: string,
    @Body() approveDto: ApproveHoursDto,
    @Request() req: any,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    return this.schedulesService.approveConfirmedHours(id, approveDto, userId);
  }

  /**
   * Reject submitted hours with reason (employer only)
   */
  @Post('employer/hours/:id/reject')
  async rejectConfirmedHours(
    @Param('id') id: string,
    @Body() rejectDto: RejectHoursDto,
    @Request() req: any,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    return this.schedulesService.rejectConfirmedHours(id, rejectDto, userId);
  }
}
