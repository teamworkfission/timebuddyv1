import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupportService } from './support.service';
import { CreateSupportTicketDto, CreateSupportTicketWithFileDto } from './dto/create-support-ticket.dto';
import { UserGuard } from './guards/user.guard';

@Controller('support')
@UseGuards(UserGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  async createTicket(
    @Body(ValidationPipe) createDto: CreateSupportTicketDto,
    @Request() req: any,
  ) {
    const { id: userId, email: userEmail, role: userRole } = req.user;
    return this.supportService.createTicket(userId, userEmail, userRole, createDto);
  }

  @Get('tickets')
  async getUserTickets(@Request() req: any) {
    const { id: userId } = req.user;
    return this.supportService.getUserTickets(userId);
  }

  @Get('tickets/:id')
  async getTicket(@Param('id') ticketId: string, @Request() req: any) {
    const { id: userId } = req.user;
    return this.supportService.getTicket(ticketId, userId);
  }

  @Post('upload-screenshot')
  @UseInterceptors(FileInterceptor('screenshot'))
  async uploadScreenshot(
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    const { id: userId } = req.user;

    if (!file) {
      throw new BadRequestException('Screenshot file is required');
    }

    const screenshotUrl = await this.supportService.uploadScreenshot(userId, file);
    return { screenshot_url: screenshotUrl };
  }

  @Post('tickets-with-file')
  @UseInterceptors(FileInterceptor('screenshot'))
  async createTicketWithFile(
    @Body(ValidationPipe) createDto: CreateSupportTicketWithFileDto,
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    const { id: userId, email: userEmail, role: userRole } = req.user;
    
    let screenshotUrl: string | undefined;
    
    // Upload screenshot if provided
    if (file) {
      screenshotUrl = await this.supportService.uploadScreenshot(userId, file);
    }

    // Create the ticket with the uploaded screenshot URL
    const ticketData: CreateSupportTicketDto = {
      ...createDto,
      screenshot_url: screenshotUrl,
    };

    return this.supportService.createTicket(userId, userEmail, userRole, ticketData);
  }
}
