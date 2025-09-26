import { useState, useEffect } from 'react';
import { DollarSign, Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { getPaymentRecords, PaymentRecord, formatCurrency } from '../../lib/payments-api';

interface EmployeeEarningsTableProps {
  businessId: string;
  weekStart: string;
  weekEnd: string;
}

export function EmployeeEarningsTable({ businessId, weekStart, weekEnd }: EmployeeEarningsTableProps) {
  const [paymentRecord, setPaymentRecord] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentRecord();
  }, [businessId, weekStart, weekEnd]);

  const loadPaymentRecord = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const records = await getPaymentRecords(businessId, {
        start_date: weekStart,
        end_date: weekEnd
      });
      
      // Find the current user's payment record for this period
      const userRecord = records.find(record => 
        record.period_start === weekStart && record.period_end === weekEnd
      );
      
      setPaymentRecord(userRecord || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Clock className="h-6 w-6 text-blue-500 animate-spin mr-3" />
          <span className="text-gray-600">Loading earnings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow border border-red-200 p-6">
        <div className="flex items-center text-red-800 mb-2">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="font-medium">Error Loading Earnings</span>
        </div>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!paymentRecord) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Earnings Yet</h3>
          <p className="text-gray-600">
            No payment record found for this week. Complete your hours and wait for employer approval.
          </p>
        </div>
      </div>
    );
  }

  const isPaid = paymentRecord.status === 'paid';

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Weekly Earnings</h3>
          </div>
          <div className="flex items-center space-x-2">
            {isPaid ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Paid
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <Clock className="w-4 h-4 mr-1" />
                Calculated
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Hours */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-600 mb-1">HOURS</div>
            <div className="text-2xl font-bold text-blue-800">
              {paymentRecord.total_hours}h
            </div>
            <div className="text-xs text-blue-600 mt-1">
              <Clock className="w-3 h-3 inline mr-1" />
              confirmed
            </div>
          </div>

          {/* Rate */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-sm font-medium text-purple-600 mb-1">RATE</div>
            <div className="text-2xl font-bold text-purple-800">
              {formatCurrency(paymentRecord.hourly_rate)}/hr
            </div>
          </div>

          {/* Gross Pay */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-600 mb-1">GROSS PAY</div>
            <div className="text-2xl font-bold text-green-800">
              {formatCurrency(paymentRecord.gross_pay)}
            </div>
          </div>

          {/* Adjustments */}
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-sm font-medium text-orange-600 mb-1">ADJUSTMENTS</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Advances:</span>
                <span className="font-medium">{formatCurrency(paymentRecord.advances)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Bonuses:</span>
                <span className="font-medium">{formatCurrency(paymentRecord.bonuses)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Deductions:</span>
                <span className="font-medium">{formatCurrency(paymentRecord.deductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
            <div className="text-sm font-medium text-gray-600 mb-1">NET PAY</div>
            <div className={`text-2xl font-bold ${isPaid ? 'text-green-600' : 'text-blue-600'}`}>
              {formatCurrency(paymentRecord.net_pay)}
            </div>
            {isPaid && paymentRecord.paid_at && (
              <div className="text-xs text-green-600 mt-1">
                Paid: {new Date(paymentRecord.paid_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {paymentRecord.notes && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">Payment Notes:</div>
            <p className="text-sm text-gray-600">{paymentRecord.notes}</p>
          </div>
        )}

        {/* Payment Method */}
        {isPaid && paymentRecord.payment_method && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">
              Paid via: <span className="font-medium capitalize">{paymentRecord.payment_method.replace('_', ' ')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
