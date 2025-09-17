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
            {/* Mobile-Friendly Week Navigation */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePreviousWeek}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                
                <div className="flex items-center text-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {formatWeekRange(currentWeek)}
                  </h2>
                </div>
                
                <button
                  onClick={handleNextWeek}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
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
        <div className="max-w-6xl mx-auto">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none sm:px-8 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
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
