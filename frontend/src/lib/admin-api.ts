import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface AdminBusiness {
  business_id: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  location: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  document_url?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_notes?: string;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  employer_email: string;
}

export interface BusinessStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

// Static admin session for MVP
let adminToken: string | null = null;

async function getAdminHeaders() {
  if (!adminToken) {
    throw new Error('Admin not logged in');
  }
  
  return {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  };
}

export async function adminLogin(username: string, password: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Invalid admin credentials');
  }

  const result = await response.json();
  if (result.success) {
    adminToken = result.token; // Store the simple token
    return true;
  }

  return false;
}

export function adminLogout() {
  adminToken = null;
}

export function isAdminLoggedIn(): boolean {
  return adminToken !== null;
}

export async function getPendingBusinesses(): Promise<AdminBusiness[]> {
  const headers = await getAdminHeaders();
  
  const response = await fetch(`${API_BASE_URL}/admin/businesses/pending`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch pending businesses');
  }

  return response.json();
}

export async function getAllBusinesses(): Promise<AdminBusiness[]> {
  const headers = await getAdminHeaders();
  
  const response = await fetch(`${API_BASE_URL}/admin/businesses`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch businesses');
  }

  return response.json();
}

export async function getBusinessStats(): Promise<BusinessStats> {
  const headers = await getAdminHeaders();
  
  const response = await fetch(`${API_BASE_URL}/admin/businesses/stats`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch business stats');
  }

  return response.json();
}

export async function approveBusiness(businessId: string, notes?: string): Promise<AdminBusiness> {
  const headers = await getAdminHeaders();
  
  const response = await fetch(`${API_BASE_URL}/admin/businesses/${businessId}/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ notes }),
  });

  if (!response.ok) {
    throw new Error('Failed to approve business');
  }

  return response.json();
}

export async function rejectBusiness(businessId: string, notes?: string): Promise<AdminBusiness> {
  const headers = await getAdminHeaders();
  
  const response = await fetch(`${API_BASE_URL}/admin/businesses/${businessId}/reject`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ notes }),
  });

  if (!response.ok) {
    throw new Error('Failed to reject business');
  }

  return response.json();
}

export function getGoogleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function getDocumentUrl(documentUrl?: string): string | null {
  if (!documentUrl) return null;
  
  // If it's already a full URL, return as is
  if (documentUrl.startsWith('http')) {
    return documentUrl;
  }
  
  // Otherwise, it's a Supabase storage path - construct the full URL
  const { data } = supabase.storage.from('business-documents').getPublicUrl(documentUrl);
  return data.publicUrl;
}
