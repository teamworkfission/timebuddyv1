import { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, DollarSign, Clock, Users } from 'lucide-react';
import { Business } from '../../lib/business-api';
import { 
  PayrollReport,
  getPaymentReports,
  MonthlyBreakdownReport,
  getEmployeeMonthlyBreakdown
} from '../../lib/payments-api';
import { MonthNavigator } from './MonthNavigator';
import { Button } from '../ui/Button';
import { formatHours } from '../../lib/confirmed-hours-api';
import { CollapsibleEmployeeCard } from './CollapsibleEmployeeCard';

interface ReportsTabProps {
  business: Business;
}

export function ReportsTab({ business }: ReportsTabProps) {
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
  
  const [reportData, setReportData] = useState<PayrollReport | null>(null);
  const [breakdownData, setBreakdownData] = useState<MonthlyBreakdownReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading report data for period:', dateRange.start, 'to', dateRange.end);
      
      // Clear existing data to prevent showing stale results
      setReportData(null);
      setBreakdownData(null);
      
      // Load both regular report data and detailed breakdown data in parallel
      const [reportResult, breakdownResult] = await Promise.all([
        getPaymentReports(business.business_id, dateRange.start, dateRange.end),
        getEmployeeMonthlyBreakdown(business.business_id, dateRange.start, dateRange.end)
      ]);
      
      console.log('Report data loaded:', { reportResult, breakdownResult });
      
      setReportData(reportResult);
      setBreakdownData(breakdownResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load report data';
      setError(errorMessage);
      console.error('Report loading error:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  return (
    <div className="space-y-6">
      {/* Month Navigation and Export */}
      <div className="space-y-4">
        <MonthNavigator 
          value={dateRange}
          onChange={setDateRange}
          onApply={loadReportData}
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

      {/* Error Message */}
      {error && (
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

      {/* Report Data */}
      {reportData && !loading && (
        <>
          {/* Business Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${loading ? '...' : reportData.total_paid.toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-700">Total Paid</div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {loading ? '...' : reportData.employee_count}
                  </div>
                  <div className="text-sm text-green-700">Employees Paid</div>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {loading ? '...' : formatHours(reportData.total_hours)}
                  </div>
                  <div className="text-sm text-purple-700">Total Hours</div>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Breakdown */}
          {breakdownData && breakdownData.employees.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Employee Breakdown</h3>
                <span className="text-sm text-gray-600">
                  (Click to expand details)
                </span>
              </div>
              
              <div className="space-y-4">
                {breakdownData.employees
                  .sort((a, b) => b.final_amount_paid - a.final_amount_paid)
                  .map((employee) => (
                    <CollapsibleEmployeeCard 
                      key={employee.employee_id} 
                      employee={employee} 
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Timeline Chart Placeholder */}
          {reportData.timeline_data && reportData.timeline_data.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Timeline</h3>
              <div className="space-y-2">
                {reportData.timeline_data.map((dataPoint) => (
                  <div key={dataPoint.date} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">
                      {new Date(dataPoint.date).toLocaleDateString()}
                    </span>
                    <span className="text-green-600 font-medium">
                      ${dataPoint.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* No Data State */}
      {reportData && breakdownData && !loading && reportData.employee_count === 0 && (
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
