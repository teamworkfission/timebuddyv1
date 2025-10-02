import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { JoinRequests } from './JoinRequests';
import { EmployeeWeeklyScheduleView } from './EmployeeWeeklyScheduleView';
import { EmployeeScheduleFilter } from './EmployeeScheduleFilter';
import { EmployeeSchedulesAPI, getCurrentWeekStart, formatWeekRange, getPreviousWeek, getNextWeek } from '../../lib/schedules-api';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

type ScheduleTabType = 'schedule' | 'join-requests';

export function EmployeeSchedule() {
  const [activeTab, setActiveTab] = useState<ScheduleTabType>('schedule');
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekStart());
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'schedule' as ScheduleTabType, label: 'My Schedule', icon: '📅' },
    { id: 'join-requests' as ScheduleTabType, label: 'Join Requests', icon: '📨' }
  ];

  // Load employee schedules
  const loadScheduleData = async (weekStart: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await EmployeeSchedulesAPI.getEmployeeWeeklySchedules(weekStart);
      setScheduleData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule');
      console.error('Failed to load employee schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadScheduleData(currentWeek);
  }, [currentWeek]);

  // Week navigation
  const handlePreviousWeek = () => {
    const prevWeek = getPreviousWeek(currentWeek);
    setCurrentWeek(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = getNextWeek(currentWeek);
    setCurrentWeek(nextWeek);
  };

  // Get aggregated shifts from all schedules
  const getAllShifts = () => {
    if (!scheduleData?.schedules) return [];
    return scheduleData.schedules.flatMap((schedule: any) => 
      schedule.shifts.map((shift: any) => ({
        ...shift,
        business_name: schedule.business_name,
        business_id: schedule.business_id,
        schedule_id: schedule.id
      }))
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'join-requests':
        return (
          <div className="max-w-4xl mx-auto px-4 py-6">
            <JoinRequests />
          </div>
        );
      case 'schedule':
      default:
        return (
          <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Week Navigation - Mobile Optimized */}
            <div className="mb-6">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 mb-4">
                <div className="flex items-center justify-between gap-2">
                  {/* Previous Week Button */}
                  <button
                    onClick={handlePreviousWeek}
                    disabled={loading}
                    className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 border border-blue-200 hover:border-blue-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous week"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  
                  {/* Week Display */}
                  <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Week
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-gray-900 text-center">
                      {formatWeekRange(currentWeek)}
                    </div>
                  </div>
                  
                  {/* Next Week Button */}
                  <button
                    onClick={handleNextWeek}
                    disabled={loading}
                    className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 border border-blue-200 hover:border-blue-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next week"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>

              {/* Employer Filter */}
              {scheduleData?.businesses && scheduleData.businesses.length > 1 && (
                <EmployeeScheduleFilter
                  businesses={scheduleData.businesses}
                  selectedBusinessId={selectedBusinessId}
                  onBusinessSelect={setSelectedBusinessId}
                />
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your schedule...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error loading schedule</h3>
                    <p className="mt-2 text-sm text-red-700">{error}</p>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadScheduleData(currentWeek)}
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Content */}
            {!loading && !error && scheduleData && (
              <EmployeeWeeklyScheduleView
                weekStartDate={currentWeek}
                allShifts={getAllShifts()}
                businesses={scheduleData.businesses || []}
                selectedBusinessId={selectedBusinessId}
              />
            )}

            {/* No Business Association State */}
            {!loading && !error && scheduleData && scheduleData.businesses.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <span className="text-2xl">🏢</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No employers yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-6">
                  You haven't been added to any business schedules yet. Ask your employer to send you a join request.
                </p>
                <Button
                  onClick={() => setActiveTab('join-requests')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View Join Requests
                </Button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub-Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <nav className="flex gap-2 sm:gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none sm:min-w-[180px] px-4 sm:px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span className="text-sm sm:text-base">{tab.label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {renderTabContent()}
      </div>
    </div>
  );
}
