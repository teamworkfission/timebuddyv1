import React, { useState } from 'react';
import { Check, AlertTriangle, Clock, CheckCircle, Users } from 'lucide-react';
import { EmployeeWithHours, formatCurrency } from '../../lib/payments-api';
import { 
  getEmployerConfirmedHoursList, 
  approveConfirmedHours, 
  ConfirmedHoursRecord 
} from '../../lib/confirmed-hours-api';
import { Button } from '../ui/Button';

interface EnhancedPaymentTableProps {
  employees: EmployeeWithHours[];
  businessId: string;
  dateRange: { start: string; end: string };
  onSave: (paymentData: {
    employee_id: string;
    total_hours: number;
    hourly_rate: number;
    advances: number;
    bonuses: number;
    deductions: number;
    notes: string;
  }) => Promise<void>;
  onMarkPaid: (recordId: string, method: string, notes?: string) => Promise<void>;
  loading?: boolean;
}

interface EmployeeFormData {
  advances: number;
  bonuses: number;
  deductions: number;
  notes: string;
}

export function EnhancedPaymentTable({
  employees,
  businessId,
  dateRange,
  onSave,
  onMarkPaid,
  loading = false
}: EnhancedPaymentTableProps) {
  const [formData, setFormData] = useState<Record<string, EmployeeFormData>>({});
  const [savingEmployees, setSavingEmployees] = useState<Set<string>>(new Set());
  const [pendingHours, setPendingHours] = useState<ConfirmedHoursRecord[]>([]);
  const [approvingHours, setApprovingHours] = useState<Set<string>>(new Set());
  const [showPendingApprovals, setShowPendingApprovals] = useState(false);

  // Load pending hour approvals
  const loadPendingApprovals = async () => {
    try {
      const pending = await getEmployerConfirmedHoursList(businessId, 'submitted');
      setPendingHours(pending.filter(h => 
        h.week_start_date >= dateRange.start && h.week_start_date <= dateRange.end
      ));
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
    }
  };

  // Initialize form data for an employee
  const getEmployeeFormData = (employee: EmployeeWithHours): EmployeeFormData => {
    if (!formData[employee.id]) {
      return {
        advances: employee.advances || 0,
        bonuses: employee.bonuses || 0,
        deductions: employee.deductions || 0,
        notes: employee.notes || ''
      };
    }
    return formData[employee.id];
  };

  // Update form data for an employee
  const updateEmployeeFormData = (employeeId: string, field: keyof EmployeeFormData, value: number | string) => {
    setFormData(prev => ({
      ...prev,
      [employeeId]: {
        ...getEmployeeFormData({ id: employeeId } as EmployeeWithHours),
        [field]: value
      }
    }));
  };

  // Save payment record for employee
  const handleSaveEmployee = async (employee: EmployeeWithHours) => {
    const employeeFormData = getEmployeeFormData(employee);
    
    setSavingEmployees(prev => new Set(prev).add(employee.id));
    
    try {
      await onSave({
        employee_id: employee.id,
        total_hours: employee.hoursWorked,
        hourly_rate: employee.currentRate || 0,
        advances: employeeFormData.advances,
        bonuses: employeeFormData.bonuses,
        deductions: employeeFormData.deductions,
        notes: employeeFormData.notes
      });
    } finally {
      setSavingEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(employee.id);
        return newSet;
      });
    }
  };

  // Approve submitted hours
  const handleApproveHours = async (hoursRecord: ConfirmedHoursRecord) => {
    setApprovingHours(prev => new Set(prev).add(hoursRecord.id));
    
    try {
      await approveConfirmedHours(hoursRecord.id, 'Approved by employer');
      // Reload pending approvals
      await loadPendingApprovals();
      // TODO: Refresh parent component data
    } catch (error) {
      console.error('Failed to approve hours:', error);
    } finally {
      setApprovingHours(prev => {
        const newSet = new Set(prev);
        newSet.delete(hoursRecord.id);
        return newSet;
      });
    }
  };

  // Calculate payment amounts
  const calculatePayment = (employee: EmployeeWithHours, formData: EmployeeFormData) => {
    const grossPay = employee.hoursWorked * (employee.currentRate || 0);
    const netPay = grossPay + formData.bonuses - formData.advances - formData.deductions;
    return { grossPay, netPay };
  };

  // Get hours display with comparison
  const getHoursDisplay = (employee: EmployeeWithHours) => {
    if (employee.hoursSource === 'confirmed' && employee.hasDiscrepancy) {
      return (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <span className="font-medium text-green-600">{employee.confirmedHours}h</span>
            <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
            <span className="text-xs text-gray-500 ml-1">confirmed</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <span>vs {employee.calculatedHours}h scheduled</span>
            <AlertTriangle className="h-3 w-3 text-amber-500 ml-1" />
          </div>
        </div>
      );
    }

    if (employee.hoursSource === 'confirmed') {
      return (
        <div className="flex items-center">
          <span className="font-medium text-green-600">{employee.confirmedHours}h</span>
          <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
          <span className="text-xs text-gray-500 ml-1">confirmed</span>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <span className="text-gray-700">{employee.hoursWorked}h</span>
        <Clock className="h-4 w-4 text-gray-400 ml-1" />
        <span className="text-xs text-gray-500 ml-1">calculated</span>
      </div>
    );
  };

  // Load pending approvals on component mount
  React.useEffect(() => {
    loadPendingApprovals();
  }, [businessId, dateRange]);

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <div className="text-gray-400 mb-4">
          <Users className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees Found</h3>
        <p className="text-gray-500">
          No employees have worked hours during this period, or there may be an issue loading the data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals Section */}
      {pendingHours.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
              <h3 className="text-sm font-medium text-amber-800">
                Pending Hour Approvals ({pendingHours.length})
              </h3>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPendingApprovals(!showPendingApprovals)}
            >
              {showPendingApprovals ? 'Hide' : 'Show'} Pending
            </Button>
          </div>
          
          {showPendingApprovals && (
            <div className="space-y-2">
              {pendingHours.map((hours) => (
                <div key={hours.id} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      Employee ID: {hours.employee_id.slice(0, 8)}...
                    </div>
                    <div className="text-xs text-gray-600">
                      Week: {new Date(hours.week_start_date).toLocaleDateString()} • 
                      Total: {hours.total_hours}h
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApproveHours(hours)}
                    loading={approvingHours.has(hours.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Pay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adjustments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Pay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => {
                const employeeFormData = getEmployeeFormData(employee);
                const { grossPay, netPay } = calculatePayment(employee, employeeFormData);
                const isSaving = savingEmployees.has(employee.id);

                return (
                  <tr key={employee.id} className={employee.hasDiscrepancy ? 'bg-amber-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {employee.full_name}
                        </div>
                        {employee.hasOverlap && (
                          <div className="text-xs text-red-500 flex items-center mt-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Overlapping periods detected
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getHoursDisplay(employee)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(employee.currentRate || 0)}/hr
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(grossPay)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Advances:</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={employeeFormData.advances}
                            onChange={(e) => updateEmployeeFormData(employee.id, 'advances', parseFloat(e.target.value) || 0)}
                            disabled={employee.paymentRecord?.status === 'paid' || isSaving}
                            className="w-16 px-1 py-0.5 text-right border rounded text-xs"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Bonuses:</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={employeeFormData.bonuses}
                            onChange={(e) => updateEmployeeFormData(employee.id, 'bonuses', parseFloat(e.target.value) || 0)}
                            disabled={employee.paymentRecord?.status === 'paid' || isSaving}
                            className="w-16 px-1 py-0.5 text-right border rounded text-xs"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Deductions:</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={employeeFormData.deductions}
                            onChange={(e) => updateEmployeeFormData(employee.id, 'deductions', parseFloat(e.target.value) || 0)}
                            disabled={employee.paymentRecord?.status === 'paid' || isSaving}
                            className="w-16 px-1 py-0.5 text-right border rounded text-xs"
                          />
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(netPay)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.paymentRecord?.status === 'paid' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Calculated
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {employee.paymentRecord?.status !== 'paid' && (
                        <Button
                          size="sm"
                          onClick={() => handleSaveEmployee(employee)}
                          loading={isSaving}
                          disabled={loading}
                        >
                          Save
                        </Button>
                      )}
                      
                      {employee.paymentRecord && employee.paymentRecord.status !== 'paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMarkPaid(employee.paymentRecord!.id, 'bank_transfer')}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
