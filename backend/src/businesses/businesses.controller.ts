import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ValidationPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { AuthService } from '../auth/auth.service';

@Controller('businesses')
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly authService: AuthService,
  ) {}

  private async getEmployerIdFromRequest(request: any): Promise<string> {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const { id: employerId, role } = await this.authService.verifyToken(token);
    
    if (role !== 'employer') {
      throw new Error('Access denied: Employer role required');
    }

    return employerId;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createBusinessDto: CreateBusinessDto,
    @Request() req: any,
  ) {
    const employerId = await this.getEmployerIdFromRequest(req);
    return this.businessesService.create(createBusinessDto, employerId);
  }

  @Get()
  async findAll(@Request() req: any) {
    const employerId = await this.getEmployerIdFromRequest(req);
    return this.businessesService.findAllByEmployer(employerId);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    const employerId = await this.getEmployerIdFromRequest(req);
    return this.businessesService.getBusinessStats(employerId);
  }

  @Get('job-stats')
  async getJobStats(@Request() req: any) {
    const employerId = await this.getEmployerIdFromRequest(req);
    return this.businessesService.getBusinessJobStats(employerId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const employerId = await this.getEmployerIdFromRequest(req);
    return this.businessesService.findOne(id, employerId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateBusinessDto: UpdateBusinessDto,
    @Request() req: any,
  ) {
    const employerId = await this.getEmployerIdFromRequest(req);
    return this.businessesService.update(id, updateBusinessDto, employerId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: any) {
    const employerId = await this.getEmployerIdFromRequest(req);
    return this.businessesService.remove(id, employerId);
  }

  // Employee Management Endpoints

  @Get(':id/employees')
  async getBusinessEmployees(@Param('id') businessId: string, @Request() req: any) {
    const employerId = await this.getEmployerIdFromRequest(req);
    return this.businessesService.getBusinessEmployees(businessId, employerId);
  }

  @Delete(':businessId/employees/:employeeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeEmployee(
    @Param('businessId') businessId: string,
    @Param('employeeId') employeeId: string,
    @Request() req: any,
  ) {
    const employerId = await this.getEmployerIdFromRequest(req);
    return this.businessesService.removeEmployee(businessId, employeeId, employerId);
  }

  @Patch(':businessId/employees/:employeeId/role')
  async updateEmployeeRole(
    @Param('businessId') businessId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: { role: string },
    @Request() req: any,
  ) {
    const employerId = await this.getEmployerIdFromRequest(req);
    return this.businessesService.updateEmployeeRole(
      businessId, 
      employeeId, 
      body.role, 
      employerId
    );
  }
}
