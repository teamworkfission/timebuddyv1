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
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`
                    ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                    ${isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {children}
    </div>
  );
}
