import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

export interface JobWithBusiness {
  id: string;
  business_id: string;
  employer_id: string;
  job_title: string;
  job_type: string;
  status: string;
  business_name: string;
  location: string;
  business_type: string;
  phone: string;
  email?: string;
  expected_hours_per_week?: number;
  schedule?: string;
  pay_type: string;
  pay_min: number;
  pay_max?: number;
  pay_currency: string;
  supplemental_pay: string[];
  benefits: string[];
  job_description: string;
  language_preference?: string;
  transportation_requirement?: string;
  published_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface JobStats {
  total_jobs: number;
  draft_jobs: number;
  published_jobs: number;
  closed_jobs: number;
}

@Injectable()
export class JobsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(createJobDto: CreateJobDto, employerId: string): Promise<JobWithBusiness> {
    // Verify the business belongs to the employer
    const { data: business, error: businessError } = await this.supabase.admin
      .from('businesses')
      .select('business_id, employer_id, name, type, location, phone, email')
      .eq('business_id', createJobDto.business_id)
      .eq('employer_id', employerId)
      .single();

    if (businessError || !business) {
      throw new ForbiddenException('Business not found or does not belong to you');
    }

    // Validate pay range
    if (createJobDto.pay_max && createJobDto.pay_max < createJobDto.pay_min) {
      throw new BadRequestException('Maximum pay cannot be less than minimum pay');
    }

    // Prepare job data
    const jobData = {
      ...createJobDto,
      employer_id: employerId,
      published_at: createJobDto.status === 'published' ? new Date().toISOString() : null,
    };

    const { data, error } = await this.supabase.admin
      .from('job_posts')
      .insert(jobData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job post: ${error.message}`);
    }

    return data;
  }

  async findAllByEmployer(employerId: string, status?: string): Promise<JobWithBusiness[]> {
    let query = this.supabase.admin
      .from('job_posts')
      .select('*')
      .eq('employer_id', employerId);

    if (status && ['draft', 'published', 'closed'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch job posts: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string, employerId: string): Promise<JobWithBusiness> {
    const { data, error } = await this.supabase.admin
      .from('job_posts')
      .select('*')
      .eq('id', id)
      .eq('employer_id', employerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Job post with ID ${id} not found`);
      }
      throw new Error(`Failed to fetch job post: ${error.message}`);
    }

    return data;
  }

  async update(id: string, updateJobDto: UpdateJobDto, employerId: string): Promise<JobWithBusiness> {
    // First verify the job exists and belongs to employer
    await this.findOne(id, employerId);

    // If business_id is being updated, verify the new business belongs to employer
    if (updateJobDto.business_id) {
      const { data: business, error: businessError } = await this.supabase.admin
        .from('businesses')
        .select('business_id')
        .eq('business_id', updateJobDto.business_id)
        .eq('employer_id', employerId)
        .single();

      if (businessError || !business) {
        throw new ForbiddenException('Business not found or does not belong to you');
      }
    }

    // Validate pay range if provided
    if (updateJobDto.pay_min && updateJobDto.pay_max && updateJobDto.pay_max < updateJobDto.pay_min) {
      throw new BadRequestException('Maximum pay cannot be less than minimum pay');
    }

    // Handle status transitions
    const updateData: any = { ...updateJobDto };
    if (updateJobDto.status) {
      if (updateJobDto.status === 'published') {
        updateData.published_at = new Date().toISOString();
      } else if (updateJobDto.status === 'closed') {
        updateData.closed_at = new Date().toISOString();
      }
    }

    const { data, error } = await this.supabase.admin
      .from('job_posts')
      .update(updateData)
      .eq('id', id)
      .eq('employer_id', employerId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update job post: ${error.message}`);
    }

    return data;
  }

  async remove(id: string, employerId: string): Promise<{ message: string }> {
    // First verify the job exists and belongs to employer
    await this.findOne(id, employerId);

    const { error } = await this.supabase.admin
      .from('job_posts')
      .delete()
      .eq('id', id)
      .eq('employer_id', employerId);

    if (error) {
      throw new Error(`Failed to delete job post: ${error.message}`);
    }

    return { message: 'Job post deleted successfully' };
  }

  async getJobStats(employerId: string): Promise<JobStats> {
    const { data, error } = await this.supabase.admin
      .from('job_posts')
      .select('status')
      .eq('employer_id', employerId);

    if (error) {
      throw new Error(`Failed to fetch job stats: ${error.message}`);
    }

    const jobs = data || [];
    const stats = {
      total_jobs: jobs.length,
      draft_jobs: jobs.filter(job => job.status === 'draft').length,
      published_jobs: jobs.filter(job => job.status === 'published').length,
      closed_jobs: jobs.filter(job => job.status === 'closed').length,
    };

    return stats;
  }

  async getEmployerBusinesses(employerId: string) {
    const { data, error } = await this.supabase.admin
      .from('businesses')
      .select('business_id, name, type, location, phone, email')
      .eq('employer_id', employerId)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch businesses: ${error.message}`);
    }

    return data || [];
  }
}
