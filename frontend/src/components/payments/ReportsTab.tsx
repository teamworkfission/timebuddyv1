import { useState, useEffect } from 'react';
import { BarChart3, Download, RefreshCw, DollarSign, Clock, Users } from 'lucide-react';
import { Business } from '../../lib/business-api';
import { 
  PayrollReport,
  getPaymentReports,
  exportPayrollData,
  downloadCSV
} from '../../lib/payments-api';
import { DateRangePicker } from './DateRangePicker';
import { Button } from '../ui/Button';
import { formatHours } from '../../lib/confirmed-hours-api';

interface ReportsTabProps {
  business: Business;
}

export function ReportsTab({ business }: ReportsTabProps) {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0]
  });
  
  const [reportData, setReportData] = useState<PayrollReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPaymentReports(business.business_id, dateRange.start, dateRange.end);
      setReportData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load report data';
      setError(errorMessage);
      console.error('Report loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      setExporting(true);
      const csvData = await exportPayrollData(business.business_id, 'csv', {
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      downloadCSV(csvData, `payroll-${business.name}-${dateRange.start}-${dateRange.end}.csv`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  return (
    <div className="space-y-6">
      {/* Date Range and Export */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end space-y-4 lg:space-y-0">
          <div className="flex-1">
            <DateRangePicker 
              value={dateRange}
              onChange={setDateRange}
              onApply={loadReportData}
              label="Report Period"
            />
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={loadReportData}
              disabled={loading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={exportCSV}
              disabled={exporting || !reportData}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
            </Button>
          </div>
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
                    ${reportData.total_paid.toFixed(2)}
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
                    {reportData.employee_count}
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
                    {formatHours(reportData.total_hours)}
                  </div>
                  <div className="text-sm text-purple-700">Total Hours</div>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Breakdown */}
          {reportData.employees.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Employee Breakdown</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gross Pay
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Pay
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payments
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.employees.map((employee) => (
                      <tr key={employee.employee_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {employee.employee_name || 'Unknown Employee'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatHours(employee.total_hours)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${employee.gross_pay.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-green-600">
                            ${employee.net_pay.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {employee.payment_count} payment{employee.payment_count !== 1 ? 's' : ''}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
      {reportData && !loading && reportData.employee_count === 0 && (
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
