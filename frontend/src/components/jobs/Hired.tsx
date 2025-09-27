import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { 
  JobPost, 
  getJobsWithApplicationStatus, 
  updateJobPost, 
  deleteJobPost,
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS
} from '../../lib/jobs-api';
import { getApplicationsByJobPost } from '../../lib/job-applications-api';
import { ApplicationsList } from './ApplicationsList';

export function Hired() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>('');
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'close' | 'delete';
    jobId: string;
    jobTitle: string;
  }>({
    isOpen: false,
    type: 'close',
    jobId: '',
    jobTitle: ''
  });

  useEffect(() => {
    loadJobs();
  }, [filter, selectedBusinessId]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      // Only get jobs that have hired applications
      const jobData = await getJobsWithApplicationStatus(
        ['hired'],
        selectedBusinessId || undefined
      );
      
      // Apply status filter if not 'all' and filter out closed jobs
      const filteredJobs = filter === 'all' 
        ? jobData.filter(job => job.status !== 'closed')
        : jobData.filter(job => job.status === filter && job.status !== 'closed');
      
      setJobs(filteredJobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setError('Failed to load job posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (jobId: string, jobTitle: string) => {
    setConfirmationModal({
      isOpen: true,
      type: 'close',
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
      if (confirmationModal.type === 'close') {
        await updateJobPost(confirmationModal.jobId, { status: 'closed' });
      } else if (confirmationModal.type === 'delete') {
        await deleteJobPost(confirmationModal.jobId);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2">Loading hired employees...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
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
                {selectedBusinessId ? selectedBusinessName : 'Hired Employees'}
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
        <HiredBusinessTileView onBusinessSelect={handleBusinessSelect} />
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <span className="text-6xl">✅</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hired employees found</h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? "No employees have been hired yet."
              : `No hired employees found for ${filter} job posts.`
            }
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS]}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Hired
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
                    {job.status === 'draft' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateJobPost(job.id, { status: 'published' }).then(() => loadJobs())}
                      >
                        Publish
                      </Button>
                    )}
                    {job.status === 'published' && (
                      <button
                        onClick={() => handleClose(job.id, job.job_title)}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-red-600 rounded-lg transition-colors"
                      >
                        Close
                      </button>
                    )}
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

                {/* Hired Applications - Only show hired applications */}
                <HiredApplicationsList key={`hired-applications-${job.id}`} jobPostId={job.id} jobTitle={job.job_title} />
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
        title="⚠️ Are you sure?"
        message={
          confirmationModal.type === 'close'
            ? `Closing "${confirmationModal.jobTitle}" will remove it permanently from the employee view.`
            : `Deleting "${confirmationModal.jobTitle}" will remove it permanently from the employee view and cannot be undone.`
        }
        confirmText={confirmationModal.type === 'close' ? 'Close' : 'Delete'}
        type="danger"
      />
    </div>
  );
}

// Custom Business Tile View for Hired - only shows businesses with hired applications or closed jobs
function HiredBusinessTileView({ onBusinessSelect }: { onBusinessSelect: (businessId: string, businessName: string) => void }) {
  const [businessStats, setBusinessStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHiredBusinessStats();
  }, []);

  const loadHiredBusinessStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get jobs that have hired applications
      const jobsWithHired = await getJobsWithApplicationStatus(['hired']);
      
      // Group by business and create stats
      const businessStatsMap = new Map();
      
      // For each job with hired applications, we need to count the actual hired applications
      for (const job of jobsWithHired) {
        const businessId = job.business_id;
        if (!businessStatsMap.has(businessId)) {
          businessStatsMap.set(businessId, {
            business_id: businessId,
            business_name: job.business_name,
            business_type: job.business_type,
            location: job.location,
            total_jobs: 0,
            published_jobs: 0,
            draft_jobs: 0,
            closed_jobs: 0,
            hired_applications: 0,
            total_applications: 0
          });
        }
        
        const stats = businessStatsMap.get(businessId);
        stats.total_jobs += 1;
        
        if (job.status === 'published') stats.published_jobs += 1;
        else if (job.status === 'draft') stats.draft_jobs += 1;
        else if (job.status === 'closed') stats.closed_jobs += 1;
        
        // Count actual hired applications for this job
        try {
          const applications = await getApplicationsByJobPost(job.id);
          const hiredCount = applications.filter(app => app.status === 'hired').length;
          stats.hired_applications += hiredCount;
          stats.total_applications += hiredCount;
        } catch (appError) {
          console.warn(`Failed to load applications for job ${job.id}:`, appError);
        }
      }
      
      setBusinessStats(Array.from(businessStatsMap.values()));
    } catch (err) {
      console.error('Failed to load hired business stats:', err);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hired employees...</p>
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
          <span className="text-6xl">✅</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hired employees yet</h3>
        <p className="text-gray-500 mb-6">
          When you hire candidates from your job posts, they'll appear here organized by business.
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
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-green-300 transition-all duration-200 cursor-pointer overflow-hidden"
          >
            {/* Header with Business Type */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{getBusinessTypeIcon(business.business_type)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-white truncate">{business.business_name}</h3>
                  <p className="text-green-100 text-sm truncate">
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

                {/* Hired Statistics */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{business.total_jobs || 0}</div>
                    <div className="text-xs text-gray-600">Job Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{business.hired_applications || 0}</div>
                    <div className="text-xs text-gray-600">Hired</div>
                  </div>
                </div>

                {/* Click Indicator */}
                <div className="pt-2 text-center">
                  <span className="text-xs text-green-600 font-medium">Click to view employees →</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Custom Applications List for Hired - only shows hired applications
function HiredApplicationsList({ jobPostId, jobTitle }: { jobPostId: string; jobTitle: string }) {
  return (
    <ApplicationsList 
      key={`applications-list-${jobPostId}`}
      jobPostId={jobPostId} 
      jobTitle={jobTitle}
      statusFilter={['hired']}
      showActionButtons={false}
    />
  );
}
