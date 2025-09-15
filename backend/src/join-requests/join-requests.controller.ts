import { 
  Controller, 
  Post, 
  Get, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { JoinRequestsService, CreateJoinRequestDto, UpdateJoinRequestDto } from './join-requests.service';
import { AuthService } from '../auth/auth.service';

@Controller('join-requests')
export class JoinRequestsController {
  constructor(
    private readonly joinRequestsService: JoinRequestsService,
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

  /**
   * Send a join request to an employee (Employer only)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async sendJoinRequest(@Request() req, @Body() createDto: CreateJoinRequestDto) {
    const userId = await this.getUserIdFromRequest(req);
    return this.joinRequestsService.sendJoinRequest(userId, createDto);
  }

  /**
   * Get all join requests sent by the employer
   */
  @Get('sent')
  async getEmployerJoinRequests(@Request() req) {
    const userId = await this.getUserIdFromRequest(req);
    return this.joinRequestsService.getEmployerJoinRequests(userId);
  }

  /**
   * Get all join requests received by the employee
   */
  @Get('received')
  async getEmployeeJoinRequests(@Request() req) {
    const userId = await this.getUserIdFromRequest(req);
    return this.joinRequestsService.getEmployeeJoinRequests(userId);
  }

  /**
   * Respond to a join request (Employee only)
   */
  @Patch(':id/respond')
  async respondToJoinRequest(
    @Request() req,
    @Param('id') requestId: string,
    @Body() updateDto: UpdateJoinRequestDto
  ) {
    const userId = await this.getUserIdFromRequest(req);
    return this.joinRequestsService.respondToJoinRequest(userId, requestId, updateDto);
  }

  /**
   * Cancel a join request (Employer only)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelJoinRequest(@Request() req, @Param('id') requestId: string) {
    const userId = await this.getUserIdFromRequest(req);
    await this.joinRequestsService.cancelJoinRequest(userId, requestId);
  }
}
