import { supabase } from './supabase';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface EmployeeRate {
  id: string;
  business_id: string;
  employee_id: string;
  hourly_rate: number;
  effective_from: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  business_id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  hourly_rate: number;
  gross_pay: number;
  advances: number;
  bonuses: number;
  deductions: number;
  net_pay: number;
  status: 'calculated' | 'paid';
  payment_method?: string;
  notes?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentCalculation {
  employee_id: string;
  total_hours: number;
  hourly_rate: number;
  gross_pay: number;
  net_pay: number;
  period_start: string;
  period_end: string;
}

export interface PayrollReport {
  business_id: string;
  period_start: string;
  period_end: string;
  total_paid: number;
  total_hours: number;
  employee_count: number;
  employees: {
    employee_id: string;
    employee_name: string;
    total_hours: number;
    gross_pay: number;
    net_pay: number;
    payment_count: number;
  }[];
  timeline_data?: {
    date: string;
    amount: number;
  }[];
}

export interface EmployeeWithHours {
  id: string;
  full_name: string;
  hoursWorked: number;
  currentRate?: number;
  paymentRecord?: PaymentRecord;
  advances?: number;
  bonuses?: number;
  deductions?: number;
  notes?: string;
  hasOverlap?: boolean;
}

// =====================================================
// API CLIENT FUNCTIONS
// =====================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// =====================================================
// EMPLOYEE RATES API
// =====================================================

export async function getCurrentEmployeeRates(businessId: string): Promise<EmployeeRate[]> {
  return apiRequest(`/payments/rates/${businessId}`);
}

export async function setEmployeeRate(data: {
  business_id: string;
  employee_id: string;
  hourly_rate: number;
  effective_from?: string;
}): Promise<EmployeeRate> {
  return apiRequest('/payments/rates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEmployeeRate(id: string, data: Partial<EmployeeRate>): Promise<EmployeeRate> {
  return apiRequest(`/payments/rates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getRateHistory(businessId: string, employeeId: string): Promise<EmployeeRate[]> {
  return apiRequest(`/payments/rates/${businessId}/history/${employeeId}`);
}

// =====================================================
// PAYMENT RECORDS API
// =====================================================

export async function getPaymentRecords(
  businessId: string,
  filters: {
    start_date?: string;
    end_date?: string;
    employee_id?: string;
  } = {}
): Promise<PaymentRecord[]> {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/payments/records/${businessId}${query}`);
}

export async function createPaymentRecord(data: {
  business_id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  hourly_rate: number;
  advances?: number;
  bonuses?: number;
  deductions?: number;
  notes?: string;
}): Promise<PaymentRecord> {
  return apiRequest('/payments/records', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePaymentRecord(id: string, data: Partial<PaymentRecord>): Promise<PaymentRecord> {
  return apiRequest(`/payments/records/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function markPaymentAsPaid(
  id: string, 
  data: { payment_method: string; notes?: string }
): Promise<PaymentRecord> {
  return apiRequest(`/payments/records/${id}/mark-paid`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deletePaymentRecord(id: string): Promise<void> {
  await apiRequest(`/payments/records/${id}`, { method: 'DELETE' });
}

// =====================================================
// SCHEDULE INTEGRATION API  
// =====================================================

export async function getEmployeeHours(
  businessId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });
  
  return apiRequest(`/payments/hours/${businessId}?${params.toString()}`);
}

export async function calculatePayForPeriod(data: {
  business_id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
}): Promise<PaymentCalculation> {
  return apiRequest('/payments/calculate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// =====================================================
// REPORTS & ANALYTICS API
// =====================================================

export async function getPaymentReports(
  businessId: string,
  startDate: string,
  endDate: string
): Promise<PayrollReport> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });
  
  return apiRequest(`/payments/reports/${businessId}?${params.toString()}`);
}

export async function exportPayrollData(
  businessId: string,
  format: 'csv',
  filters: {
    start_date: string;
    end_date: string;
    employee_id?: string;
  }
): Promise<string> {
  const response = await fetch(`${API_BASE}/payments/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({
      business_id: businessId,
      format,
      ...filters,
    }),
  });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.status}`);
  }

  return response.text();
}

// =====================================================
// BULK OPERATIONS API
// =====================================================

export async function bulkCalculatePayForPeriod(
  businessId: string,
  data: {
    start_date: string;
    end_date: string;
    employee_ids?: string[];
  }
): Promise<{
  business_id: string;
  period: { start_date: string; end_date: string };
  calculations: (PaymentCalculation | { employee_id: string; error: string })[];
}> {
  return apiRequest(`/payments/bulk/calculate/${businessId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function bulkCreatePaymentRecords(
  businessId: string,
  data: {
    start_date: string;
    end_date: string;
    employee_ids?: string[];
    default_adjustments?: {
      advances?: number;
      bonuses?: number;
      deductions?: number;
    };
  }
): Promise<{
  business_id: string;
  period: { start_date: string; end_date: string };
  created_records: PaymentRecord[];
  errors: { employee_id: string; error: string }[];
}> {
  return apiRequest(`/payments/bulk/create-records/${businessId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// =====================================================
// BUSINESS EMPLOYEES API
// =====================================================

export async function getBusinessEmployees(businessId: string): Promise<any[]> {
  return apiRequest(`/businesses/${businessId}/employees`);
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export function downloadCSV(csvData: string, filename: string) {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getDefaultDateRange(): { start: string; end: string } {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  
  return {
    start: sunday.toISOString().split('T')[0],
    end: saturday.toISOString().split('T')[0],
  };
}
