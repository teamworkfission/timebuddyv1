export interface EmployeeBreakdownDto {
  employee_id: string;
  employee_name: string;
  total_hours: number;
  gross_pay: number;
  total_advances: number;
  total_bonuses: number;
  total_deductions: number;
  net_pay: number;
  final_amount_paid: number;
  payment_records: PaymentRecordBreakdown[];
}

export interface PaymentRecordBreakdown {
  id: string;
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
}

export interface MonthlyBreakdownReport {
  business_id: string;
  period_start: string;
  period_end: string;
  total_paid: number;
  total_hours: number;
  employee_count: number;
  employees: EmployeeBreakdownDto[];
}
