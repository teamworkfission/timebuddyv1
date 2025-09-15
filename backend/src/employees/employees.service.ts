import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

export interface Employee {
  id: string;
  user_id: string;
  employee_gid: string;
  full_name: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  short_bio?: string;
  availability?: string;
  skills?: string[];
  transportation?: 'own_car' | 'public_transit' | 'not_needed';
  languages?: string[];
  resume_url?: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class EmployeesService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    // Check if employee profile already exists for this user
    const { data: existing } = await this.supabase.admin
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      throw new ConflictException('Employee profile already exists for this user');
    }

    const { data, error } = await this.supabase.admin
      .from('employees')
      .insert({
        user_id: userId,
        ...createEmployeeDto,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create employee profile: ${error.message}`);
    }

    return data;
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    const { data, error } = await this.supabase.admin
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch employee profile: ${error.message}`);
    }

    return data;
  }

  async update(userId: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    const { data, error } = await this.supabase.admin
      .from('employees')
      .update(updateEmployeeDto)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Employee profile not found');
      }
      throw new Error(`Failed to update employee profile: ${error.message}`);
    }

    return data;
  }

  async remove(userId: string): Promise<void> {
    const { error } = await this.supabase.admin
      .from('employees')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete employee profile: ${error.message}`);
    }
  }

  async createOrUpdate(userId: string, employeeData: CreateEmployeeDto): Promise<Employee> {
    // Try to update first
    const existing = await this.findByUserId(userId);
    
    if (existing) {
      return await this.update(userId, employeeData);
    } else {
      return await this.create(userId, employeeData);
    }
  }
}
