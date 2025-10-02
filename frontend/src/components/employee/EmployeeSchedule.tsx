import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { JoinRequests } from './JoinRequests';
import { EmployeeWeeklyScheduleView } from './EmployeeWeeklyScheduleView';
import { EmployeeScheduleFilter } from './EmployeeScheduleFilter';
import { EmployeeSchedulesAPI, getCurrentWeekStart, formatWeekRange, getPreviousWeek, getNextWeek } from '../../lib/schedules-api';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { NotificationBadge } from '../ui/NotificationBadge';
import { joinRequestsApi } from '../../lib/join-requests-api';
import { supabase } from '../../lib/supabase';
import { markAsViewed, hasBeenViewed } from '../../lib/notification-tracker';

type ScheduleTabType = 'schedule' | 'join-requests';

export function EmployeeSchedule() {
  const [activeTab, setActiveTab] = useState<ScheduleTabType>('schedule');
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekStart());
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedulesCount, setSchedulesCount] = useState(0);
  const [joinRequestsCount, setJoinRequestsCount] = useState(0);
  const [userId, setUserId] = useState<string>('');

  const tabs = [
    { id: 'schedule' as ScheduleTabType, label: 'My Schedule', icon: '📅', notificationCount: schedulesCount },
    { id: 'join-requests' as ScheduleTabType, label: 'Join Requests', icon: '📨', notificationCount: joinRequestsCount }
  ];

  // Get current user ID
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  // Load employee schedules and update badge count
  const loadScheduleData = async (weekStart: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await EmployeeSchedulesAPI.getEmployeeWeeklySchedules(weekStart);
      setScheduleData(data);
      
      // DEBUG: Log schedule data to check if posted_at is being returned
      console.log('🔍 DEBUG: Schedule data received:', data);
      console.log('🔍 DEBUG: Schedules array:', data.schedules);
      if (data.schedules && data.schedules.length > 0) {
        console.log('🔍 DEBUG: First schedule posted_at:', data.schedules[0].posted_at);
      }
      
      // Get the most recent posted_at timestamp from all schedules
      const latestPostedAt = data.schedules?.reduce((latest, schedule) => {
        console.log('🔍 DEBUG: Schedule posted_at:', schedule.posted_at);
        if (!schedule.posted_at) return latest;
        if (!latest) return schedule.posted_at;
        return new Date(schedule.posted_at) > new Date(latest) ? schedule.posted_at : latest;
      }, null as string | null);
      
      console.log('🔍 DEBUG: Latest posted_at:', latestPostedAt);
      console.log('🔍 DEBUG: Week start:', weekStart);
      console.log('🔍 DEBUG: User ID:', userId);
      
      // Update schedules count for notification badge - only show if NOT viewed or if schedule was updated
      const schedulesExist = (data.schedules?.length || 0) > 0;
      const isViewed = userId && hasBeenViewed(userId, 'schedules', weekStart, latestPostedAt || undefined);
      
      console.log('🔍 DEBUG: Schedules exist:', schedulesExist);
      console.log('🔍 DEBUG: Is viewed:', isViewed);
      
      setSchedulesCount(schedulesExist && !isViewed ? data.schedules.length : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule');
      console.error('Failed to load employee schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load join requests count and update badge
  const loadJoinRequestsCount = async () => {
    try {
      const requests = await joinRequestsApi.getEmployeeJoinRequests();
      
      // Only show badge if there are requests AND they haven't been viewed
      const requestsExist = requests.length > 0;
      const isViewed = userId && hasBeenViewed(userId, 'join_requests');
      setJoinRequestsCount(requestsExist && !isViewed ? requests.length : 0);
    } catch (err) {
      console.error('Failed to load join requests count:', err);
      // Silently fail - don't show badge if error
    }
  };

  // Load initial data
  useEffect(() => {
    if (userId) {
      loadScheduleData(currentWeek);
      loadJoinRequestsCount();
    }
  }, [currentWeek, userId]);

  // Handle tab change - mark as viewed when clicked
  const handleTabChange = (tabId: ScheduleTabType) => {
    setActiveTab(tabId);
    
    if (!userId) return;

    // Mark the tab as viewed and remove its badge
    if (tabId === 'schedule') {
      // Get the latest posted_at timestamp from current schedule data
      const latestPostedAt = scheduleData?.schedules?.reduce((latest: string | null, schedule: any) => {
        if (!schedule.posted_at) return latest;
        if (!latest) return schedule.posted_at;
        return new Date(schedule.posted_at) > new Date(latest) ? schedule.posted_at : latest;
      }, null as string | null);
      
      markAsViewed(userId, 'schedules', currentWeek, latestPostedAt || undefined);
      setSchedulesCount(0);
    } else if (tabId === 'join-requests') {
      markAsViewed(userId, 'join_requests');
      setJoinRequestsCount(0);
    }
  };

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
            <JoinRequests onRequestsChange={loadJoinRequestsCount} />
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
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 sm:flex-none sm:min-w-[180px] px-4 sm:px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2 relative">
                  <span className="text-lg">{tab.icon}</span>
                  <span className="text-sm sm:text-base">{tab.label}</span>
                  {tab.notificationCount > 0 && (
                    <NotificationBadge count={tab.notificationCount} />
                  )}
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
