import { useState } from 'react';
import { Button } from '../ui/Button';
import { JoinRequests } from './JoinRequests';

type ScheduleTabType = 'schedule' | 'join-requests';

export function EmployeeSchedule() {
  const [activeTab, setActiveTab] = useState<ScheduleTabType>('schedule');

  const tabs = [
    { id: 'schedule' as ScheduleTabType, label: 'My Schedule', icon: '📅' },
    { id: 'join-requests' as ScheduleTabType, label: 'Join Requests', icon: '📨' }
  ];

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
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                  <span className="text-4xl">📅</span>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Schedule Management
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                View your work schedule, manage shift preferences, and coordinate with local employers. 
                This feature is coming soon to help you organize your gig work efficiently.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto mb-8">
                <h3 className="text-lg font-medium text-blue-900 mb-3">
                  Coming Soon Features
                </h3>
                <ul className="text-sm text-blue-700 space-y-2 text-left">
                  <li>• View and manage your work schedule</li>
                  <li>• Set availability preferences</li>
                  <li>• Coordinate shifts with multiple employers</li>
                  <li>• Receive schedule notifications</li>
                  <li>• Request time off or schedule changes</li>
                  <li>• Track your working hours</li>
                </ul>
              </div>

              <div className="space-x-4">
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  ← Go Back
                </Button>
              </div>
            </div>
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
