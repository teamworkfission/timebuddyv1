import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { CreateJobApplicationDto, UpdateJobApplicationDto } from './dto/create-job-application.dto';

export interface JobApplication {
  id: string;
  job_post_id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  short_bio?: string;
  availability?: string;
  skills?: string[];
  transportation?: string;
  languages?: string[];
  resume_url?: string;
  show_phone: boolean;
  show_email: boolean;
  cover_message?: string;
  status: string;
  safety_disclaimer_accepted: boolean;
  safety_disclaimer_accepted_at: string;
  applied_at: string;
  status_updated_at: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplicationWithJobDetails extends JobApplication {
  job_title: string;
  business_name: string;
  location: string;
  job_description: string;
  job_type: string;
  pay_type: string;
  pay_min: number;
  pay_max?: number;
  pay_currency: string;
  expected_hours_per_week?: number;
  schedule?: string;
  supplemental_pay: string[];
  benefits: string[];
  business_type: string;
  language_preference?: string;
  transportation_requirement?: string;
  phone: string;
  email?: string;
  published_at: string;
}

@Injectable()
export class JobApplicationsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(createJobApplicationDto: CreateJobApplicationDto, employeeId: string): Promise<JobApplication> {
    // Verify the job post exists and is published
    const { data: jobPost, error: jobError } = await this.supabase.admin
      .from('job_posts')
      .select('id, status, employer_id')
      .eq('id', createJobApplicationDto.job_post_id)
      .single();

    if (jobError || !jobPost) {
      throw new NotFoundException('Job post not found');
    }

    if (jobPost.status !== 'published') {
      throw new BadRequestException('Cannot apply to unpublished job post');
    }

    // Check for duplicate application
    const { data: existingApplication } = await this.supabase.admin
      .from('employee_job_application')
      .select('id')
      .eq('job_post_id', createJobApplicationDto.job_post_id)
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (existingApplication) {
      throw new BadRequestException('You have already applied to this job');
    }

    // Validate safety disclaimer
    if (!createJobApplicationDto.safety_disclaimer_accepted) {
      throw new BadRequestException('Safety disclaimer must be accepted');
    }

    // Create application
    const applicationData = {
      ...createJobApplicationDto,
      employee_id: employeeId,
      safety_disclaimer_accepted_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase.admin
      .from('employee_job_application')
      .insert(applicationData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job application: ${error.message}`);
    }

    return data;
  }

  async findAllByEmployee(employeeId: string): Promise<JobApplicationWithJobDetails[]> {
    const { data, error } = await this.supabase.admin
      .from('employee_job_application')
      .select(`
        *,
        job_posts!inner(
          job_title,
          business_name,
          location,
          job_description,
          job_type,
          pay_type,
          pay_min,
          pay_max,
          pay_currency,
          expected_hours_per_week,
          schedule,
          supplemental_pay,
          benefits,
          business_type,
          language_preference,
          transportation_requirement,
          phone,
          email,
          published_at,
          created_at
        )
      `)
      .eq('employee_id', employeeId)
      .order('applied_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch applications: ${error.message}`);
    }

    // Transform the data to flatten job post details
    return data.map(app => ({
      ...app,
      job_title: app.job_posts.job_title,
      business_name: app.job_posts.business_name,
      location: app.job_posts.location,
      job_description: app.job_posts.job_description,
      job_type: app.job_posts.job_type,
      pay_type: app.job_posts.pay_type,
      pay_min: app.job_posts.pay_min,
      pay_max: app.job_posts.pay_max,
      pay_currency: app.job_posts.pay_currency,
      expected_hours_per_week: app.job_posts.expected_hours_per_week,
      schedule: app.job_posts.schedule,
      supplemental_pay: app.job_posts.supplemental_pay || [],
      benefits: app.job_posts.benefits || [],
      business_type: app.job_posts.business_type,
      language_preference: app.job_posts.language_preference,
      transportation_requirement: app.job_posts.transportation_requirement,
      phone: app.job_posts.phone,
      email: app.job_posts.email,
      published_at: app.job_posts.published_at,
      job_posts: undefined, // Remove nested object
    }));
  }

  async findAllByEmployer(employerId: string): Promise<JobApplicationWithJobDetails[]> {
    const { data, error } = await this.supabase.admin
      .from('employee_job_application')
      .select(`
        *,
        job_posts!inner(
          job_title,
          business_name,
          location,
          employer_id
        )
      `)
      .eq('job_posts.employer_id', employerId)
      .order('applied_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch applications: ${error.message}`);
    }

    // Transform data and respect privacy settings
    return data.map(app => {
      const transformedApp = {
        ...app,
        job_title: app.job_posts.job_title,
        business_name: app.job_posts.business_name,
        location: app.job_posts.location,
        job_posts: undefined, // Remove nested object
      };

      // Apply privacy controls
      if (!app.show_email) {
        transformedApp.email = '[Hidden by user]';
      }
      if (!app.show_phone) {
        transformedApp.phone = '[Hidden by user]';
      }

      return transformedApp;
    });
  }

  async findOne(id: string, userId: string): Promise<JobApplication> {
    const { data, error } = await this.supabase.admin
      .from('employee_job_application')
      .select(`
        *,
        job_posts!inner(employer_id)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Job application not found');
    }

    // Check if user has permission to view this application
    const isEmployee = data.employee_id === userId;
    const isEmployer = data.job_posts.employer_id === userId;

    if (!isEmployee && !isEmployer) {
      throw new ForbiddenException('Access denied');
    }

    // Apply privacy controls if viewing as employer
    if (isEmployer && !isEmployee) {
      if (!data.show_email) {
        data.email = '[Hidden by user]';
      }
      if (!data.show_phone) {
        data.phone = '[Hidden by user]';
      }
    }

    // Remove nested job_posts object
    const { job_posts, ...applicationData } = data;
    return applicationData;
  }

  async update(id: string, updateDto: UpdateJobApplicationDto, userId: string): Promise<JobApplication> {
    // First check if application exists and get permissions
    const { data: existingApp, error: fetchError } = await this.supabase.admin
      .from('employee_job_application')
      .select(`
        *,
        job_posts!inner(employer_id)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !existingApp) {
      throw new NotFoundException('Job application not found');
    }

    const isEmployee = existingApp.employee_id === userId;
    const isEmployer = existingApp.job_posts.employer_id === userId;

    if (!isEmployee && !isEmployer) {
      throw new ForbiddenException('Access denied');
    }

    // Employees can only update cover message and privacy settings
    // Employers can only update status
    let updateData: any = {};

    if (isEmployee) {
      if (updateDto.cover_message !== undefined) {
        updateData.cover_message = updateDto.cover_message;
      }
      if (updateDto.show_phone !== undefined) {
        updateData.show_phone = updateDto.show_phone;
      }
      if (updateDto.show_email !== undefined) {
        updateData.show_email = updateDto.show_email;
      }
    }

    if (isEmployer && updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No valid fields to update');
    }

    const { data, error } = await this.supabase.admin
      .from('employee_job_application')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update job application: ${error.message}`);
    }

    return data;
  }

  async delete(id: string, employeeId: string): Promise<void> {
    const { data, error } = await this.supabase.admin
      .from('employee_job_application')
      .delete()
      .eq('id', id)
      .eq('employee_id', employeeId);

    if (error) {
      throw new Error(`Failed to delete job application: ${error.message}`);
    }
  }

  async getApplicationsByJobPost(jobPostId: string, employerId: string): Promise<JobApplication[]> {
    // First verify the employer owns this job post
    const { data: jobPost, error: jobError } = await this.supabase.admin
      .from('job_posts')
      .select('employer_id')
      .eq('id', jobPostId)
      .eq('employer_id', employerId)
      .single();

    if (jobError || !jobPost) {
      throw new ForbiddenException('Job post not found or access denied');
    }

    const { data, error } = await this.supabase.admin
      .from('employee_job_application')
      .select('*')
      .eq('job_post_id', jobPostId)
      .order('applied_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch applications: ${error.message}`);
    }

    // Apply privacy controls
    return data.map(app => {
      if (!app.show_email) {
        app.email = '[Hidden by user]';
      }
      if (!app.show_phone) {
        app.phone = '[Hidden by user]';
      }
      return app;
    });
  }
}
