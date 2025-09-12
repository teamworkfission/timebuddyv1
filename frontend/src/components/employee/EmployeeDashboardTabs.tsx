import { useState } from 'react';
import { EmployeeHome } from './EmployeeHome';
import { EmployeeSchedule } from './EmployeeSchedule';
import { EmployeeEarnings } from './EmployeeEarnings';

interface EmployeeDashboardTabsProps {
  userEmail?: string;
  onLogout: () => void;
  onShowProfile: () => void;
}

type TabType = 'home' | 'schedule' | 'earnings';

export function EmployeeDashboardTabs({ userEmail, onLogout, onShowProfile }: EmployeeDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: '🏠' },
    { id: 'schedule' as TabType, label: 'Schedule', icon: '📅' },
    { id: 'earnings' as TabType, label: 'Earnings', icon: '💰' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <EmployeeHome />;
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
            <span className="text-sm text-gray-600">
              👋 {userEmail}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onShowProfile}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
            >
              👤 Profile
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Logout
            </button>
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
