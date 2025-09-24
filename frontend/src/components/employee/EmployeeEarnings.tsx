import { useState, useEffect } from 'react';
import { WeeklyHoursInput } from './WeeklyHoursInput';
import { 
  getCurrentWeekStart,
  getNextWeek,
  getPreviousWeek,
  formatWeekRange,
  getConfirmedHoursList,
  ConfirmedHoursRecord
} from '../../lib/confirmed-hours-api';
import { EmployeeSchedulesAPI } from '../../lib/schedules-api';
import { ChevronLeft, ChevronRight, Calendar, Clock, TrendingUp, CheckCircle } from 'lucide-react';

interface Business {
  business_id: string;
  name: string;
}

type EarningsView = 'overview' | 'input';

export function EmployeeEarnings() {
  const [currentView, setCurrentView] = useState<EarningsView>('overview');
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekStart());
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [recentHours, setRecentHours] = useState<ConfirmedHoursRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentView === 'overview') {
      loadRecentHours();
      loadBusinesses();
    }
  }, [currentView, currentWeek]);

  const loadRecentHours = async () => {
    try {
      setLoading(true);
      const hours = await getConfirmedHoursList();
      setRecentHours(hours.slice(0, 10)); // Last 10 records
    } catch (error) {
      console.error('Failed to load recent hours:', error);
    } finally {
      setLoading(false);
    }
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
    setCurrentWeek(prev => 
      direction === 'prev' ? getPreviousWeek(prev) : getNextWeek(prev)
    );
  };

  const handleBusinessSelect = (businessId: string) => {
    setSelectedBusinessId(businessId);
    setCurrentView('input');
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
    setSelectedBusinessId(null);
    loadRecentHours(); // Refresh data
  };

  // Get business name by ID
  const getBusinessName = (businessId: string): string => {
    const business = businesses.find(b => b.business_id === businessId);
    return business?.name || 'Unknown Business';
  };

  const getStatusColor = (status: 'draft' | 'submitted' | 'approved') => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'submitted': return 'text-blue-600 bg-blue-100';
      case 'approved': return 'text-green-600 bg-green-100';
    }
  };

  const getStatusIcon = (status: 'draft' | 'submitted' | 'approved') => {
    switch (status) {
      case 'draft': return '📝';
      case 'submitted': return '⏳';
      case 'approved': return '✅';
    }
  };

  // Show input view
  if (currentView === 'input' && selectedBusinessId) {
    return (
      <WeeklyHoursInput
        businessId={selectedBusinessId}
        weekStart={currentWeek}
        onBack={handleBackToOverview}
      />
    );
  }

  // Show overview
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hours & Earnings</h1>
            <p className="text-gray-600 mt-2">
              Track your actual hours worked and submit them for payroll approval
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Week Navigation */}
            <div className="flex items-center bg-white rounded-lg shadow-sm border">
              <button
                onClick={() => handleWeekNavigation('prev')}
                className="p-2 hover:bg-gray-50 rounded-l-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="px-4 py-2 flex items-center space-x-2 min-w-[200px] justify-center">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{formatWeekRange(currentWeek)}</span>
              </div>
              <button
                onClick={() => handleWeekNavigation('next')}
                className="p-2 hover:bg-gray-50 rounded-r-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">--h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">--h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {recentHours.filter(h => h.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Businesses Section */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Businesses</h2>
          <p className="text-sm text-gray-600 mt-1">
            Select a business to enter hours for the selected week
          </p>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-gray-600">Loading your businesses...</p>
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Businesses Found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                You don't have any business associations yet. Contact your employer to get added to their business.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businesses.map((business) => (
                <div
                  key={business.business_id}
                  onClick={() => handleBusinessSelect(business.business_id)}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{business.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Week of {formatWeekRange(currentWeek)}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Hours History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Hours</h2>
          <p className="text-sm text-gray-600 mt-1">
            Your latest hour submissions and their approval status
          </p>
        </div>
        
        <div className="overflow-x-auto">
          {recentHours.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Hours Recorded</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                You haven't submitted any hours yet. Use the businesses section above to get started.
              </p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentHours.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatWeekRange(record.week_start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getBusinessName(record.business_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-medium">{record.total_hours}h</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        <span className="mr-1">{getStatusIcon(record.status)}</span>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
