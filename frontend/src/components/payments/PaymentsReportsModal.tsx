import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Business } from '../../lib/business-api';
import { PaymentsTab } from './PaymentsTab';
import { ReportsTab } from './ReportsTab';

interface PaymentsReportsModalProps {
  business: Business;
  onClose: () => void;
}

type TabType = 'payments' | 'reports';

export function PaymentsReportsModal({ business, onClose }: PaymentsReportsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('payments');

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent scroll on body when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const TabButton = ({ 
    tab, 
    children, 
    icon 
  }: { 
    tab: TabType; 
    children: React.ReactNode; 
    icon: string; 
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${activeTab === tab
          ? 'bg-white bg-opacity-20 text-white shadow-md'
          : 'text-blue-100 hover:text-white hover:bg-white hover:bg-opacity-10'
        }
      `}
    >
      <span className="text-lg">{icon}</span>
      <span className="hidden sm:inline">{children}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 p-4 sm:p-6 text-white flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold truncate">Payments & Reports</h2>
              <p className="text-green-100 text-sm sm:text-base truncate mt-1">{business.name}</p>
            </div>
            <button 
              onClick={onClose} 
              className="ml-4 text-white hover:text-gray-200 p-1 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors flex-shrink-0"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Tab Navigation - Mobile Responsive */}
          <div className="flex space-x-1 mt-4 overflow-x-auto">
            <TabButton tab="payments" icon="💰">
              Payments
            </TabButton>
            <TabButton tab="reports" icon="📊">
              Reports
            </TabButton>
          </div>
        </div>
        
        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {activeTab === 'payments' ? (
              <PaymentsTab business={business} />
            ) : (
              <ReportsTab business={business} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
