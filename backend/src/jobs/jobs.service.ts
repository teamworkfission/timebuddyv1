import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobSearchDto, PublicJobPost, JobSearchResponse, LocationOption } from './dto/job-search.dto';

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

  // PUBLIC SEARCH METHODS FOR EMPLOYEES

  async searchPublicJobs(searchDto: JobSearchDto): Promise<JobSearchResponse> {
    const { keywords, state, city, county, page = 1, limit = 20 } = searchDto;
    const offset = (page - 1) * limit;

    // Base query for published jobs only
    let query = this.supabase.admin
      .from('job_posts')
      .select('*', { count: 'exact' })
      .eq('status', 'published');

    // Apply filters
    if (keywords) {
      query = query.or(`job_title.ilike.%${keywords}%,job_description.ilike.%${keywords}%,business_name.ilike.%${keywords}%`);
    }

    if (state) {
      query = query.ilike('location', `%${state}%`);
    }

    if (city) {
      query = query.ilike('location', `%${city}%`);
    }

    if (county) {
      query = query.ilike('location', `%${county}%`);
    }

    // Apply pagination and ordering
    query = query
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to search jobs: ${error.message}`);
    }

    // Transform to public format (remove sensitive data)
    const publicJobs: PublicJobPost[] = (data || []).map(job => ({
      id: job.id,
      job_title: job.job_title,
      business_name: job.business_name,
      location: job.location,
      job_type: job.job_type,
      pay_type: job.pay_type,
      pay_min: job.pay_min,
      pay_max: job.pay_max,
      pay_currency: job.pay_currency,
      expected_hours_per_week: job.expected_hours_per_week,
      schedule: job.schedule,
      supplemental_pay: job.supplemental_pay || [],
      benefits: job.benefits || [],
      job_description: job.job_description,
      business_type: job.business_type,
      language_preference: job.language_preference,
      transportation_requirement: job.transportation_requirement,
      phone: job.phone,
      email: job.email,
      published_at: job.published_at,
      created_at: job.created_at,
    }));

    return {
      jobs: publicJobs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async getPublicJobById(id: string): Promise<PublicJobPost> {
    const { data, error } = await this.supabase.admin
      .from('job_posts')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Job with ID ${id} not found or not published`);
      }
      throw new Error(`Failed to fetch job: ${error.message}`);
    }

    // Transform to public format
    return {
      id: data.id,
      job_title: data.job_title,
      business_name: data.business_name,
      location: data.location,
      job_type: data.job_type,
      pay_type: data.pay_type,
      pay_min: data.pay_min,
      pay_max: data.pay_max,
      pay_currency: data.pay_currency,
      expected_hours_per_week: data.expected_hours_per_week,
      schedule: data.schedule,
      supplemental_pay: data.supplemental_pay || [],
      benefits: data.benefits || [],
      job_description: data.job_description,
      business_type: data.business_type,
      language_preference: data.language_preference,
      transportation_requirement: data.transportation_requirement,
      phone: data.phone,
      email: data.email,
      published_at: data.published_at,
      created_at: data.created_at,
    };
  }

  async getStatesWithJobs(): Promise<LocationOption[]> {
    const { data, error } = await this.supabase.admin
      .from('job_posts')
      .select('location')
      .eq('status', 'published');

    if (error) {
      throw new Error(`Failed to fetch states: ${error.message}`);
    }

    // Parse states from location strings and count jobs
    const stateCounts: Record<string, number> = {};
    (data || []).forEach(job => {
      if (job.location) {
        // Extract state (last part after comma)
        const parts = job.location.split(',').map(p => p.trim());
        const state = parts[parts.length - 1];
        if (state) {
          stateCounts[state] = (stateCounts[state] || 0) + 1;
        }
      }
    });

    return Object.entries(stateCounts)
      .map(([name, job_count]) => ({ name, job_count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCitiesWithJobs(state: string): Promise<LocationOption[]> {
    const { data, error } = await this.supabase.admin
      .from('job_posts')
      .select('location')
      .eq('status', 'published')
      .ilike('location', `%${state}%`);

    if (error) {
      throw new Error(`Failed to fetch cities: ${error.message}`);
    }

    // Parse cities from location strings
    const cityCounts: Record<string, number> = {};
    (data || []).forEach(job => {
      if (job.location && job.location.includes(state)) {
        const parts = job.location.split(',').map(p => p.trim());
        // Assuming format: "City, State" or "City, County, State"
        if (parts.length >= 2) {
          const city = parts[0];
          if (city) {
            cityCounts[city] = (cityCounts[city] || 0) + 1;
          }
        }
      }
    });

    return Object.entries(cityCounts)
      .map(([name, job_count]) => ({ name, job_count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCountiesWithJobs(state: string, city: string): Promise<LocationOption[]> {
    const { data, error } = await this.supabase.admin
      .from('job_posts')
      .select('location')
      .eq('status', 'published')
      .ilike('location', `%${city}%`)
      .ilike('location', `%${state}%`);

    if (error) {
      throw new Error(`Failed to fetch counties: ${error.message}`);
    }

    // Parse counties from location strings
    const countyCounts: Record<string, number> = {};
    (data || []).forEach(job => {
      if (job.location && job.location.includes(city) && job.location.includes(state)) {
        const parts = job.location.split(',').map(p => p.trim());
        // Assuming format: "City, County, State" 
        if (parts.length === 3) {
          const county = parts[1];
          if (county && county.toLowerCase().includes('county')) {
            countyCounts[county] = (countyCounts[county] || 0) + 1;
          }
        }
      }
    });

    return Object.entries(countyCounts)
      .map(([name, job_count]) => ({ name, job_count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
