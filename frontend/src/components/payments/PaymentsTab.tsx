import { useState, useEffect } from 'react';
import { AlertCircle, Users, Calculator, RefreshCw } from 'lucide-react';
import { Business } from '../../lib/business-api';
import { 
  EmployeeWithHours, 
  getCurrentEmployeeRates,
  getDetailedEmployeeHours,
  getPaymentRecords,
  createPaymentRecord,
  updatePaymentRecord,
  markPaymentAsPaid,
  getDefaultDateRange,
  getBusinessEmployees
} from '../../lib/payments-api';
import { DateRangePicker } from './DateRangePicker';
import { EnhancedPaymentTable } from './EnhancedPaymentTable';
import { SuccessMessage } from './PaymentWarnings';
import { Button } from '../ui/Button';

interface PaymentsTabProps {
  business: Business;
}

export function PaymentsTab({ business }: PaymentsTabProps) {
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [employees, setEmployees] = useState<EmployeeWithHours[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load payment data for the selected period
  const loadPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all required data in parallel
      const [detailedHours, currentRates, existingPayments, businessEmployees] = await Promise.all([
        getDetailedEmployeeHours(business.business_id, dateRange.start, dateRange.end),
        getCurrentEmployeeRates(business.business_id),
        getPaymentRecords(business.business_id, { start_date: dateRange.start, end_date: dateRange.end }),
        // Fetch business employees using correct API
        getBusinessEmployees(business.business_id)
      ]);

      // Combine data for UI
      const employeesWithData = combineEmployeeData(
        businessEmployees,
        detailedHours,
        currentRates,
        existingPayments
      );

      setEmployees(employeesWithData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load payment data';
      setError(errorMessage);
      console.error('Payment data loading error:', err);
    } finally {
      setLoading(false);
    }
  };


  // Combine employee data with hours, rates, and payment records
  const combineEmployeeData = (
    businessEmployees: any[],
    detailedHours: Record<string, { confirmed: number | null, calculated: number, source: 'confirmed' | 'calculated' }>,
    rates: any[],
    paymentRecords: any[]
  ): EmployeeWithHours[] => {
    // Get all unique employee IDs from business employees and payment records
    const employeeMap = new Map();
    
    // Add business employees
    businessEmployees.forEach(employeeAssociation => {
      const emp = employeeAssociation.employee;
      employeeMap.set(emp.id, emp);
    });
    
    // Add employees from payment records (in case they have payment records but aren't in business employees)
    paymentRecords.forEach(record => {
      if (!employeeMap.has(record.employee_id)) {
        employeeMap.set(record.employee_id, {
          id: record.employee_id,
          full_name: `Employee ${record.employee_id.slice(0, 8)}` // Fallback name
        });
      }
    });

    return Array.from(employeeMap.values()).map(emp => {
      const employeeId = emp.id;
      
      // Get hours breakdown from detailed hours
      const hoursBreakdown = detailedHours[employeeId];
      const confirmedHours = hoursBreakdown?.confirmed || null;
      const calculatedHours = hoursBreakdown?.calculated || 0;
      const hoursSource = hoursBreakdown?.source || 'calculated';
      
      // Use confirmed hours if available, otherwise use calculated hours
      const finalHours = confirmedHours !== null ? confirmedHours : calculatedHours;
      
      // Get current payment record for this period
      const paymentRecord = paymentRecords.find(record => 
        record.employee_id === employeeId &&
        record.period_start === dateRange.start &&
        record.period_end === dateRange.end
      );
      
      // Use hours from payment record if available, otherwise use hours breakdown
      const hoursWorked = paymentRecord?.total_hours || finalHours;
      
      const currentRate = rates.find(rate => rate.employee_id === employeeId);

      // Check if there's a discrepancy between confirmed and calculated hours
      const hasDiscrepancy = confirmedHours !== null && calculatedHours > 0 && 
                           Math.abs(confirmedHours - calculatedHours) > 0.25; // 15-minute threshold

      // Check for overlapping periods
      const hasOverlap = paymentRecords.some(record => 
        record.employee_id === employeeId &&
        record.status === 'paid' &&
        (record.period_start !== dateRange.start || record.period_end !== dateRange.end) &&
        (
          (new Date(record.period_start) <= new Date(dateRange.end) && 
           new Date(record.period_end) >= new Date(dateRange.start))
        )
      );

      return {
        id: employeeId,
        full_name: emp.full_name || 'Unknown Employee',
        hoursWorked,
        currentRate: currentRate?.hourly_rate || 0,
        paymentRecord,
        advances: paymentRecord?.advances || 0,
        bonuses: paymentRecord?.bonuses || 0,
        deductions: paymentRecord?.deductions || 0,
        notes: paymentRecord?.notes || '',
        hasOverlap,
        // Confirmed hours support
        confirmedHours,
        calculatedHours,
        hoursSource,
        hasDiscrepancy
      };
    }).filter(emp => emp.hoursWorked > 0 || emp.paymentRecord); // Show employees with hours or existing payment records
  };

  // Handle saving payment record
  const handleSavePayment = async (paymentData: {
    employee_id: string;
    total_hours: number;
    hourly_rate: number;
    advances: number;
    bonuses: number;
    deductions: number;
    notes: string;
  }) => {
    try {
      const employee = employees.find(emp => emp.id === paymentData.employee_id);
      if (!employee) throw new Error('Employee not found');

      const recordData = {
        business_id: business.business_id,
        period_start: dateRange.start,
        period_end: dateRange.end,
        ...paymentData
      };

      if (employee.paymentRecord) {
        // Update existing record
        await updatePaymentRecord(employee.paymentRecord.id, recordData);
        setSuccess('Payment record updated successfully');
      } else {
        // Create new record
        await createPaymentRecord(recordData);
        setSuccess('Payment record created successfully');
      }

      // Reload data to reflect changes
      await loadPaymentData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save payment';
      setError(errorMessage);
    }
  };

  // Handle marking payment as paid
  const handleMarkAsPaid = async (recordId: string, method: string, notes?: string) => {
    try {
      await markPaymentAsPaid(recordId, { payment_method: method, notes });
      setSuccess('Payment marked as paid successfully');
      
      // Reload data to reflect changes
      await loadPaymentData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark payment as paid';
      setError(errorMessage);
    }
  };


  // Load data when component mounts or date range changes
  useEffect(() => {
    loadPaymentData();
  }, [dateRange]);

  const employeesWithHours = employees.filter(emp => emp.hoursWorked > 0);
  const employeesWithoutHours = employees.filter(emp => emp.hoursWorked === 0);
  const totalHours = Math.round(employees.reduce((sum, emp) => sum + emp.hoursWorked, 0) * 100) / 100;
  const totalPaid = employees.reduce((sum, emp) => {
    if (emp.paymentRecord && emp.paymentRecord.status === 'paid') {
      return sum + emp.paymentRecord.net_pay;
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <DateRangePicker 
          value={dateRange}
          onChange={setDateRange}
          onApply={loadPaymentData}
          label="Pay Period"
        />
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <h4 className="text-red-800 font-medium">Error</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <SuccessMessage>
          <p className="font-medium">{success}</p>
        </SuccessMessage>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600 mt-2">Loading payment data...</p>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && employees.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{employees.length}</div>
                <div className="text-sm text-blue-700">Employees</div>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calculator className="w-8 h-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{formatHours(totalHours)}</div>
                <div className="text-sm text-purple-700">Total Hours</div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
            <div className="text-sm text-green-700">Total Paid</div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">
              {employees.filter(emp => emp.paymentRecord?.status === 'calculated').length}
            </div>
            <div className="text-sm text-amber-700">Pending Payments</div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Button
            onClick={loadPaymentData}
            disabled={loading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
        
        {employeesWithHours.length > 0 && (
          <div className="text-sm text-gray-600">
            Showing {employeesWithHours.length} employees with scheduled hours
          </div>
        )}
      </div>

      {/* Employee Payments Table */}
      <div className="space-y-6">
        {employeesWithHours.length > 0 ? (
          <>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Employee Payments ({employeesWithHours.length})</span>
            </h3>
            
            <EnhancedPaymentTable 
              employees={employeesWithHours}
              businessId={business.business_id}
              dateRange={dateRange}
              onSave={handleSavePayment}
              onMarkPaid={handleMarkAsPaid}
              loading={loading}
            />
          </>
        ) : !loading && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-lg font-medium text-gray-900 mt-4">No Scheduled Hours</h3>
            <p className="text-gray-600 mt-2">
              No employees have scheduled hours for this period. 
              Make sure schedules are posted and try a different date range.
            </p>
          </div>
        )}

        {/* Employees without hours */}
        {employeesWithoutHours.length > 0 && (
          <details className="mt-8">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Employees without hours ({employeesWithoutHours.length})
            </summary>
            <div className="mt-4 space-y-2">
              {employeesWithoutHours.map(employee => (
                <div key={employee.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{employee.full_name}</span>
                  <span className="text-sm text-gray-600">0 hours scheduled</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
