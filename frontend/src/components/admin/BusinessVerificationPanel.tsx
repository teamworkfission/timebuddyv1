import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { BusinessReviewCard } from './BusinessReviewCard';
import { SupportTicketsPanel } from './SupportTicketsPanel';
import { AdminBusiness, BusinessStats, getPendingBusinesses, getAllBusinesses, getBusinessStats, adminLogout } from '../../lib/admin-api';

export function BusinessVerificationPanel() {
  const [activeMainTab, setActiveMainTab] = useState<'businesses' | 'support'>('businesses');
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [stats, setStats] = useState<BusinessStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [businessesData, statsData] = await Promise.all([
        activeTab === 'pending' ? getPendingBusinesses() : getAllBusinesses(),
        getBusinessStats()
      ]);

      setBusinesses(businessesData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleLogout = () => {
    adminLogout();
    window.location.reload();
  };

  const handleBusinessStatusChange = () => {
    loadData(); // Reload data when business status changes
  };

  if (loading && businesses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Manage business verification and support tickets
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveMainTab('businesses')}
                className={`py-4 text-sm font-medium border-b-2 ${
                  activeMainTab === 'businesses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Business Verification
              </button>
              <button
                onClick={() => setActiveMainTab('support')}
                className={`py-4 text-sm font-medium border-b-2 ${
                  activeMainTab === 'support'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Support Tickets
              </button>
            </nav>
          </div>
        </div>

        {/* Conditional Content Rendering */}
        {activeMainTab === 'businesses' ? (
          <>
            {/* Business Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Businesses</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending Review ({stats.pending})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All Businesses ({stats.total})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
                <button 
                  onClick={loadData}
                  className="ml-4 text-red-600 underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                <span className="text-gray-600">Loading businesses...</span>
              </div>
            )}

            {!loading && businesses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">No businesses found</h3>
                <p className="text-gray-500">
                  {activeTab === 'pending' 
                    ? 'No businesses are currently pending review.'
                    : 'No businesses have been registered yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {businesses.map((business) => (
                  <BusinessReviewCard
                    key={business.business_id}
                    business={business}
                    onStatusChange={handleBusinessStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
          </>
        ) : (
          /* Support Tickets Tab */
          <SupportTicketsPanel />
        )}
      </div>
    </div>
  );
}
