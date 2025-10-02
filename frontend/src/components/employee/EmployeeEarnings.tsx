import { useState, useEffect } from 'react';
import { WeeklyHoursInput } from './WeeklyHoursInput';
import { BusinessDropdown } from './BusinessDropdown';
import { EmployeeEarningsTable } from './EmployeeEarningsTable';
import { EmployeeReportsTab } from './EmployeeReportsTab';
import { 
  getCurrentWeekStart,
  getNextWeek,
  getPreviousWeek,
  formatWeekRange
} from '../../lib/confirmed-hours-api';
import { EmployeeSchedulesAPI } from '../../lib/schedules-api';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

interface Business {
  business_id: string;
  name: string;
}

type EarningsTabType = 'weekly' | 'reports';

export function EmployeeEarnings() {
  const [activeTab, setActiveTab] = useState<EarningsTabType>('weekly');
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekStart());
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, [currentWeek]);

  // Helper function to check if a week is in the future
  const isWeekInFuture = (weekStart: string): boolean => {
    const currentRealWeek = getCurrentWeekStart();
    return weekStart > currentRealWeek;
  };

  // Helper function to determine if next navigation should be disabled
  const isNextWeekDisabled = (): boolean => {
    const nextWeek = getNextWeek(currentWeek);
    return isWeekInFuture(nextWeek);
  };

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      // Use the same API that the Schedule tab uses to get employee's business associations
      const scheduleData = await EmployeeSchedulesAPI.getEmployeeWeeklySchedules(currentWeek);
      setBusinesses(scheduleData.businesses);
    } catch (error) {
      console.error('Failed to load businesses:', error);
      setBusinesses([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleWeekNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'next' && isNextWeekDisabled()) {
      // Prevent navigation to future weeks
      return;
    }
    
    setCurrentWeek(prev => 
      direction === 'prev' ? getPreviousWeek(prev) : getNextWeek(prev)
    );
  };

  const handleBusinessSelect = (businessId: string | null) => {
    setSelectedBusinessId(businessId);
  };

  // Helper function to get week end date (6 days after start)
  const getWeekEndDate = (weekStart: string): string => {
    const startDate = new Date(weekStart + 'T00:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return endDate.toISOString().split('T')[0];
  };


  const tabs = [
    { id: 'weekly' as EarningsTabType, label: 'Weekly', icon: '📅' },
    { id: 'reports' as EarningsTabType, label: 'Reports', icon: '📊' }
  ];

  const renderTabContent = () => {
    if (activeTab === 'reports') {
      return <EmployeeReportsTab businesses={businesses} />;
    }

    // Weekly tab content
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hours & Earnings</h1>
              <p className="text-gray-600 mt-2">
                Track your actual hours worked and submit them for payroll approval
              </p>
            </div>
            
            {/* Business and Week Selection */}
            <div className="flex flex-col gap-4">
              {/* Business Dropdown */}
              <BusinessDropdown
                businesses={businesses}
                selectedBusinessId={selectedBusinessId}
                onBusinessSelect={handleBusinessSelect}
                loading={loading}
              />
              
              {/* Week Navigation - Mobile Optimized */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  {/* Previous Week Button */}
                  <button
                    onClick={() => handleWeekNavigation('prev')}
                    className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-200 border border-green-200 hover:border-green-300 active:scale-95"
                    aria-label="Previous week"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  
                  {/* Week Display */}
                  <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="h-4 w-4 text-green-600" />
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
                    onClick={() => handleWeekNavigation('next')}
                    disabled={isNextWeekDisabled()}
                    className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg transition-all duration-200 border active:scale-95 ${
                      isNextWeekDisabled()
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300'
                    }`}
                    title={isNextWeekDisabled() ? 'Cannot navigate to future weeks' : 'Next week'}
                    aria-label="Next week"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8 mb-8">
            <Clock className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-gray-600">Loading your businesses...</p>
          </div>
        )}

        {/* No businesses message */}
        {!loading && businesses.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Businesses Found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              You don't have any business associations yet. Contact your employer to get added to their business.
            </p>
          </div>
        )}

        {/* Instructions */}
        {!loading && businesses.length > 0 && !selectedBusinessId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Ready to Enter Hours</h3>
            <p className="text-blue-700">
              Select a business from the dropdown above to enter your hours for {formatWeekRange(currentWeek)}
            </p>
          </div>
        )}

        {/* Daily Hours and Earnings - Show when business is selected */}
        {selectedBusinessId && (
          <div className="mt-8 space-y-8">
            {/* Daily Hours Input - Now at top */}
            <WeeklyHoursInput
              businessId={selectedBusinessId}
              weekStart={currentWeek}
            />
            
            {/* Weekly Earnings Table - Now at bottom */}
            <EmployeeEarningsTable
              businessId={selectedBusinessId}
              weekStart={currentWeek}
              weekEnd={getWeekEndDate(currentWeek)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <nav className="flex gap-2 sm:gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none sm:min-w-[180px] px-4 sm:px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
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
