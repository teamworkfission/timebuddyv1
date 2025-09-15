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
  Query,
  BadRequestException 
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobSearchDto } from './dto/job-search.dto';
import { AuthService } from '../auth/auth.service';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly authService: AuthService,
  ) {}

  // Create a new job post
  @Post()
  async create(@Request() req: any, @Body() createJobDto: CreateJobDto) {
    // Verify token and get user info
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employer') {
      throw new BadRequestException('Only employers can create job posts');
    }

    return this.jobsService.create(createJobDto, user.id);
  }

  // Get all job posts for the employer
  @Get()
  async findAll(
    @Request() req: any, 
    @Query('status') status?: string,
    @Query('business_id') businessId?: string
  ) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employer') {
      throw new BadRequestException('Only employers can view job posts');
    }

    return this.jobsService.findAllByEmployer(user.id, status, businessId);
  }

  // Get job statistics
  @Get('stats')
  async getStats(@Request() req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employer') {
      throw new BadRequestException('Only employers can view job stats');
    }

    return this.jobsService.getJobStats(user.id);
  }

  // Get employer's businesses for dropdown
  @Get('businesses')
  async getBusinesses(@Request() req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employer') {
      throw new BadRequestException('Only employers can view businesses');
    }

    return this.jobsService.getEmployerBusinesses(user.id);
  }

  // Get jobs that have applications with specific statuses
  @Get('with-applications')
  async getJobsWithApplications(
    @Request() req: any,
    @Query('application_status') applicationStatuses: string | string[],
    @Query('business_id') businessId?: string
  ) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employer') {
      throw new BadRequestException('Only employers can view job posts');
    }

    // Ensure applicationStatuses is an array
    const statusArray = Array.isArray(applicationStatuses) 
      ? applicationStatuses 
      : [applicationStatuses];

    return this.jobsService.findJobsWithApplicationStatus(user.id, statusArray, businessId);
  }

  // Get a specific job post
  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employer') {
      throw new BadRequestException('Only employers can view job posts');
    }

    return this.jobsService.findOne(id, user.id);
  }

  // Update a job post
  @Patch(':id')
  async update(
    @Request() req: any, 
    @Param('id') id: string, 
    @Body() updateJobDto: UpdateJobDto
  ) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employer') {
      throw new BadRequestException('Only employers can update job posts');
    }

    return this.jobsService.update(id, updateJobDto, user.id);
  }

  // Delete a job post
  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employer') {
      throw new BadRequestException('Only employers can delete job posts');
    }

    return this.jobsService.remove(id, user.id);
  }

  // PUBLIC ENDPOINTS FOR JOB SEEKERS (NO AUTH REQUIRED)

  // Search published jobs publicly
  @Get('public/search')
  async searchPublicJobs(@Query() searchDto: JobSearchDto) {
    return this.jobsService.searchPublicJobs(searchDto);
  }

  // Get a specific published job publicly
  @Get('public/:id')
  async getPublicJob(@Param('id') id: string) {
    return this.jobsService.getPublicJobById(id);
  }

  // Get states with available jobs
  @Get('locations/states')
  async getStatesWithJobs() {
    return this.jobsService.getStatesWithJobs();
  }

  // Get cities with jobs in a specific state
  @Get('locations/cities/:state')
  async getCitiesWithJobs(@Param('state') state: string) {
    return this.jobsService.getCitiesWithJobs(state);
  }

  // Get counties with jobs in a specific state and city
  @Get('locations/counties/:state/:city')
  async getCountiesWithJobs(@Param('state') state: string, @Param('city') city: string) {
    return this.jobsService.getCountiesWithJobs(state, city);
  }
}
