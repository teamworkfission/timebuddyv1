import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Job Application Types
export interface JobApplicationData {
  job_post_id: string;
  full_name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  short_bio?: string;
  availability?: string;
  skills?: string[];
  transportation?: 'own_car' | 'public_transit' | 'not_needed';
  languages?: string[];
  resume_url?: string;
  show_phone: boolean;
  show_email: boolean;
  cover_message?: string;
  safety_disclaimer_accepted: boolean;
}

export interface JobApplication extends JobApplicationData {
  id: string;
  employee_id: string;
  status: 'applied' | 'reviewed' | 'interviewed' | 'hired' | 'rejected';
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

export interface UpdateJobApplicationData {
  status?: 'applied' | 'reviewed' | 'interviewed' | 'hired' | 'rejected';
  cover_message?: string;
  show_phone?: boolean;
  show_email?: boolean;
}

// Helper to get auth headers
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

// Status labels for display
export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  applied: 'Applied',
  reviewed: 'Under Review',
  interviewed: 'Interviewed',
  hired: 'Hired',
  rejected: 'Rejected',
};

// Transportation labels
export const TRANSPORTATION_LABELS: Record<string, string> = {
  own_car: 'Own Car',
  public_transit: 'Public Transit',
  not_needed: 'Not Needed',
};

/**
 * Create a new job application
 */
export async function createJobApplication(applicationData: JobApplicationData): Promise<JobApplication> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/job-applications`, {
    method: 'POST',
    headers,
    body: JSON.stringify(applicationData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all job applications for current user
 * Returns employee's applications if employee, employer's received applications if employer
 */
export async function getJobApplications(): Promise<JobApplicationWithJobDetails[]> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/job-applications`, { headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get applications for a specific job post (employers only)
 */
export async function getApplicationsByJobPost(jobPostId: string): Promise<JobApplication[]> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/job-applications/job/${jobPostId}`, { headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a specific job application
 */
export async function getJobApplication(id: string): Promise<JobApplication> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/job-applications/${id}`, { headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update a job application
 */
export async function updateJobApplication(id: string, updateData: UpdateJobApplicationData): Promise<JobApplication> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/job-applications/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a job application (employees only)
 */
export async function deleteJobApplication(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/job-applications/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }
}

/**
 * Check if user has already applied to a job
 */
export async function hasAppliedToJob(jobPostId: string): Promise<boolean> {
  try {
    const applications = await getJobApplications();
    return applications.some(app => app.job_post_id === jobPostId);
  } catch (error) {
    console.error('Error checking application status:', error);
    return false;
  }
}

/**
 * Helper function to format application date
 */
export function formatApplicationDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Helper function to get status color class
 */
export function getStatusColorClass(status: string): string {
  switch (status) {
    case 'applied':
      return 'bg-blue-100 text-blue-800';
    case 'reviewed':
      return 'bg-yellow-100 text-yellow-800';
    case 'interviewed':
      return 'bg-purple-100 text-purple-800';
    case 'hired':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
