import { supabase } from './supabase';

export interface CreateSupportTicketDto {
  issue_type: 'technical' | 'general' | 'fraud_report' | 'other';
  subject: string;
  description: string;
  screenshot_url?: string;
}

export interface SupportTicket {
  id: string;
  issue_type: string;
  subject: string;
  description: string;
  screenshot_url?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  admin_notes?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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

async function getFormDataAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session');
  }
  
  return {
    'Authorization': `Bearer ${session.access_token}`,
    // Don't set Content-Type for FormData, let browser set it with boundary
  };
}

export async function createSupportTicket(ticketData: CreateSupportTicketDto): Promise<any> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/support/tickets`, {
    method: 'POST',
    headers,
    body: JSON.stringify(ticketData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create support ticket: ${response.statusText}`);
  }

  return response.json();
}

export async function getUserSupportTickets(): Promise<SupportTicket[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/support/tickets`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch support tickets: ${response.statusText}`);
  }

  return response.json();
}

export async function uploadScreenshot(file: File): Promise<{ screenshot_url: string }> {
  const formData = new FormData();
  formData.append('screenshot', file);

  const headers = await getFormDataAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/support/upload-screenshot`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to upload screenshot: ${response.statusText}`);
  }

  return response.json();
}

export interface CreateSupportTicketWithFileDto {
  issue_type: 'technical' | 'general' | 'fraud_report' | 'other';
  subject: string;
  description: string;
}

export async function createSupportTicketWithFile(
  ticketData: CreateSupportTicketWithFileDto, 
  screenshotFile?: File
): Promise<any> {
  const formData = new FormData();
  formData.append('issue_type', ticketData.issue_type);
  formData.append('subject', ticketData.subject);
  formData.append('description', ticketData.description);
  
  if (screenshotFile) {
    formData.append('screenshot', screenshotFile);
  }

  const headers = await getFormDataAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/support/tickets-with-file`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create support ticket: ${response.statusText}`);
  }

  return response.json();
}
