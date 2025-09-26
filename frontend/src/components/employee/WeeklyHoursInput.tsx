import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { 
  WeeklyHoursData,
  CreateHoursRequest,
  UpdateHoursRequest,
  getWeeklyHours,
  createConfirmedHours,
  updateConfirmedHours,
  submitConfirmedHours,
  calculateTotalHours,
  validateHours,
  formatHours,
  formatDayWithDate
} from '../../lib/confirmed-hours-api';
import { AlertCircle, Check, Clock, Save, Send } from 'lucide-react';

interface WeeklyHoursInputProps {
  businessId: string;
  weekStart: string;
  onBack?: () => void;
}

// Day configuration matching existing schedule system
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

export function WeeklyHoursInput({ businessId, weekStart, onBack }: WeeklyHoursInputProps) {
  const [data, setData] = useState<WeeklyHoursData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [hours, setHours] = useState<Record<DayKey, number>>({
    sunday_hours: 0,
    monday_hours: 0,
    tuesday_hours: 0,
    wednesday_hours: 0,
    thursday_hours: 0,
    friday_hours: 0,
    saturday_hours: 0
  });
  const [notes, setNotes] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadWeeklyHours();
  }, [businessId, weekStart]);

  const loadWeeklyHours = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const weeklyData = await getWeeklyHours(businessId, weekStart);
      setData(weeklyData);
      
      // Initialize form with confirmed hours or prefill with scheduled hours
      const initialHours: Record<DayKey, number> = {
        sunday_hours: weeklyData.confirmed_hours?.sunday_hours || weeklyData.scheduled_hours.sunday_hours || 0,
        monday_hours: weeklyData.confirmed_hours?.monday_hours || weeklyData.scheduled_hours.monday_hours || 0,
        tuesday_hours: weeklyData.confirmed_hours?.tuesday_hours || weeklyData.scheduled_hours.tuesday_hours || 0,
        wednesday_hours: weeklyData.confirmed_hours?.wednesday_hours || weeklyData.scheduled_hours.wednesday_hours || 0,
        thursday_hours: weeklyData.confirmed_hours?.thursday_hours || weeklyData.scheduled_hours.thursday_hours || 0,
        friday_hours: weeklyData.confirmed_hours?.friday_hours || weeklyData.scheduled_hours.friday_hours || 0,
        saturday_hours: weeklyData.confirmed_hours?.saturday_hours || weeklyData.scheduled_hours.saturday_hours || 0
      };
      
      setHours(initialHours);
      setNotes(weeklyData.confirmed_hours?.notes || '');
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hours data');
    } finally {
      setLoading(false);
    }
  };

  const handleHoursChange = (dayKey: DayKey, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    
    if (value !== '' && !validateHours(numValue)) {
      return; // Invalid input, don't update
    }
    
    setHours(prev => ({ ...prev, [dayKey]: numValue }));
    setHasChanges(true);
    clearMessages();
  };

  const handleSave = async () => {
    if (!data) return;
    
    try {
      setSaving(true);
      setError(null);
      
      if (data.confirmed_hours) {
        // Update existing record
        const updateData: UpdateHoursRequest = { ...hours, notes };
        await updateConfirmedHours(data.confirmed_hours.id, updateData);
        setSuccess('Hours saved as draft');
      } else {
        // Create new record
        const createData: CreateHoursRequest = {
          business_id: businessId,
          week_start_date: weekStart,
          ...hours,
          notes
        };
        await createConfirmedHours(createData);
        setSuccess('Hours created and saved as draft');
      }
      
      setHasChanges(false);
      // Reload to get updated data
      await loadWeeklyHours();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save hours');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!data?.confirmed_hours) {
      setError('Please save your hours first before submitting');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      await submitConfirmedHours(data.confirmed_hours.id, { notes });
      setSuccess(isRejected ? 'Hours resubmitted for employer approval' : 'Hours submitted for employer approval');
      setHasChanges(false);
      // Reload to get updated status
      await loadWeeklyHours();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit hours');
    } finally {
      setSubmitting(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const getTotalHours = (): number => {
    return calculateTotalHours(hours);
  };

  const getStatusDisplay = () => {
    if (!data?.confirmed_hours) return null;
    
    const status = data.confirmed_hours.status;
    const statusConfig = {
      draft: { label: 'Draft', icon: '📝', color: 'text-gray-600 bg-gray-100' },
      submitted: { label: 'Submitted', icon: '⏳', color: 'text-blue-600 bg-blue-100' },
      approved: { label: 'Approved', icon: '✅', color: 'text-green-600 bg-green-100' },
      rejected: { label: 'Rejected', icon: '❌', color: 'text-red-600 bg-red-100' }
    };
    
    const config = statusConfig[status];
    
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </div>
    );
  };

  const canEdit = !data?.confirmed_hours || data.confirmed_hours.status === 'draft' || data.confirmed_hours.status === 'rejected';
  const canSubmit = data?.confirmed_hours && (data.confirmed_hours.status === 'draft' || data.confirmed_hours.status === 'rejected') && !hasChanges;
  const isRejected = data?.confirmed_hours?.status === 'rejected';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading weekly hours...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load</h3>
        <p className="text-gray-600">Unable to load hours data for this week</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center text-red-800">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center text-green-800">
            <Check className="h-5 w-5 mr-2" />
            {success}
          </div>
        </div>
      )}

      {/* Rejection Notice */}
      {isRejected && data?.confirmed_hours?.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-red-900 font-semibold mb-2">Hours Rejected by Employer</h4>
              <div className="bg-white rounded p-3 mb-3">
                <p className="text-red-800 text-sm font-medium mb-1">Rejection Reason:</p>
                <p className="text-red-700 text-sm">{data.confirmed_hours.rejection_reason}</p>
              </div>
              <div className="text-sm text-red-700">
                <p className="font-medium">You can make changes to your hours and resubmit for approval.</p>
                <p className="mt-1">
                  Rejected on: {' '}
                  {data.confirmed_hours.rejected_at 
                    ? new Date(data.confirmed_hours.rejected_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })
                    : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hours Input Form */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Daily Hours</h3>
              <p className="text-sm text-gray-600 mt-1">
                Enter the actual hours you worked each day. Hours are prefilled from your schedule.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusDisplay()}
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {formatHours(getTotalHours())}h
                </div>
                <div className="text-xs text-gray-500">total this week</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Desktop View - Grid Layout */}
          <div className="hidden md:grid md:grid-cols-7 gap-4 mb-6">
            {DAYS.map((day) => (
              <div key={day.key} className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formatDayWithDate(weekStart, day.dayIndex, day.label)}
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.25"
                  value={hours[day.key] === 0 ? '' : hours[day.key]}
                  onChange={(e) => handleHoursChange(day.key, e.target.value)}
                  disabled={!canEdit}
                  placeholder="0"
                  className={`
                    w-full px-3 py-2 text-center border rounded-md text-sm
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                    ${canEdit 
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                    }
                    ${hours[day.key] > 0 ? 'bg-blue-50 border-blue-300 font-medium' : ''}
                  `}
                />
                {/* Show scheduled hours for comparison */}
                {data.scheduled_hours[day.key] > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    Scheduled: {formatHours(data.scheduled_hours[day.key])}h
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile View - Stacked Layout */}
          <div className="md:hidden space-y-4 mb-6">
            {DAYS.map((day) => (
              <div key={day.key} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{formatDayWithDate(weekStart, day.dayIndex, day.label)}</div>
                  {data.scheduled_hours[day.key] > 0 && (
                    <div className="text-sm text-gray-500">
                      Scheduled: {formatHours(data.scheduled_hours[day.key])}h
                    </div>
                  )}
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.25"
                    value={hours[day.key] === 0 ? '' : hours[day.key]}
                    onChange={(e) => handleHoursChange(day.key, e.target.value)}
                    disabled={!canEdit}
                    placeholder="0"
                    className={`
                      w-full px-3 py-2 text-center border rounded-md
                      [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                      ${canEdit 
                        ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                      }
                      ${hours[day.key] > 0 ? 'bg-blue-50 border-blue-300 font-medium' : ''}
                    `}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Notes Section */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setHasChanges(true);
                clearMessages();
              }}
              disabled={!canEdit}
              rows={3}
              placeholder="Add any notes about your hours this week..."
              className={`
                w-full px-3 py-2 border rounded-md text-sm
                ${canEdit 
                  ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                  : 'border-gray-200 bg-gray-50 text-gray-500'
                }
              `}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end">
            <div className="flex items-center space-x-3">
              {canEdit && (
                <Button
                  onClick={handleSave}
                  loading={saving}
                  disabled={!hasChanges}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {data.confirmed_hours ? 'Update Draft' : 'Save Draft'}
                </Button>
              )}
              
              {canSubmit && (
                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isRejected ? 'Resubmit for Approval' : 'Submit for Approval'}
                </Button>
              )}
            </div>
          </div>
          
          {/* Help Text */}
          <div className="mt-4 text-xs text-gray-500">
            <div className="flex flex-wrap gap-4">
              <span>• Hours can be entered in 15-minute increments (0.25)</span>
              <span>• Maximum 24 hours per day</span>
              <span>• Save as draft to continue editing later</span>
              <span>• Submit for employer approval when ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
