import React from 'react';
import { Edit3, Eye, Send, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ScheduleTabsProps {
  activeTab: 'edit' | 'posted';
  onTabChange: (tab: 'edit' | 'posted') => void;
  scheduleStatus?: 'draft' | 'posted';
  onPostSchedule: () => void;
  onUnpostSchedule: () => void;
  loading?: boolean;
  shiftCount?: number;
  hasPostedVersion?: boolean;
}

export function ScheduleTabs({
  activeTab,
  onTabChange,
  scheduleStatus,
  onPostSchedule,
  onUnpostSchedule,
  loading = false,
  shiftCount = 0,
  hasPostedVersion = false
}: ScheduleTabsProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          <button
            onClick={() => onTabChange('edit')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'edit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Edit3 className="h-4 w-4" />
              <span>Edit Schedule</span>
            </div>
          </button>
          
          <button
            onClick={() => onTabChange('posted')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'posted'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Posted Schedule</span>
              {scheduleStatus === 'posted' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Live
                </span>
              )}
            </div>
          </button>
        </nav>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {scheduleStatus && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                scheduleStatus === 'posted' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {scheduleStatus === 'posted' ? 'Posted' : 'Draft'}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {activeTab === 'edit' && scheduleStatus === 'draft' && (
              <Button
                onClick={onPostSchedule}
                disabled={loading || shiftCount === 0}
                className="flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>
                  {hasPostedVersion ? 'Send Updated Schedule' : 'Post Schedule'}
                </span>
              </Button>
            )}

            {activeTab === 'posted' && scheduleStatus === 'posted' && (
              <Button
                variant="outline"
                onClick={onUnpostSchedule}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Return to Draft</span>
              </Button>
            )}
          </div>
        </div>

        {scheduleStatus === 'draft' && shiftCount === 0 && (
          <p className="mt-2 text-sm text-amber-600">
            Assign at least one shift to enable posting this schedule.
          </p>
        )}

        {scheduleStatus === 'draft' && shiftCount > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {hasPostedVersion 
              ? 'Review your changes and send the updated schedule when ready.' 
              : 'Review your schedule and post it when ready for employees to view.'
            }
          </p>
        )}

        {scheduleStatus === 'posted' && (
          <p className="mt-2 text-sm text-gray-600">
            This schedule is live and visible to employees. Return to draft mode to make changes.
          </p>
        )}
      </div>
    </div>
  );
}
