import { useState, useEffect } from 'react';
import { AlertCircle, Check, X, Clock, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Business } from '../../lib/business-api';
import { 
  ConfirmedHoursRecord,
  getEmployerConfirmedHoursList,
  approveConfirmedHours,
  rejectConfirmedHours,
  formatHours,
  formatDayWithDate
} from '../../lib/confirmed-hours-api';

interface PendingHoursApprovalProps {
  business: Business;
  currentWeek: string;
  onRefresh?: () => void;
}

// Day configuration matching existing system
const DAYS = [
  { key: 'sunday_hours', label: 'Sun', fullLabel: 'Sunday', dayIndex: 0 },
  { key: 'monday_hours', label: 'Mon', fullLabel: 'Monday', dayIndex: 1 },
  { key: 'tuesday_hours', label: 'Tue', fullLabel: 'Tuesday', dayIndex: 2 },
  { key: 'wednesday_hours', label: 'Wed', fullLabel: 'Wednesday', dayIndex: 3 },
  { key: 'thursday_hours', label: 'Thu', fullLabel: 'Thursday', dayIndex: 4 },
  { key: 'friday_hours', label: 'Fri', fullLabel: 'Friday', dayIndex: 5 },
  { key: 'saturday_hours', label: 'Sat', fullLabel: 'Saturday', dayIndex: 6 }
] as const;

type DayKey = typeof DAYS[number]['key'];

interface PendingHoursWithEmployee extends ConfirmedHoursRecord {
  employee_name: string;
}

export function PendingHoursApproval({ business, currentWeek, onRefresh }: PendingHoursApprovalProps) {
  const [pendingHours, setPendingHours] = useState<PendingHoursWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingHours, setApprovingHours] = useState<Set<string>>(new Set());
  const [rejectingHours, setRejectingHours] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Convert week start to date range for filtering
  const getWeekDateRange = (weekStart: string) => {
    const start = new Date(weekStart + 'T00:00:00');
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      start: weekStart,
      end: end.toISOString().split('T')[0]
    };
  };

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const pendingRecords = await getEmployerConfirmedHoursList(business.business_id, 'submitted');
      const dateRange = getWeekDateRange(currentWeek);
      
      // Filter by current week and add employee names
      const filteredRecords = pendingRecords
        .filter(record => 
          record.week_start_date >= dateRange.start && 
          record.week_start_date <= dateRange.end
        )
        .map(record => ({
          ...record,
          employee_name: `Employee ${record.employee_id.slice(0, 8)}...` // Fallback name
        }));

      setPendingHours(filteredRecords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending hours');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingApprovals();
  }, [business.business_id, currentWeek]);

  const handleApprove = async (record: ConfirmedHoursRecord) => {
    setApprovingHours(prev => new Set(prev).add(record.id));
    
    try {
      await approveConfirmedHours(record.id, 'Approved by employer');
      setSuccess(`Approved ${formatHours(record.total_hours)} hours for ${record.employee_id.slice(0, 8)}...`);
      await loadPendingApprovals();
      onRefresh?.();
      
      // Clear success after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve hours');
    } finally {
      setApprovingHours(prev => {
        const newSet = new Set(prev);
        newSet.delete(record.id);
        return newSet;
      });
    }
  };

  const handleReject = async (record: ConfirmedHoursRecord, reason: string = 'Hours require revision') => {
    setRejectingHours(prev => new Set(prev).add(record.id));
    
    try {
      await rejectConfirmedHours(record.id, reason, 'Please review and resubmit your hours');
      setSuccess(`Rejected hours for ${record.employee_id.slice(0, 8)}... - employee can revise and resubmit`);
      await loadPendingApprovals();
      onRefresh?.();
      
      // Clear success after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject hours');
    } finally {
      setRejectingHours(prev => {
        const newSet = new Set(prev);
        newSet.delete(record.id);
        return newSet;
      });
    }
  };

  const getDailyHours = (record: ConfirmedHoursRecord, dayKey: DayKey): number => {
    return record[dayKey] || 0;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <Clock className="h-6 w-6 text-blue-500 animate-spin mr-3" />
          <span className="text-gray-600">Loading pending hours...</span>
        </div>
      </div>
    );
  }

  if (pendingHours.length === 0) {
    return null; // Don't show section if no pending hours
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Pending Hours Approval ({pendingHours.length})
              </h3>
              <p className="text-sm text-gray-600">
                Review and approve employee-submitted hours with daily breakdown
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center text-red-800">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center text-green-800">
            <Check className="h-5 w-5 mr-2" />
            {success}
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {pendingHours.map((record) => (
          <div key={record.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Employee Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">
                      {record.employee_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{record.employee_name}</h4>
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(record.submitted_at || record.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-600">
                    {formatHours(record.total_hours)}h
                  </div>
                  <div className="text-xs text-gray-500">total hours</div>
                </div>
              </div>
            </div>

            {/* Daily Hours Breakdown */}
            <div className="p-4">
              {/* Desktop View - Grid Layout */}
              <div className="hidden md:grid md:grid-cols-7 gap-4 mb-4">
                {DAYS.map((day) => {
                  const hours = getDailyHours(record, day.key);
                  return (
                    <div key={day.key} className="text-center">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        {formatDayWithDate(record.week_start_date, day.dayIndex, day.label)}
                      </div>
                      <div className={`
                        w-full px-3 py-2 text-center border rounded-md text-sm font-medium
                        ${hours > 0 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                        }
                      `}>
                        {hours > 0 ? formatHours(hours) : '0'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile View - Stacked Layout */}
              <div className="md:hidden space-y-3 mb-4">
                {DAYS.map((day) => {
                  const hours = getDailyHours(record, day.key);
                  if (hours === 0) return null; // Only show days with hours on mobile
                  
                  return (
                    <div key={day.key} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-gray-900">
                        {formatDayWithDate(record.week_start_date, day.dayIndex, day.fullLabel)}
                      </div>
                      <div className="text-blue-700 font-semibold">
                        {formatHours(hours)}h
                      </div>
                    </div>
                  );
                })}
                {DAYS.every(day => getDailyHours(record, day.key) === 0) && (
                  <div className="text-center py-4 text-gray-500">
                    No hours recorded for any day
                  </div>
                )}
              </div>

              {/* Notes */}
              {record.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Employee Notes:</p>
                  <p className="text-sm text-gray-600">{record.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReject(record)}
                  loading={rejectingHours.has(record.id)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(record)}
                  loading={approvingHours.has(record.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
