const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Public Job Search Types
export interface PublicJobPost {
  id: string;
  job_title: string;
  business_name: string;
  location: string;
  job_type: string;
  pay_type: string;
  pay_min: number;
  pay_max?: number;
  pay_currency: string;
  expected_hours_per_week?: number;
  schedule?: string;
  supplemental_pay: string[];
  benefits: string[];
  job_description: string;
  business_type: string;
  language_preference?: string;
  transportation_requirement?: string;
  phone: string;
  email?: string;
  published_at: string;
  created_at: string;
}

export interface JobSearchResponse {
  jobs: PublicJobPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LocationOption {
  name: string;
  job_count: number;
}

export interface JobSearchParams {
  keywords?: string;
  state?: string;
  city?: string;
  county?: string;
  page?: number;
  limit?: number;
}

// Search published jobs (no auth required)
export async function searchPublicJobs(params: JobSearchParams): Promise<JobSearchResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.keywords) searchParams.set('keywords', params.keywords);
  if (params.state) searchParams.set('state', params.state);
  if (params.city) searchParams.set('city', params.city);
  if (params.county) searchParams.set('county', params.county);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const response = await fetch(`${API_BASE_URL}/jobs/public/search?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Get a specific published job (no auth required)
export async function getPublicJob(id: string): Promise<PublicJobPost> {
  const response = await fetch(`${API_BASE_URL}/jobs/public/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Get states with available jobs
export async function getStatesWithJobs(): Promise<LocationOption[]> {
  const response = await fetch(`${API_BASE_URL}/jobs/locations/states`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Get cities with jobs in a specific state
export async function getCitiesWithJobs(state: string): Promise<LocationOption[]> {
  const response = await fetch(`${API_BASE_URL}/jobs/locations/cities/${encodeURIComponent(state)}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Get counties with jobs in a specific state and city
export async function getCountiesWithJobs(state: string, city: string): Promise<LocationOption[]> {
  const response = await fetch(`${API_BASE_URL}/jobs/locations/counties/${encodeURIComponent(state)}/${encodeURIComponent(city)}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Helper functions for display
export function formatPayRange(job: PublicJobPost): string {
  const { pay_min, pay_max, pay_type, pay_currency } = job;
  const symbol = pay_currency === 'USD' ? '$' : pay_currency;
  
  if (pay_max && pay_max > pay_min) {
    return `${symbol}${pay_min}-${pay_max}/${pay_type === 'hourly' ? 'hr' : 'year'}`;
  } else {
    return `${symbol}${pay_min}/${pay_type === 'hourly' ? 'hr' : 'year'}`;
  }
}

export function formatHoursPerWeek(hours?: number): string {
  if (!hours) return '';
  return `${hours} hours/week`;
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
}

export function formatLocation(location: string): { city: string; state: string; county?: string } {
  const parts = location.split(',').map(p => p.trim());
  
  if (parts.length === 2) {
    return { city: parts[0], state: parts[1] };
  } else if (parts.length === 3) {
    return { city: parts[0], county: parts[1], state: parts[2] };
  } else {
    return { city: location, state: '' };
  }
}
