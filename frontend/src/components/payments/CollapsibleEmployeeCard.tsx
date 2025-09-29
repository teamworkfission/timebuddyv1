import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, DollarSign, TrendingUp, TrendingDown, Calendar, CreditCard } from 'lucide-react';
import { EmployeeBreakdown, PaymentRecordBreakdown, formatCurrency } from '../../lib/payments-api';
import { formatHours } from '../../lib/confirmed-hours-api';
import { formatWeekRange } from '../../lib/date-utils';

interface CollapsibleEmployeeCardProps {
  employee: EmployeeBreakdown;
}

export function CollapsibleEmployeeCard({ employee }: CollapsibleEmployeeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const hasAdjustments = employee.total_advances > 0 || employee.total_bonuses > 0 || employee.total_deductions > 0;
  const paidRecordsCount = employee.payment_records.filter(record => record.status === 'paid').length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Clickable Header */}
      <div 
        className="p-4 sm:p-6 cursor-pointer"
        onClick={toggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-semibold text-gray-900 truncate">
                  {employee.employee_name}
                </h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatHours(employee.total_hours)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatCurrency(employee.gross_pay)} gross</span>
                  </div>
                  {hasAdjustments && (
                    <div className="flex items-center space-x-1">
                      {employee.total_bonuses > employee.total_advances + employee.total_deductions ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">+{formatCurrency(employee.total_bonuses - employee.total_advances - employee.total_deductions)}</span>
                        </>
                      ) : employee.total_bonuses < employee.total_advances + employee.total_deductions ? (
                        <>
                          <TrendingDown className="w-4 h-4 text-red-600" />
                          <span className="text-red-600">-{formatCurrency(employee.total_advances + employee.total_deductions - employee.total_bonuses)}</span>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(employee.final_amount_paid)}
              </div>
              <div className="text-sm text-gray-600">Final Paid</div>
            </div>
            <div className="text-gray-400">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Monthly Summary */}
          <div className="p-4 sm:p-6 bg-gray-50">
            <h5 className="font-semibold text-gray-900 mb-4">Monthly Summary</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-blue-600">{formatHours(employee.total_hours)}</div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-green-600">{formatCurrency(employee.gross_pay)}</div>
                <div className="text-sm text-gray-600">Gross Pay</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-orange-600">{formatCurrency(employee.net_pay)}</div>
                <div className="text-sm text-gray-600">Net Pay</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-purple-600">{formatCurrency(employee.final_amount_paid)}</div>
                <div className="text-sm text-gray-600">Amount Paid</div>
              </div>
            </div>

            {/* Adjustments Breakdown */}
            {hasAdjustments && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                <h6 className="font-medium text-gray-900 mb-2">Adjustments</h6>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  {employee.total_bonuses > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bonuses:</span>
                      <span className="font-medium text-green-600">+{formatCurrency(employee.total_bonuses)}</span>
                    </div>
                  )}
                  {employee.total_advances > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Advances:</span>
                      <span className="font-medium text-red-600">-{formatCurrency(employee.total_advances)}</span>
                    </div>
                  )}
                  {employee.total_deductions > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deductions:</span>
                      <span className="font-medium text-red-600">-{formatCurrency(employee.total_deductions)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment Records */}
          {employee.payment_records.length > 0 && (
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-semibold text-gray-900">Payment Records</h5>
                <span className="text-sm text-gray-600">
                  {employee.payment_records.length} record{employee.payment_records.length !== 1 ? 's' : ''} 
                  {paidRecordsCount > 0 && ` • ${paidRecordsCount} paid`}
                </span>
              </div>
              
              <div className="space-y-3">
                {employee.payment_records
                  .sort((a, b) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime())
                  .map((record) => (
                    <PaymentRecordItem key={record.id} record={record} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PaymentRecordItemProps {
  record: PaymentRecordBreakdown;
}

function PaymentRecordItem({ record }: PaymentRecordItemProps) {
  const isPaid = record.status === 'paid';
  const hasAdjustments = record.advances > 0 || record.bonuses > 0 || record.deductions > 0;

  return (
    <div className={`p-4 rounded-lg border-2 transition-colors ${
      isPaid 
        ? 'border-green-200 bg-green-50' 
        : 'border-blue-200 bg-blue-50'
    }`}>
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">
            Week of {formatWeekRange(record.period_start)}
          </span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isPaid 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {isPaid ? 'Paid' : 'Calculated'}
        </div>
      </div>

      {/* Payment Details */}
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Gross: {formatHours(record.total_hours)} @ {formatCurrency(record.hourly_rate)}/hr:</span>
          <span className="font-medium">{formatCurrency(record.gross_pay)}</span>
        </div>
        {hasAdjustments && (
          <>
            {record.bonuses > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Bonus:</span>
                <span className="font-medium text-green-600">+{formatCurrency(record.bonuses)}</span>
              </div>
            )}
            {record.advances > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Advance:</span>
                <span className="font-medium text-red-600">-{formatCurrency(record.advances)}</span>
              </div>
            )}
            {record.deductions > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Deduction:</span>
                <span className="font-medium text-red-600">-{formatCurrency(record.deductions)}</span>
              </div>
            )}
          </>
        )}
        <div className="flex justify-between font-semibold border-t pt-2">
          <span className="text-gray-900">Net:</span>
          <span className="text-gray-900">{formatCurrency(record.net_pay)}</span>
        </div>
      </div>

      {/* Payment Method & Notes */}
      {isPaid && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          {record.payment_method && (
            <div className="flex items-center space-x-1">
              <CreditCard className="w-4 h-4" />
              <span className="capitalize">{record.payment_method.replace('_', ' ')}</span>
            </div>
          )}
          {record.paid_at && (
            <div>
              Paid on {new Date(record.paid_at).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {record.notes && (
        <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-sm text-gray-700">
          <span className="font-medium">Note:</span> {record.notes}
        </div>
      )}
    </div>
  );
}
