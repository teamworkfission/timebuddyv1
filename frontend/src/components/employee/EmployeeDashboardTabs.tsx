import { useState } from 'react';
import { EmployeeHome } from './EmployeeHome';
import { EmployeeSchedule } from './EmployeeSchedule';
import { EmployeeEarnings } from './EmployeeEarnings';
import { MyJobs } from './MyJobs';
import { ProfileDropdown } from '../ui/ProfileDropdown';

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

  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: '🏠' },
    { id: 'myjobs' as TabType, label: 'My Jobs', icon: '💼' },
    { id: 'schedule' as TabType, label: 'Schedule', icon: '📅' },
    { id: 'earnings' as TabType, label: 'Earnings', icon: '💰' }
  ];

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
