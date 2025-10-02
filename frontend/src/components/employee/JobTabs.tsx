import { ReactNode } from 'react';

export type JobTabType = 'saved' | 'applied';

interface JobTab {
  id: JobTabType;
  label: string;
  icon: string;
  count?: number;
}

interface JobTabsProps {
  activeTab: JobTabType;
  onTabChange: (tab: JobTabType) => void;
  savedJobsCount?: number;
  appliedJobsCount?: number;
  children?: ReactNode;
}

export function JobTabs({ 
  activeTab, 
  onTabChange, 
  savedJobsCount = 0, 
  appliedJobsCount = 0, 
  children 
}: JobTabsProps) {
  const tabs: JobTab[] = [
    { 
      id: 'saved', 
      label: 'Saved Jobs', 
      icon: '💾',
      count: savedJobsCount 
    },
    { 
      id: 'applied', 
      label: 'Applied Jobs', 
      icon: '📄',
      count: appliedJobsCount 
    }
  ];

  return (
    <div>
      {/* Tab Navigation - Mobile Optimized */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="px-2 py-2">
          <nav className="flex gap-2 sm:gap-3">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex-1 sm:flex-none sm:min-w-[180px] px-3 sm:px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-lg">{tab.icon}</span>
                    <span className="text-xs sm:text-sm">{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`py-0.5 px-2 rounded-full text-xs font-bold ${
                        isActive
                          ? 'bg-white bg-opacity-30 text-white'
                          : 'bg-purple-200 text-purple-800'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {children}
    </div>
  );
}
