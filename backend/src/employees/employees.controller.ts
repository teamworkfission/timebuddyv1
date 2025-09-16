import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Delete, 
  Request,
  HttpStatus,
  HttpCode,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { EmployeesService, Employee } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AuthService } from '../auth/auth.service';

@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: any,
    @Body() createEmployeeDto: CreateEmployeeDto
  ): Promise<Employee> {
    // Verify token and get user info
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employee') {
      throw new BadRequestException('Only employees can create employee profiles');
    }

    return this.employeesService.create(user.id, createEmployeeDto);
  }

  @Get('profile')
  async getProfile(@Request() req: any): Promise<Employee> {
    // Verify token and get user info
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employee') {
      throw new BadRequestException('Only employees can view employee profiles');
    }

    const profile = await this.employeesService.findByUserId(user.id);
    
    if (!profile) {
      throw new NotFoundException('Employee profile not found');
    }

    return profile;
  }

  @Patch('profile')
  async updateProfile(
    @Request() req: any,
    @Body() updateEmployeeDto: UpdateEmployeeDto
  ): Promise<Employee> {
    // Verify token and get user info
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employee') {
      throw new BadRequestException('Only employees can update employee profiles');
    }

    return this.employeesService.update(user.id, updateEmployeeDto);
  }

  @Delete('profile')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(@Request() req: any): Promise<void> {
    // Verify token and get user info
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employee') {
      throw new BadRequestException('Only employees can delete employee profiles');
    }

    await this.employeesService.remove(user.id);
  }

  @Post('profile/create-or-update')
  async createOrUpdateProfile(
    @Request() req: any,
    @Body() employeeData: CreateEmployeeDto
  ): Promise<Employee> {
    // Verify token and get user info
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.verifyToken(token);

    if (user.role !== 'employee') {
      throw new BadRequestException('Only employees can manage employee profiles');
    }

    return this.employeesService.createOrUpdate(user.id, employeeData);
  }
}
