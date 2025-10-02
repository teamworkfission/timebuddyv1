import { useState, useEffect } from 'react';
import { EmployeeHome } from './EmployeeHome';
import { EmployeeSchedule } from './EmployeeSchedule';
import { EmployeeEarnings } from './EmployeeEarnings';
import { MyJobs } from './MyJobs';
import { ProfileDropdown } from '../ui/ProfileDropdown';
import { NotificationBadge } from '../ui/NotificationBadge';
import { joinRequestsApi } from '../../lib/join-requests-api';
import { EmployeeSchedulesAPI, getCurrentWeekStart } from '../../lib/schedules-api';
import { supabase } from '../../lib/supabase';
import { hasBeenViewed } from '../../lib/notification-tracker';

interface EmployeeDashboardTabsProps {
  userEmail?: string;
  onLogout: () => void;
  onJobProfile?: () => void;
  isProfileComplete?: boolean;
  profileCompletionPercentage?: number;
  employeeGid?: string;
}

type TabType = 'home' | 'myjobs' | 'schedule' | 'earnings';

export function EmployeeDashboardTabs({ userEmail, onLogout, onJobProfile, isProfileComplete, profileCompletionPercentage, employeeGid }: EmployeeDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [scheduleNotificationCount, setScheduleNotificationCount] = useState(0);
  const [userId, setUserId] = useState<string>('');

  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: '🏠' },
    { id: 'myjobs' as TabType, label: 'My Jobs', icon: '💼' },
    { id: 'schedule' as TabType, label: 'Schedule', icon: '📅', notificationCount: scheduleNotificationCount },
    { id: 'earnings' as TabType, label: 'Earnings', icon: '💰' }
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

  // Load notification counts for Schedule tab (only unviewed items)
  useEffect(() => {
    if (!userId) return;

    const loadNotificationCounts = async () => {
      try {
        const currentWeek = getCurrentWeekStart();
        
        // Fetch join requests count
        const joinRequests = await joinRequestsApi.getEmployeeJoinRequests();
        const hasJoinRequests = joinRequests.length > 0;
        const joinRequestsViewed = hasBeenViewed(userId, 'join_requests');
        const unviewedJoinRequestsCount = hasJoinRequests && !joinRequestsViewed ? joinRequests.length : 0;

        // Fetch schedules for current week
        const scheduleData = await EmployeeSchedulesAPI.getEmployeeWeeklySchedules(currentWeek);
        const hasSchedules = (scheduleData.schedules?.length || 0) > 0;
        
        console.log('🔍 MAIN DASHBOARD DEBUG: Schedule data received:', scheduleData);
        console.log('🔍 MAIN DASHBOARD DEBUG: Schedules array:', scheduleData.schedules);
        
        // Get the latest posted_at timestamp from all schedules
        const latestPostedAt = scheduleData.schedules?.reduce((latest: string | null, schedule: any) => {
          console.log('🔍 MAIN DASHBOARD DEBUG: Schedule posted_at:', schedule.posted_at);
          if (!schedule.posted_at) return latest;
          if (!latest) return schedule.posted_at;
          return new Date(schedule.posted_at) > new Date(latest) ? schedule.posted_at : latest;
        }, null as string | null);
        
        console.log('🔍 MAIN DASHBOARD DEBUG: Latest posted_at:', latestPostedAt);
        console.log('🔍 MAIN DASHBOARD DEBUG: Week:', currentWeek);
        console.log('🔍 MAIN DASHBOARD DEBUG: User ID:', userId);
        
        const schedulesViewed = hasBeenViewed(userId, 'schedules', currentWeek, latestPostedAt || undefined);
        const unviewedSchedulesCount = hasSchedules && !schedulesViewed ? scheduleData.schedules.length : 0;
        
        console.log('🔍 MAIN DASHBOARD DEBUG: Schedules viewed:', schedulesViewed);
        console.log('🔍 MAIN DASHBOARD DEBUG: Unviewed count:', unviewedSchedulesCount);

        // Set total count of UNVIEWED items only
        setScheduleNotificationCount(unviewedSchedulesCount + unviewedJoinRequestsCount);
      } catch (err) {
        console.error('Failed to load notification counts:', err);
        // Silently fail - don't show badge if error
      }
    };

    loadNotificationCounts();
    
    // Reload counts when user switches back to Schedule tab (in case they viewed items)
    const interval = setInterval(loadNotificationCounts, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <EmployeeHome />;
      case 'myjobs':
        return <MyJobs />;
      case 'schedule':
        return <EmployeeSchedule />;
      case 'earnings':
        return <EmployeeEarnings />;
      default:
        return <EmployeeHome />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-lg font-bold text-blue-600">PtimeBuddy</span>
          </div>
          <div className="flex items-center">
            <ProfileDropdown 
              email={userEmail || ''} 
              onLogout={onLogout} 
              onJobProfile={onJobProfile}
              isProfileComplete={isProfileComplete}
              profileCompletionPercentage={profileCompletionPercentage}
              employeeGid={employeeGid}
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
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
                <div className="flex items-center justify-center gap-2 relative">
                  <span className="text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {'notificationCount' in tab && tab.notificationCount !== undefined && tab.notificationCount > 0 && (
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
