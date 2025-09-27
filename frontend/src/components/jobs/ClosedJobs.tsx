import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { 
  JobPost, 
  getJobPosts, 
  updateJobPost, 
  deleteJobPost,
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS
} from '../../lib/jobs-api';
import { ApplicationsList } from './ApplicationsList';

export function ClosedJobs() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>('');
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'reopen';
    jobId: string;
    jobTitle: string;
  }>({
    isOpen: false,
    type: 'delete',
    jobId: '',
    jobTitle: ''
  });

  useEffect(() => {
    loadJobs();
  }, [selectedBusinessId]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      // Only get jobs with 'closed' status
      const jobData = await getJobPosts(
        'closed',
        selectedBusinessId || undefined
      );
      setJobs(jobData);
    } catch (error) {
      console.error('Failed to load closed jobs:', error);
      setError('Failed to load closed job posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async (jobId: string, jobTitle: string) => {
    setConfirmationModal({
      isOpen: true,
      type: 'reopen',
      jobId,
      jobTitle
    });
  };

  const handleDelete = async (jobId: string, jobTitle: string) => {
    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      jobId,
      jobTitle
    });
  };

  const confirmAction = async () => {
    try {
      if (confirmationModal.type === 'delete') {
        await deleteJobPost(confirmationModal.jobId);
      } else if (confirmationModal.type === 'reopen') {
        await updateJobPost(confirmationModal.jobId, { status: 'published' });
      }
      loadJobs(); // Reload to reflect changes
    } catch (error) {
      console.error(`Failed to ${confirmationModal.type} job:`, error);
      setError(`Failed to ${confirmationModal.type} job post. Please try again.`);
    }
  };

  const handleBusinessSelect = (businessId: string, businessName: string) => {
    setSelectedBusinessId(businessId);
    setSelectedBusinessName(businessName);
  };

  const handleBackToBusinesses = () => {
    setSelectedBusinessId(null);
    setSelectedBusinessName('');
  };

  const formatPay = (job: JobPost) => {
    const currency = job.pay_currency === 'USD' ? '$' : job.pay_currency;
    const payType = job.pay_type === 'hourly' ? '/hr' : '/year';
    
    if (job.pay_max && job.pay_max !== job.pay_min) {
      return `${currency}${job.pay_min} - ${currency}${job.pay_max}${payType}`;
    }
    return `${currency}${job.pay_min}${payType}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2">Loading closed jobs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <div className="flex items-center space-x-4">
            {selectedBusinessId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToBusinesses}
                className="flex items-center space-x-2"
              >
                <span>←</span>
                <span>All Businesses</span>
              </Button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedBusinessId ? selectedBusinessName : 'Closed Jobs'}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Business Tile View or Job Posts List */}
      {!selectedBusinessId ? (
        <ClosedBusinessTileView onBusinessSelect={handleBusinessSelect} />
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <span className="text-6xl">📁</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No closed jobs found</h3>
          <p className="text-gray-500 mb-6">
            No job posts have been closed for this business yet.
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Go to Post Tracking
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                {/* Job Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {job.job_title}
                      </h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS]}
                      </span>
                    </div>
                    {!selectedBusinessId && (
                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        <span className="flex items-center space-x-1">
                          <span>🏢</span>
                          <span>{job.business_name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>📍</span>
                          <span>{job.location}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>💼</span>
                          <span>{JOB_TYPE_LABELS[job.job_type as keyof typeof JOB_TYPE_LABELS]}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReopen(job.id, job.job_title)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      Reopen
                    </Button>
                    <button
                      onClick={() => handleDelete(job.id, job.job_title)}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-red-600 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">💰</span>
                    <span className="text-sm">
                      <span className="font-medium">{formatPay(job)}</span>
                    </span>
                  </div>
                  {job.expected_hours_per_week && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">⏰</span>
                      <span className="text-sm">
                        <span className="font-medium">{job.expected_hours_per_week}h/week</span>
                      </span>
                    </div>
                  )}
                  {job.schedule && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">📅</span>
                      <span className="text-sm font-medium">{job.schedule}</span>
                    </div>
                  )}
                </div>

                {/* Benefits & Supplemental Pay */}
                {(job.benefits.length > 0 || job.supplemental_pay.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.benefits.map((benefit) => (
                      <span
                        key={benefit}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {benefit.replace('_', ' ')}
                      </span>
                    ))}
                    {job.supplemental_pay.map((pay) => (
                      <span
                        key={pay}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        {pay}
                      </span>
                    ))}
                  </div>
                )}

                {/* Job Description Preview */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {job.job_description}
                  </p>
                </div>

                {/* Timestamps */}
                <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                  <span>Created: {new Date(job.created_at).toLocaleDateString()}</span>
                  {job.published_at && (
                    <span>Published: {new Date(job.published_at).toLocaleDateString()}</span>
                  )}
                  {job.closed_at && (
                    <span>Closed: {new Date(job.closed_at).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Applications List - Show all applications for closed jobs */}
                <ApplicationsList 
                  key={`closed-applications-${job.id}`}
                  jobPostId={job.id} 
                  jobTitle={job.job_title}
                  statusFilter={['applied', 'reviewed', 'shortlisted', 'interviewed', 'hired', 'rejected']}
                  showActionButtons={false}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmAction}
        title={confirmationModal.type === 'delete' ? '⚠️ Are you sure?' : '🔄 Reopen Job Post?'}
        message={
          confirmationModal.type === 'delete'
            ? `Deleting "${confirmationModal.jobTitle}" will permanently remove it from the employee view and cannot be undone.`
            : `Reopening "${confirmationModal.jobTitle}" will make it visible to employees again and change its status to Published.`
        }
        confirmText={confirmationModal.type === 'delete' ? 'Delete' : 'Reopen'}
        type={confirmationModal.type === 'delete' ? 'danger' : 'warning'}
      />
    </div>
  );
}

// Custom Business Tile View for Closed Jobs - only shows businesses with closed jobs
function ClosedBusinessTileView({ onBusinessSelect }: { onBusinessSelect: (businessId: string, businessName: string) => void }) {
  const [businessStats, setBusinessStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClosedBusinessStats();
  }, []);

  const loadClosedBusinessStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get only closed jobs
      const closedJobs = await getJobPosts('closed');
      
      // Group by business and create stats
      const businessStatsMap = new Map();
      
      closedJobs.forEach(job => {
        const businessId = job.business_id;
        if (!businessStatsMap.has(businessId)) {
          businessStatsMap.set(businessId, {
            business_id: businessId,
            business_name: job.business_name,
            business_type: job.business_type,
            location: job.location,
            closed_jobs: 0,
            total_applications: 0
          });
        }
        
        const stats = businessStatsMap.get(businessId);
        stats.closed_jobs += 1;
      });
      
      setBusinessStats(Array.from(businessStatsMap.values()));
    } catch (err) {
      console.error('Failed to load closed business stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load business statistics');
    } finally {
      setLoading(false);
    }
  };

  const getBusinessTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      restaurant: '🍽️',
      gas_station: '⛽',
      retail_store: '🏪',
      grocery_store: '🛒',
      convenience_store: '🏪',
      pharmacy: '💊',
      coffee_shop: '☕',
      fast_food: '🍔',
      delivery_service: '🚚',
      warehouse: '🏭',
      office: '🏢',
      other: '🏬',
    };
    return icons[type] || '🏬';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading closed jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-red-400">⚠️</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (businessStats.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <span className="text-6xl">📁</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No closed jobs yet</h3>
        <p className="text-gray-500 mb-6">
          When you close job posts, they'll appear here organized by business.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Business Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {businessStats.map((business) => (
          <div
            key={business.business_id}
            onClick={() => onBusinessSelect(business.business_id, business.business_name)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-red-300 transition-all duration-200 cursor-pointer overflow-hidden"
          >
            {/* Header with Business Type */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{getBusinessTypeIcon(business.business_type)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-white truncate">{business.business_name}</h3>
                  <p className="text-red-100 text-sm truncate">
                    {business.business_type?.replace('_', ' ') || 'Business'}
                  </p>
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="p-4">
              <div className="space-y-3">
                {/* Location */}
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📍</span>
                  <span className="truncate">{business.location}</span>
                </div>

                {/* Closed Jobs Statistics */}
                <div className="grid grid-cols-1 gap-3 pt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{business.closed_jobs}</div>
                    <div className="text-xs text-gray-600">Closed Jobs</div>
                  </div>
                </div>

                {/* Click Indicator */}
                <div className="pt-2 text-center border-t border-gray-100">
                  <span className="text-xs text-red-600 font-medium">Click to view closed jobs →</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
