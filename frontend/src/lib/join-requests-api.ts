// Join Requests API Client
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface JoinRequest {
  id: string;
  business_id: string;
  employee_gid: string;
  employer_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  created_at: string;
  updated_at: string;
  business_name?: string;
  employee_name?: string;
}

export interface CreateJoinRequestData {
  business_id: string;
  employee_gid: string;
  message?: string;
}

export interface UpdateJoinRequestData {
  status: 'accepted' | 'declined';
}

class JoinRequestsApi {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Send a join request to an employee (Employer only)
   */
  async sendJoinRequest(data: CreateJoinRequestData): Promise<JoinRequest> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/join-requests`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to send join request: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get join requests sent by the employer
   */
  async getEmployerJoinRequests(): Promise<JoinRequest[]> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/join-requests/sent`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch sent join requests: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get join requests received by the employee
   */
  async getEmployeeJoinRequests(): Promise<JoinRequest[]> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/join-requests/received`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch received join requests: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Respond to a join request (Employee only)
   */
  async respondToJoinRequest(requestId: string, data: UpdateJoinRequestData): Promise<JoinRequest> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/join-requests/${requestId}/respond`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to respond to join request: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Cancel a join request (Employer only)
   */
  async cancelJoinRequest(requestId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/join-requests/${requestId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to cancel join request: ${response.statusText}`);
    }
  }
}

export const joinRequestsApi = new JoinRequestsApi();
