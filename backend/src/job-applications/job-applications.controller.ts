import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Request,
  Query,
  BadRequestException 
} from '@nestjs/common';
import { JobApplicationsService } from './job-applications.service';
import { CreateJobApplicationDto, UpdateJobApplicationDto } from './dto/create-job-application.dto';
import { AuthService } from '../auth/auth.service';

@Controller('job-applications')
export class JobApplicationsController {
  constructor(
    private readonly jobApplicationsService: JobApplicationsService,
    private readonly authService: AuthService,
  ) {}

  // Create a new job application
  @Post()
  async create(@Request() req: any, @Body() createJobApplicationDto: CreateJobApplicationDto) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employee') {
      throw new BadRequestException('Only employees can create job applications');
    }

    return this.jobApplicationsService.create(createJobApplicationDto, user.id);
  }

  // Get all applications for the current user (employee or employer view)
  @Get()
  async findAll(@Request() req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role === 'employee') {
      return this.jobApplicationsService.findAllByEmployee(user.id);
    } else if (user.role === 'employer') {
      return this.jobApplicationsService.findAllByEmployer(user.id);
    } else {
      throw new BadRequestException('Invalid user role');
    }
  }

  // Get applications for a specific job post (employers only)
  @Get('job/:jobPostId')
  async getApplicationsByJobPost(@Request() req: any, @Param('jobPostId') jobPostId: string) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employer') {
      throw new BadRequestException('Only employers can view job applications');
    }

    return this.jobApplicationsService.getApplicationsByJobPost(jobPostId, user.id);
  }

  // Get a specific job application
  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    return this.jobApplicationsService.findOne(id, user.id);
  }

  // Update a job application
  @Patch(':id')
  async update(
    @Request() req: any, 
    @Param('id') id: string, 
    @Body() updateJobApplicationDto: UpdateJobApplicationDto
  ) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    return this.jobApplicationsService.update(id, updateJobApplicationDto, user.id);
  }

  // Delete a job application (employees only)
  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employee') {
      throw new BadRequestException('Only employees can delete their applications');
    }

    return this.jobApplicationsService.delete(id, user.id);
  }
}
