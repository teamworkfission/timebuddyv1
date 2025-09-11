import { supabase } from './supabase';

const API_BASE_URL = 'http://localhost:3001';

export interface Business {
  business_id: string;
  employer_id: string;
  name: string;
  type: BusinessType;
  email: string;
  phone: string;
  location: string;
  total_employees: number;
  created_at: string;
  updated_at: string;
}

export type BusinessType = 
  | 'restaurant'
  | 'gas_station'
  | 'retail_store'
  | 'grocery_store'
  | 'convenience_store'
  | 'pharmacy'
  | 'coffee_shop'
  | 'fast_food'
  | 'delivery_service'
  | 'warehouse'
  | 'office'
  | 'other';

export interface CreateBusinessData {
  name: string;
  type: BusinessType;
  email: string;
  phone: string;
  location: string;
  total_employees: number;
}

export interface BusinessStats {
  total_businesses: number;
  total_employees: number;
}

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  restaurant: 'Restaurant',
  gas_station: 'Gas Station',
  retail_store: 'Retail Store',
  grocery_store: 'Grocery Store',
  convenience_store: 'Convenience Store',
  pharmacy: 'Pharmacy',
  coffee_shop: 'Coffee Shop',
  fast_food: 'Fast Food',
  delivery_service: 'Delivery Service',
  warehouse: 'Warehouse',
  office: 'Office',
  other: 'Other',
};

export const BUSINESS_TYPES: BusinessType[] = Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[];

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

export async function createBusiness(businessData: CreateBusinessData): Promise<Business> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/businesses`, {
    method: 'POST',
    headers,
    body: JSON.stringify(businessData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getBusinesses(): Promise<Business[]> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/businesses`, {
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getBusiness(id: string): Promise<Business> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/businesses/${id}`, {
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function updateBusiness(id: string, businessData: Partial<CreateBusinessData>): Promise<Business> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/businesses/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(businessData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteBusiness(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/businesses/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }
}

export async function getBusinessStats(): Promise<BusinessStats> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/businesses/stats`, {
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
