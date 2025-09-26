import { useState } from 'react';
import { Check } from 'lucide-react';
import { EmployeeWithHours, formatCurrency } from '../../lib/payments-api';
import { PaymentWarnings } from './PaymentWarnings';
import { Button } from '../ui/Button';

interface PaymentTableProps {
  employees: EmployeeWithHours[];
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

export function PaymentTable({
  employees,
  onSave,
  onMarkPaid,
  loading = false
}: PaymentTableProps) {
  const [formData, setFormData] = useState<Record<string, EmployeeFormData>>({});
  const [savingEmployees, setSavingEmployees] = useState<Set<string>>(new Set());

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

  const updateEmployeeFormData = (employeeId: string, updates: Partial<EmployeeFormData>) => {
    setFormData(prev => ({
      ...prev,
      [employeeId]: { ...getEmployeeFormData({ id: employeeId } as EmployeeWithHours), ...updates }
    }));
  };

  const handleSave = async (employee: EmployeeWithHours) => {
    const empFormData = getEmployeeFormData(employee);
    
    setSavingEmployees(prev => new Set([...prev, employee.id]));
    
    try {
      await onSave({
        employee_id: employee.id,
        total_hours: employee.hoursWorked,
        hourly_rate: employee.currentRate || 0,
        advances: empFormData.advances,
        bonuses: empFormData.bonuses,
        deductions: empFormData.deductions,
        notes: empFormData.notes
      });
    } catch (error) {
      console.error('Failed to save payment:', error);
    } finally {
      setSavingEmployees(prev => {
        const next = new Set(prev);
        next.delete(employee.id);
        return next;
      });
    }
  };

  const handleMarkPaid = async (employee: EmployeeWithHours) => {
    if (!employee.paymentRecord?.id) return;

    const method = window.prompt(
      'Payment method:\n1. cash\n2. check\n3. bank_transfer\n4. other',
      'cash'
    );

    if (!method) return;

    const validMethods = ['cash', 'check', 'bank_transfer', 'other'];
    const selectedMethod = validMethods.includes(method) ? method : 'cash';

    const notes = window.prompt('Payment notes (optional):') || '';

    try {
      await onMarkPaid(employee.paymentRecord.id, selectedMethod, notes);
    } catch (error) {
      console.error('Failed to mark as paid:', error);
    }
  };

  const calculateNetPay = (employee: EmployeeWithHours, empFormData: EmployeeFormData) => {
    const grossPay = employee.hoursWorked * (employee.currentRate || 0);
    return grossPay + empFormData.bonuses - empFormData.advances - empFormData.deductions;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate/Hr
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Advances
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bonuses
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deductions
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gross Pay
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Pay
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee) => {
              const empFormData = getEmployeeFormData(employee);
              const grossPay = employee.hoursWorked * (employee.currentRate || 0);
              const netPay = calculateNetPay(employee, empFormData);
              const isPaid = employee.paymentRecord?.status === 'paid';
              const isSaving = savingEmployees.has(employee.id);
              const hasValidRate = (employee.currentRate || 0) > 0;

              return (
                <tr key={employee.id} className="hover:bg-gray-50">
                  {/* Employee Name */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {employee.full_name}
                      </div>
                      {employee.paymentRecord?.status === 'paid' && (
                        <div className="text-xs text-green-600 flex items-center">
                          <Check className="w-3 h-3 mr-1" />
                          Paid {employee.paymentRecord.paid_at ? new Date(employee.paymentRecord.paid_at).toLocaleDateString() : ''}
                        </div>
                      )}
                      <PaymentWarnings 
                        employee={employee}
                        hours={employee.hoursWorked}
                        rate={employee.currentRate || 0}
                        hasOverlap={employee.hasOverlap}
                        compact={true}
                      />
                    </div>
                  </td>

                  {/* Hours */}
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-medium text-gray-900">
                      {employee.hoursWorked}
                    </span>
                  </td>

                  {/* Rate/Hr */}
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(employee.currentRate || 0)}
                    </span>
                  </td>

                  {/* Advances */}
                  <td className="px-4 py-4 text-center">
                    <input
                      type="text"
                      value={empFormData.advances === 0 ? '' : empFormData.advances.toString()}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        const numValue = parseFloat(value) || 0;
                        if (numValue >= 0) {
                          updateEmployeeFormData(employee.id, { advances: numValue });
                        }
                      }}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                      disabled={isPaid || loading}
                    />
                  </td>

                  {/* Bonuses */}
                  <td className="px-4 py-4 text-center">
                    <input
                      type="text"
                      value={empFormData.bonuses === 0 ? '' : empFormData.bonuses.toString()}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        const numValue = parseFloat(value) || 0;
                        if (numValue >= 0) {
                          updateEmployeeFormData(employee.id, { bonuses: numValue });
                        }
                      }}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                      disabled={isPaid || loading}
                    />
                  </td>

                  {/* Deductions */}
                  <td className="px-4 py-4 text-center">
                    <input
                      type="text"
                      value={empFormData.deductions === 0 ? '' : empFormData.deductions.toString()}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        const numValue = parseFloat(value) || 0;
                        if (numValue >= 0) {
                          updateEmployeeFormData(employee.id, { deductions: numValue });
                        }
                      }}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                      disabled={isPaid || loading}
                    />
                  </td>

                  {/* Gross Pay */}
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(grossPay)}
                    </span>
                  </td>

                  {/* Net Pay */}
                  <td className="px-4 py-4 text-center">
                    <span className={`text-sm font-bold ${isPaid ? 'text-green-600' : 'text-blue-600'}`}>
                      {formatCurrency(netPay)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex space-x-2 justify-center">
                      <Button
                        onClick={() => handleSave(employee)}
                        disabled={!hasValidRate || isPaid || loading || isSaving}
                        variant="outline"
                        size="sm"
                      >
                        {isSaving ? 'Saving...' : (employee.paymentRecord?.status === 'calculated' ? 'Update' : 'Save')}
                      </Button>
                      
                      <Button
                        onClick={() => handleMarkPaid(employee)}
                        disabled={!employee.paymentRecord || isPaid || loading}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        {isPaid ? 'Paid ✓' : 'Mark Paid'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
