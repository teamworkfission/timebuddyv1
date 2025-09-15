// Employee API Client
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

export interface CreateEmployeeData {
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
}

export type UpdateEmployeeData = Partial<CreateEmployeeData>;

// Transportation options for form
export const TRANSPORTATION_OPTIONS = [
  { value: 'own_car', label: 'Own Car' },
  { value: 'public_transit', label: 'Public Transit' },
  { value: 'not_needed', label: 'Not Needed' }
] as const;

// Common skill options
export const COMMON_SKILLS = [
  'Customer Service',
  'Food Service',
  'Retail',
  'Driving',
  'Cleaning',
  'Warehouse',
  'Delivery',
  'Cash Handling',
  'Communication',
  'Teamwork',
  'Time Management',
  'Problem Solving'
];

// Common language options
export const COMMON_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'Chinese',
  'Arabic',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Hindi'
];

// Authentication helper function (matching other APIs)
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

class EmployeesApiClient {

  async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create employee profile' }));
      throw new Error(error.message || 'Failed to create employee profile');
    }

    return response.json();
  }

  async getProfile(): Promise<Employee> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/employees/profile`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch employee profile' }));
      throw new Error(error.message || 'Failed to fetch employee profile');
    }

    return response.json();
  }

  async updateProfile(data: UpdateEmployeeData): Promise<Employee> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/employees/profile`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update employee profile' }));
      throw new Error(error.message || 'Failed to update employee profile');
    }

    return response.json();
  }

  async deleteProfile(): Promise<void> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/employees/profile`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete employee profile' }));
      throw new Error(error.message || 'Failed to delete employee profile');
    }
  }

  async createOrUpdateProfile(data: CreateEmployeeData): Promise<Employee> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/employees/profile/create-or-update`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to save employee profile' }));
      throw new Error(error.message || 'Failed to save employee profile');
    }

    return response.json();
  }
}

// Export singleton instance
export const employeesApi = new EmployeesApiClient();
