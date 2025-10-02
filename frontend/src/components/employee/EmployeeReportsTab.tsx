import { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, DollarSign, Clock, Calendar, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { 
  MonthlyBreakdownReport,
  getEmployeeMonthlyBreakdown,
  formatCurrency,
  PaymentRecordBreakdown
} from '../../lib/payments-api';
import { MonthNavigator } from '../payments/MonthNavigator';
import { BusinessDropdown } from './BusinessDropdown';
import { Button } from '../ui/Button';
import { formatHours } from '../../lib/confirmed-hours-api';
import { formatWeekRange } from '../../lib/date-utils';

interface Business {
  business_id: string;
  name: string;
}

interface EmployeeReportsTabProps {
  businesses: Business[];
}

export function EmployeeReportsTab({ businesses }: EmployeeReportsTabProps) {
  // Helper function to get current month range
  const getCurrentMonthRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getCurrentMonthRange());
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [breakdownData, setBreakdownData] = useState<MonthlyBreakdownReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReportData = async () => {
    if (!selectedBusinessId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading employee report data for period:', dateRange.start, 'to', dateRange.end);
      
      // Backend automatically filters to current employee
      const breakdownResult = await getEmployeeMonthlyBreakdown(selectedBusinessId, dateRange.start, dateRange.end);
      
      console.log('Employee report data loaded:', breakdownResult);
      
      setBreakdownData(breakdownResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load report data';
      setError(errorMessage);
      console.error('Report loading error:', err);
      setBreakdownData(null);
    } finally {
      setLoading(false);
    }
  };

  // Load data when business or date range changes
  useEffect(() => {
    setBreakdownData(null);
    setError(null);
    
    if (selectedBusinessId) {
      loadReportData();
    }
  }, [dateRange, selectedBusinessId]);

  const handleBusinessSelect = (businessId: string | null) => {
    setSelectedBusinessId(businessId);
  };

  // Get the first (and only) employee from the breakdown data
  const employeeData = breakdownData?.employees?.[0];
  const hasAdjustments = employeeData ? (
    employeeData.total_advances > 0 || 
    employeeData.total_bonuses > 0 || 
    employeeData.total_deductions > 0
  ) : false;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Reports</h1>
        <p className="text-gray-600">
          View your monthly payment history and detailed breakdown
        </p>
      </div>

      {/* Business Selection */}
      <div className="mb-6">
        <BusinessDropdown
          businesses={businesses}
          selectedBusinessId={selectedBusinessId}
          onBusinessSelect={handleBusinessSelect}
          loading={false}
        />
      </div>

      {/* Show month navigator and refresh only when business is selected */}
      {selectedBusinessId && (
        <div className="space-y-4 mb-6">
          <MonthNavigator 
            value={dateRange}
            onChange={setDateRange}
            disabled={loading}
          />
          
          <div className="flex justify-center">
            <Button
              onClick={loadReportData}
              disabled={loading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      )}

      {/* No business selected */}
      {!selectedBusinessId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Select a Business</h3>
          <p className="text-blue-700">
            Choose a business from the dropdown above to view your payment reports
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && selectedBusinessId && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600 mt-2">Loading reports...</p>
        </div>
      )}

      {/* Report Data - Show only when data exists */}
      {employeeData && !loading && selectedBusinessId && (
        <div className="space-y-6">
          {/* Monthly Summary Cards */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{formatHours(employeeData.total_hours)}</div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{formatCurrency(employeeData.gross_pay)}</div>
                <div className="text-sm text-gray-600">Gross Pay</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <DollarSign className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(employeeData.net_pay)}</div>
                <div className="text-sm text-gray-600">Net Pay</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <DollarSign className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(employeeData.final_amount_paid)}</div>
                <div className="text-sm text-gray-600">Amount Paid</div>
              </div>
            </div>

            {/* Adjustments Breakdown */}
            {hasAdjustments && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h6 className="font-medium text-gray-900 mb-3">Adjustments</h6>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  {employeeData.total_bonuses > 0 && (
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-gray-600 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                        Bonuses:
                      </span>
                      <span className="font-medium text-green-600">+{formatCurrency(employeeData.total_bonuses)}</span>
                    </div>
                  )}
                  {employeeData.total_advances > 0 && (
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-gray-600 flex items-center">
                        <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
                        Advances:
                      </span>
                      <span className="font-medium text-red-600">-{formatCurrency(employeeData.total_advances)}</span>
                    </div>
                  )}
                  {employeeData.total_deductions > 0 && (
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-gray-600 flex items-center">
                        <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
                        Deductions:
                      </span>
                      <span className="font-medium text-red-600">-{formatCurrency(employeeData.total_deductions)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment Records */}
          {employeeData.payment_records.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-gray-700" />
                  <h3 className="text-lg font-semibold text-gray-900">Payment Records</h3>
                </div>
                <span className="text-sm text-gray-600">
                  {employeeData.payment_records.length} record{employeeData.payment_records.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="space-y-4">
                {employeeData.payment_records
                  .sort((a, b) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime())
                  .map((record) => (
                    <PaymentRecordCard key={record.id} record={record} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {breakdownData && !loading && selectedBusinessId && (!employeeData || employeeData.payment_records.length === 0) && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">No Payment Data</h3>
          <p className="text-gray-600 mt-2">
            No payments found for the selected period. Try selecting a different date range.
          </p>
        </div>
      )}
    </div>
  );
}

interface PaymentRecordCardProps {
  record: PaymentRecordBreakdown;
}

function PaymentRecordCard({ record }: PaymentRecordCardProps) {
  const isPaid = record.status === 'paid';
  const hasAdjustments = record.advances > 0 || record.bonuses > 0 || record.deductions > 0;

  return (
    <div className={`p-4 sm:p-5 rounded-lg border-2 transition-all hover:shadow-md ${
      isPaid 
        ? 'border-green-200 bg-green-50' 
        : 'border-blue-200 bg-blue-50'
    }`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">
            Week of {formatWeekRange(record.period_start)}
          </span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isPaid 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {isPaid ? 'Paid' : 'Calculated'}
        </div>
      </div>

      {/* Payment Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">
            Gross: {formatHours(record.total_hours)} × {formatCurrency(record.hourly_rate)}/hr
          </span>
          <span className="font-medium">{formatCurrency(record.gross_pay)}</span>
        </div>
        
        {hasAdjustments && (
          <div className="pl-4 space-y-1">
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
          </div>
        )}
        
        <div className="flex justify-between font-semibold border-t pt-2 mt-2">
          <span className="text-gray-900">Net:</span>
          <span className="text-gray-900">{formatCurrency(record.net_pay)}</span>
        </div>
      </div>

      {/* Payment Method & Date */}
      {isPaid && (
        <div className="mt-3 pt-3 border-t border-green-200 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          {record.payment_method && (
            <div className="flex items-center space-x-1">
              <CreditCard className="w-4 h-4" />
              <span className="capitalize">{record.payment_method.replace('_', ' ')}</span>
            </div>
          )}
          {record.paid_at && (
            <div className="flex items-center space-x-1">
              <span>Paid on {new Date(record.paid_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {record.notes && (
        <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-sm text-gray-700">
          <span className="font-medium">Note:</span> {record.notes}
        </div>
      )}
    </div>
  );
}

