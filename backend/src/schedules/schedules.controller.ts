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
}
