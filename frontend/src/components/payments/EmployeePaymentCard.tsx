import { useState } from 'react';
import { Edit2, Save, X, DollarSign, Clock } from 'lucide-react';
import { EmployeeWithHours, formatCurrency } from '../../lib/payments-api';
import { PaymentWarnings } from './PaymentWarnings';
import { Button } from '../ui/Button';

interface EmployeePaymentCardProps {
  employee: EmployeeWithHours;
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
  onUpdateRate: (employeeId: string, rate: number) => Promise<void>;
  loading?: boolean;
}

export function EmployeePaymentCard({ 
  employee, 
  onSave, 
  onMarkPaid, 
  onUpdateRate,
  loading = false
}: EmployeePaymentCardProps) {
  const [formData, setFormData] = useState({
    advances: employee.advances || 0,
    bonuses: employee.bonuses || 0,
    deductions: employee.deductions || 0,
    rate: employee.currentRate || 0,
    notes: employee.notes || ''
  });
  
  const [showRateEditor, setShowRateEditor] = useState(!employee.currentRate || employee.currentRate <= 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  
  const grossPay = employee.hoursWorked * formData.rate;
  const netPay = grossPay + formData.bonuses - formData.advances - formData.deductions;
  
  const isPaid = employee.paymentRecord?.status === 'paid';
  const hasValidRate = formData.rate > 0;
  const hasHours = employee.hoursWorked > 0;
  const canCalculate = hasValidRate && hasHours;

  const handleSaveRate = async () => {
    if (formData.rate <= 0) return;
    
    try {
      setIsUpdatingRate(true);
      await onUpdateRate(employee.id, formData.rate);
      setShowRateEditor(false);
    } catch (error) {
      console.error('Failed to update rate:', error);
      // Handle error - could show toast or inline error
    } finally {
      setIsUpdatingRate(false);
    }
  };

  const handleSavePayment = async () => {
    if (!canCalculate) return;
    
    try {
      setIsSaving(true);
      await onSave({
        employee_id: employee.id,
        total_hours: employee.hoursWorked,
        hourly_rate: formData.rate,
        advances: formData.advances,
        bonuses: formData.bonuses,
        deductions: formData.deductions,
        notes: formData.notes
      });
    } catch (error) {
      console.error('Failed to save payment:', error);
      // Handle error
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkPaid = async () => {
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
      // Handle error
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Employee Header - Mobile Optimized */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h4 className="text-lg font-semibold text-gray-900 truncate">
              {employee.full_name || 'Unknown Employee'}
            </h4>
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{employee.hoursWorked} hours</span>
              </div>
              {hasValidRate && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>${formData.rate.toFixed(2)}/hr</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            {canCalculate ? (
              <>
                <div className={`text-2xl font-bold ${isPaid ? 'text-green-600' : 'text-blue-600'}`}>
                  {formatCurrency(netPay)}
                </div>
                <div className="text-sm text-gray-600">Net Pay</div>
              </>
            ) : (
              <div className="text-lg font-medium text-gray-400">
                --
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Warnings */}
      <div className="px-4 sm:px-6 pt-4">
        <PaymentWarnings 
          employee={employee}
          hours={employee.hoursWorked}
          rate={formData.rate}
          hasOverlap={employee.hasOverlap}
        />
      </div>

      {/* Rate Editor */}
      {showRateEditor && (
        <div className="px-4 sm:px-6 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <h5 className="font-medium text-blue-900">Set Hourly Rate</h5>
                <p className="text-sm text-blue-700 mt-1">
                  Enter the hourly rate for {employee.full_name}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      rate: parseFloat(e.target.value) || 0 
                    }))}
                    step="0.01"
                    min="0"
                    className="w-24 pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    disabled={loading || isUpdatingRate}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveRate}
                    disabled={formData.rate <= 0 || loading || isUpdatingRate}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  
                  {employee.currentRate && (
                    <button
                      onClick={() => {
                        setShowRateEditor(false);
                        setFormData(prev => ({ ...prev, rate: employee.currentRate || 0 }));
                      }}
                      disabled={loading}
                      className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details */}
      {canCalculate && (
        <div className="p-4 sm:p-6">
          {/* Adjustments Grid - Mobile Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advances
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.advances}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    advances: parseFloat(e.target.value) || 0 
                  }))}
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  disabled={isPaid || loading}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bonuses
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.bonuses}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    bonuses: parseFloat(e.target.value) || 0 
                  }))}
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  disabled={isPaid || loading}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deductions
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.deductions}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    deductions: parseFloat(e.target.value) || 0 
                  }))}
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  disabled={isPaid || loading}
                />
              </div>
            </div>
          </div>

          {/* Pay Calculation Display */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Gross Pay ({employee.hoursWorked} × {formatCurrency(formData.rate)}):</span>
                <span className="font-medium">{formatCurrency(grossPay)}</span>
              </div>
              
              {(formData.bonuses > 0 || formData.advances > 0 || formData.deductions > 0) && (
                <div className="flex justify-between items-center text-gray-600">
                  <span>Adjustments:</span>
                  <span>
                    {formData.bonuses > 0 && `+${formatCurrency(formData.bonuses)}`}
                    {formData.advances > 0 && ` -${formatCurrency(formData.advances)}`}
                    {formData.deductions > 0 && ` -${formatCurrency(formData.deductions)}`}
                  </span>
                </div>
              )}
              
              <div className="border-t pt-2 flex justify-between items-center font-semibold text-base">
                <span>Net Pay:</span>
                <span className={isPaid ? 'text-green-600' : 'text-blue-600'}>
                  {formatCurrency(netPay)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Payment notes, overtime details, etc."
              disabled={isPaid || loading}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="text-sm">
              {isPaid && employee.paymentRecord && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Paid on {new Date(employee.paymentRecord.paid_at!).toLocaleDateString()}
                </span>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              {!hasValidRate && (
                <button
                  onClick={() => setShowRateEditor(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Set Rate
                </button>
              )}

              {hasValidRate && (
                <button
                  onClick={() => setShowRateEditor(true)}
                  disabled={loading}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Rate</span>
                </button>
              )}
              
              <Button
                onClick={handleSavePayment}
                disabled={!canCalculate || isPaid || loading || isSaving}
                variant="outline"
                className="font-medium"
              >
                {isSaving ? 'Saving...' : (employee.paymentRecord?.status === 'calculated' ? 'Update' : 'Save')}
              </Button>
              
              <Button
                onClick={handleMarkPaid}
                disabled={!employee.paymentRecord || isPaid || loading}
                className="bg-green-600 hover:bg-green-700 font-medium"
              >
                {isPaid ? 'Paid ✓' : 'Mark Paid'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
