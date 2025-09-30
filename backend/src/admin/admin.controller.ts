import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { VerifyBusinessDto } from './dto/verify-business.dto';
import { AdminGuard } from './guards/admin.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(ValidationPipe) loginDto: AdminLoginDto) {
    return this.adminService.login(loginDto.username, loginDto.password);
  }

  @Get('businesses/pending')
  @UseGuards(AdminGuard)
  async getPendingBusinesses() {
    return this.adminService.getPendingBusinesses();
  }

  @Get('businesses')
  @UseGuards(AdminGuard)
  async getAllBusinesses() {
    return this.adminService.getAllBusinesses();
  }

  @Get('businesses/stats')
  @UseGuards(AdminGuard)
  async getBusinessStats() {
    return this.adminService.getBusinessStats();
  }

  @Post('businesses/:id/approve')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async approveBusiness(
    @Param('id') businessId: string,
    @Body() body: { notes?: string },
    @Request() req: any,
  ) {
    const verifyDto: VerifyBusinessDto = {
      status: 'approved',
      notes: body.notes,
    };
    
    return this.adminService.verifyBusiness(
      businessId, 
      verifyDto, 
      req.user.email
    );
  }

  @Post('businesses/:id/reject')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async rejectBusiness(
    @Param('id') businessId: string,
    @Body() body: { notes?: string },
    @Request() req: any,
  ) {
    const verifyDto: VerifyBusinessDto = {
      status: 'rejected',
      notes: body.notes,
    };
    
    return this.adminService.verifyBusiness(
      businessId, 
      verifyDto, 
      req.user.email
    );
  }

  @Post('businesses/:id/verify')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async verifyBusiness(
    @Param('id') businessId: string,
    @Body(ValidationPipe) verifyDto: VerifyBusinessDto,
    @Request() req: any,
  ) {
    return this.adminService.verifyBusiness(
      businessId, 
      verifyDto, 
      req.user.email
    );
  }

  @Get('support/tickets')
  @UseGuards(AdminGuard)
  async getSupportTickets() {
    return this.adminService.getSupportTickets();
  }

  @Post('support/tickets/:id/update-status')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async updateTicketStatus(
    @Param('id') ticketId: string,
    @Body() body: { status: string; admin_notes?: string },
    @Request() req: any,
  ) {
    return this.adminService.updateTicketStatus(
      ticketId, 
      body.status, 
      body.admin_notes,
      req.user.email
    );
  }
}
