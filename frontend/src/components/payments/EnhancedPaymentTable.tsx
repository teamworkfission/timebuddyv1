import React, { useState } from 'react';
import { Check, AlertTriangle, Clock, CheckCircle, Users, X } from 'lucide-react';
import { EmployeeWithHours, formatCurrency } from '../../lib/payments-api';
import { 
  getEmployerConfirmedHoursList, 
  approveConfirmedHours, 
  rejectConfirmedHours,
  ConfirmedHoursRecord,
  formatWeekRange
} from '../../lib/confirmed-hours-api';
import { Button } from '../ui/Button';
import { RejectionModal } from './RejectionModal';

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
  const [rejectingHours, setRejectingHours] = useState<Set<string>>(new Set());
  const [showPendingApprovals, setShowPendingApprovals] = useState(false);
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    record: ConfirmedHoursRecord | null;
    employeeName: string;
  }>({
    isOpen: false,
    record: null,
    employeeName: ''
  });

  // Load pending hour approvals
  const loadPendingApprovals = async () => {
    try {
      const pending = await getEmployerConfirmedHoursList(businessId, 'submitted');
      
      // Filter by American week pattern (Sunday to Saturday)
      // Include weeks that fall within the payment period
      setPendingHours(pending.filter(h => {
        const weekStartDate = h.week_start_date; // Already in YYYY-MM-DD format
        return weekStartDate >= dateRange.start && weekStartDate <= dateRange.end;
      }));
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
    }
  };

  // Aggregate pending hours by employee for the pay period
  const aggregatedPendingHours = pendingHours.reduce((acc, record) => {
    const employeeId = record.employee_id;
    if (!acc[employeeId]) {
      acc[employeeId] = {
        employee_id: employeeId,
        records: [],
        total_hours: 0
      };
    }
    acc[employeeId].records.push(record);
    acc[employeeId].total_hours += record.total_hours;
    return acc;
  }, {} as Record<string, { employee_id: string; records: ConfirmedHoursRecord[]; total_hours: number }>);

  const pendingApprovalsList = Object.values(aggregatedPendingHours);

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

  // Open rejection modal
  const handleOpenRejectModal = (hoursRecord: ConfirmedHoursRecord) => {
    // Get employee name from the aggregated data
    const employeeName = `Employee ${hoursRecord.employee_id.slice(0, 8)}...`;
    
    setRejectionModal({
      isOpen: true,
      record: hoursRecord,
      employeeName
    });
  };

  // Handle rejection
  const handleRejectHours = async (reason: string, notes?: string) => {
    if (!rejectionModal.record) return;

    const recordId = rejectionModal.record.id;
    setRejectingHours(prev => new Set(prev).add(recordId));
    
    try {
      await rejectConfirmedHours(recordId, reason, notes);
      // Reload pending approvals
      await loadPendingApprovals();
      // Close modal
      setRejectionModal({ isOpen: false, record: null, employeeName: '' });
      // TODO: Refresh parent component data
    } catch (error) {
      console.error('Failed to reject hours:', error);
      throw error; // Re-throw to let modal handle the error display
    } finally {
      setRejectingHours(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    }
  };

  // Close rejection modal
  const handleCloseRejectModal = () => {
    setRejectionModal({ isOpen: false, record: null, employeeName: '' });
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
      {pendingApprovalsList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-amber-800">
                  Pending Hour Approvals ({pendingApprovalsList.length} employee{pendingApprovalsList.length !== 1 ? 's' : ''})
                </h3>
                <p className="text-xs text-amber-700 mt-1">
                  Employee-submitted standard hours waiting for approval. Once approved, these will be used for payment calculations.
                </p>
              </div>
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
              {pendingApprovalsList.map((employeePending) => (
                <div key={employeePending.employee_id} className="bg-white p-3 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        Employee ID: {employeePending.employee_id.slice(0, 8)}...
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="bg-blue-100 px-2 py-1 rounded text-blue-800 font-medium">
                          Standard Hours: {employeePending.total_hours}h
                        </span>
                        {employeePending.records.length > 1 && (
                          <span className="ml-2">({employeePending.records.length} weeks)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {employeePending.records.map((record) => (
                        <div key={record.id} className="flex space-x-1">
                          <Button
                            size="sm"
                            onClick={() => handleApproveHours(record)}
                            loading={approvingHours.has(record.id)}
                            disabled={rejectingHours.has(record.id)}
                            className="bg-green-600 hover:bg-green-700"
                            title={`Approve week of ${new Date(record.week_start_date + 'T00:00:00').toLocaleDateString()} (${record.total_hours}h)`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {employeePending.records.length === 1 ? 'Approve' : `${record.total_hours}h`}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenRejectModal(record)}
                            loading={rejectingHours.has(record.id)}
                            disabled={approvingHours.has(record.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            title={`Reject week of ${new Date(record.week_start_date + 'T00:00:00').toLocaleDateString()} (${record.total_hours}h)`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {employeePending.records.length > 1 && (
                    <div className="text-xs text-gray-500 border-t pt-2">
                      Weekly breakdown: {employeePending.records.map(r => 
                        `${new Date(r.week_start_date + 'T00:00:00').toLocaleDateString()}: ${r.total_hours}h`
                      ).join(', ')}
                    </div>
                  )}
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

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={rejectionModal.isOpen}
        onClose={handleCloseRejectModal}
        onReject={handleRejectHours}
        employeeName={rejectionModal.employeeName}
        hoursAmount={rejectionModal.record?.total_hours}
        weekRange={rejectionModal.record ? formatWeekRange(rejectionModal.record.week_start_date) : undefined}
        loading={rejectionModal.record ? rejectingHours.has(rejectionModal.record.id) : false}
      />
    </div>
  );
}
