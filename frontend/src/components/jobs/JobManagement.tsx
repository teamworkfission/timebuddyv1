import { useState } from 'react';
import { Button } from '../ui/Button';
import { CreateJobPost } from './CreateJobPost';
import { PostTracking } from './PostTracking';
import { Shortlisted } from './Shortlisted';
import { Hired } from './Hired';

interface JobManagementProps {
  onBack: () => void;
}

type TabType = 'create' | 'tracking' | 'shortlisted' | 'hired';

export function JobManagement({ onBack }: JobManagementProps) {
  const [activeTab, setActiveTab] = useState<TabType>('create');

  const tabs = [
    { id: 'create' as TabType, label: 'Create Job Post', icon: '✏️' },
    { id: 'tracking' as TabType, label: 'Post Tracking', icon: '📊' },
    { id: 'shortlisted' as TabType, label: 'Shortlisted', icon: '📥' },
    { id: 'hired' as TabType, label: 'Hired', icon: '✅' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'create':
        return <CreateJobPost />;
      case 'tracking':
        return <PostTracking />;
      case 'shortlisted':
        return <Shortlisted />;
      case 'hired':
        return <Hired />;
      default:
        return <CreateJobPost />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Back Navigation */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onBack}
                className="flex items-center space-x-2"
              >
                <span>←</span>
                <span>Back to Dashboard</span>
              </Button>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-gray-900">Job Post & Hiring</h1>
              </div>
            </div>

            {/* Mobile title */}
            <div className="sm:hidden">
              <h1 className="text-lg font-semibold text-gray-900">Jobs</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </main>
    </div>
  );
}
