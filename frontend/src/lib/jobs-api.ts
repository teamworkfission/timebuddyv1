import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Job Post Types
export type JobType = 'full-time' | 'part-time';
export type JobStatus = 'draft' | 'published' | 'closed';
export type PayType = 'hourly' | 'salary';
export type SupplementalPayOption = 'bonus' | 'tips' | 'commission';
export type BenefitsOption = 'health_insurance' | '401k' | 'pto';

export interface JobPost {
  id: string;
  business_id: string;
  employer_id: string;
  job_title: string;
  job_type: JobType;
  status: JobStatus;
  business_name: string;
  location: string;
  business_type: string;
  phone: string;
  email?: string;
  expected_hours_per_week?: number;
  schedule?: string;
  pay_type: PayType;
  pay_min: number;
  pay_max?: number;
  pay_currency: string;
  supplemental_pay: SupplementalPayOption[];
  benefits: BenefitsOption[];
  job_description: string;
  language_preference?: string;
  transportation_requirement?: string;
  published_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJobData {
  business_id: string;
  job_title: string;
  job_type: JobType;
  status?: JobStatus;
  business_name: string;
  location: string;
  business_type: string;
  phone: string;
  email?: string;
  expected_hours_per_week: number;
  schedule: string;
  pay_type: PayType;
  pay_min?: number;
  pay_max?: number;
  pay_currency?: string;
  supplemental_pay?: SupplementalPayOption[];
  benefits?: BenefitsOption[];
  job_description: string;
  language_preference?: string;
  transportation_requirement?: string;
}

export interface JobStats {
  total_jobs: number;
  draft_jobs: number;
  published_jobs: number;
  closed_jobs: number;
}

export interface BusinessOption {
  business_id: string;
  name: string;
  type: string;
  location: string;
  phone: string;
  email: string;
}

// Labels for display
export const JOB_TYPE_LABELS: Record<JobType, string> = {
  'full-time': 'Full-Time',
  'part-time': 'Part-Time',
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: 'Draft',
  published: 'Published', 
  closed: 'Closed',
};

export const PAY_TYPE_LABELS: Record<PayType, string> = {
  hourly: 'Hourly',
  salary: 'Salary',
};

export const SUPPLEMENTAL_PAY_LABELS: Record<SupplementalPayOption, string> = {
  bonus: 'Bonus',
  tips: 'Tips', 
  commission: 'Commission',
};

export const BENEFITS_LABELS: Record<BenefitsOption, string> = {
  health_insurance: 'Health Insurance',
  '401k': '401(k)',
  pto: 'Paid Time Off',
};

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session');
  }
  
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export async function createJobPost(jobData: CreateJobData): Promise<JobPost> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(jobData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getJobPosts(status?: JobStatus, businessId?: string): Promise<JobPost[]> {
  const headers = await getAuthHeaders();
  
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (businessId) params.append('business_id', businessId);
  
  const url = `${API_BASE_URL}/jobs${params.toString() ? `?${params.toString()}` : ''}`;
    
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getJobPost(id: string): Promise<JobPost> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/jobs/${id}`, { headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function updateJobPost(id: string, jobData: Partial<CreateJobData>): Promise<JobPost> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(jobData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteJobPost(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }
}

export async function getJobStats(): Promise<JobStats> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/jobs/stats`, { headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getEmployerBusinesses(): Promise<BusinessOption[]> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/jobs/businesses`, { headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get jobs that have applications with specific statuses
 * This is used for Shortlisted and Hired tabs to only show jobs with relevant applications
 */
export async function getJobsWithApplicationStatus(
  applicationStatuses: string[], 
  businessId?: string
): Promise<JobPost[]> {
  const headers = await getAuthHeaders();
  
  const params = new URLSearchParams();
  applicationStatuses.forEach(status => params.append('application_status', status));
  if (businessId) params.append('business_id', businessId);
  
  const url = `${API_BASE_URL}/jobs/with-applications?${params.toString()}`;
    
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}