import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(createBusinessDto: CreateBusinessDto, employerId: string) {
    const { data, error } = await this.supabase.admin
      .from('businesses')
      .insert({
        ...createBusinessDto,
        employer_id: employerId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create business: ${error.message}`);
    }

    return data;
  }

  async findAllByEmployer(employerId: string) {
    const { data, error } = await this.supabase.admin
      .from('businesses')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch businesses: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string, employerId: string) {
    const { data, error } = await this.supabase.admin
      .from('businesses')
      .select('*')
      .eq('business_id', id)
      .eq('employer_id', employerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Business with ID ${id} not found`);
      }
      throw new Error(`Failed to fetch business: ${error.message}`);
    }

    return data;
  }

  async update(id: string, updateBusinessDto: UpdateBusinessDto, employerId: string) {
    // First check if business exists and belongs to employer
    await this.findOne(id, employerId);

    const { data, error } = await this.supabase.admin
      .from('businesses')
      .update(updateBusinessDto)
      .eq('business_id', id)
      .eq('employer_id', employerId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update business: ${error.message}`);
    }

    return data;
  }

  async remove(id: string, employerId: string) {
    // First check if business exists and belongs to employer
    await this.findOne(id, employerId);

    const { error } = await this.supabase.admin
      .from('businesses')
      .delete()
      .eq('business_id', id)
      .eq('employer_id', employerId);

    if (error) {
      throw new Error(`Failed to delete business: ${error.message}`);
    }

    return { message: 'Business deleted successfully' };
  }

  async getBusinessStats(employerId: string) {
    const { data, error } = await this.supabase.admin
      .from('businesses')
      .select('business_id, total_employees')
      .eq('employer_id', employerId);

    if (error) {
      throw new Error(`Failed to fetch business stats: ${error.message}`);
    }

    const businesses = data || [];
    const totalBusinesses = businesses.length;
    const totalEmployees = businesses.reduce((sum, business) => sum + (business.total_employees || 0), 0);

    return {
      total_businesses: totalBusinesses,
      total_employees: totalEmployees,
    };
  }

  async getBusinessJobStats(employerId: string) {
    const { data, error } = await this.supabase.admin
      .rpc('get_business_job_stats', { employer_id: employerId });

    if (error) {
      // If RPC doesn't exist, fall back to manual query
      const { data: businessData, error: businessError } = await this.supabase.admin
        .from('businesses')
        .select(`
          business_id,
          name,
          location,
          type,
          created_at,
          job_posts (
            id,
            status,
            employee_job_application (id)
          )
        `)
        .eq('employer_id', employerId);

      if (businessError) {
        throw new Error(`Failed to fetch business job stats: ${businessError.message}`);
      }

      // Transform the data to get counts
      return (businessData || []).map(business => ({
        business_id: business.business_id,
        business_name: business.name,
        location: business.location,
        business_type: business.type,
        created_at: business.created_at,
        total_jobs: business.job_posts?.length || 0,
        draft_jobs: business.job_posts?.filter(job => job.status === 'draft').length || 0,
        published_jobs: business.job_posts?.filter(job => job.status === 'published').length || 0,
        closed_jobs: business.job_posts?.filter(job => job.status === 'closed').length || 0,
        total_applications: business.job_posts?.reduce((sum, job) => 
          sum + (job.employee_job_application?.length || 0), 0) || 0,
      }));
    }

    return data || [];
  }

  // Employee Management Methods

  async getBusinessEmployees(businessId: string, employerId: string) {
    // First verify business belongs to employer
    await this.findOne(businessId, employerId);

    const { data, error } = await this.supabase.admin
      .from('business_employees')
      .select(`
        id,
        role,
        joined_at,
        employees!inner(
          id,
          employee_gid,
          full_name,
          email,
          phone,
          city,
          state,
          skills,
          transportation
        )
      `)
      .eq('business_id', businessId)
      .order('joined_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch business employees: ${error.message}`);
    }

    return (data || []).map(association => ({
      association_id: association.id,
      role: association.role,
      joined_at: association.joined_at,
      employee: association.employees,
    }));
  }

  async removeEmployee(businessId: string, employeeId: string, employerId: string) {
    // First verify business belongs to employer
    await this.findOne(businessId, employerId);

    const { error } = await this.supabase.admin
      .from('business_employees')
      .delete()
      .eq('business_id', businessId)
      .eq('employee_id', employeeId);

    if (error) {
      throw new Error(`Failed to remove employee: ${error.message}`);
    }

    return { message: 'Employee removed successfully' };
  }

  async updateEmployeeRole(
    businessId: string, 
    employeeId: string, 
    role: string, 
    employerId: string
  ) {
    // First verify business belongs to employer
    await this.findOne(businessId, employerId);

    const { data, error } = await this.supabase.admin
      .from('business_employees')
      .update({ role })
      .eq('business_id', businessId)
      .eq('employee_id', employeeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update employee role: ${error.message}`);
    }

    return data;
  }
}
