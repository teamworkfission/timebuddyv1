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
import { getApplicationsByJobPost } from '../../lib/job-applications-api';
import { ApplicationsList } from './ApplicationsList';

export function PostTracking() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>('');
  
  // Expanded jobs state for mobile collapsible cards
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  
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
      const jobData = await getJobPosts(
        filter === 'all' ? undefined : filter,
        selectedBusinessId || undefined
      );
      // Filter out closed jobs - they should only appear in Closed tab
      const filteredJobs = jobData.filter(job => job.status !== 'closed');
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

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading job posts...</span>
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
                {selectedBusinessId ? selectedBusinessName : 'Post Tracking'}
              </h2>
            </div>
          </div>
        </div>
        
        {selectedBusinessId && (
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              {(['all', 'draft', 'published'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {status === 'all' ? 'All' : JOB_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        )}
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
        <PostTrackingBusinessTileView onBusinessSelect={handleBusinessSelect} />
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <span className="text-6xl">📋</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No job posts found</h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? "You haven't created any job posts yet."
              : `No ${filter} job posts found.`
            }
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Create Your First Job Post
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {jobs.map((job) => {
            const isExpanded = expandedJobs.has(job.id);
            
            return (
              <div
                key={job.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  {/* Job Header - Always Visible */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2">
                        <div className="flex items-center space-x-3 mb-1 sm:mb-0">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {job.job_title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                            {JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS]}
                          </span>
                        </div>
                        <span className="flex items-center space-x-1 text-sm text-gray-600">
                          <span>💼</span>
                          <span>{JOB_TYPE_LABELS[job.job_type as keyof typeof JOB_TYPE_LABELS]}</span>
                        </span>
                      </div>
                      {/* Only show business info when not in specific business context */}
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

                  {/* Essential Info - Always Visible on Mobile */}
                  <div className="sm:hidden">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="flex items-center space-x-1 text-green-600 font-medium">
                        <span>💰</span>
                        <span>{formatPay(job)}</span>
                      </span>
                      <div className="flex items-center space-x-3">
                        {job.expected_hours_per_week && (
                          <span className="flex items-center space-x-1 text-blue-600">
                            <span>⏰</span>
                            <span>{job.expected_hours_per_week}h/week</span>
                          </span>
                        )}
                        {job.schedule && (
                          <span className="flex items-center space-x-1 text-purple-600 text-xs">
                            <span>📅</span>
                            <span>{job.schedule}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Toggle Button for Mobile */}
                    <button
                      onClick={() => toggleJobExpansion(job.id)}
                      className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-blue-600 hover:text-blue-700 border-t border-b border-gray-200 transition-colors"
                    >
                      <span>{isExpanded ? 'Show Less' : 'Show Details'}</span>
                      <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ↓
                      </span>
                    </button>
                  </div>

                  {/* Collapsible Content */}
                  <div className={`${isExpanded || 'sm:block'} ${!isExpanded && 'hidden'} sm:block`}>
                    {/* Job Details - Desktop Only or Mobile Expanded */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 sm:mt-0 mt-4">
                      {/* Show pay/hours on desktop or when there's no mobile summary */}
                      <div className="hidden sm:flex items-center space-x-2">
                        <span className="text-gray-500">💰</span>
                        <span className="text-sm">
                          <span className="font-medium">{formatPay(job)}</span>
                        </span>
                      </div>
                      {job.expected_hours_per_week && (
                        <div className="hidden sm:flex items-center space-x-2">
                          <span className="text-gray-500">⏰</span>
                          <span className="text-sm">
                            <span className="font-medium">{job.expected_hours_per_week}h/week</span>
                          </span>
                        </div>
                      )}
                      {job.schedule && (
                        <div className="hidden sm:flex items-center space-x-2">
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
                  </div>

                  {/* Job Applications - Always Visible */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <ApplicationsList 
                      key={`applications-${job.id}`}
                      jobPostId={job.id} 
                      jobTitle={job.job_title}
                      statusFilter={['applied', 'reviewed']}
                      showActionButtons={true}
                    />
                  </div>
                </div>
              </div>
            );
          })}
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

// Custom Business Tile View for Post Tracking - only shows businesses with applied/reviewed applications from non-closed jobs
function PostTrackingBusinessTileView({ onBusinessSelect }: { onBusinessSelect: (businessId: string, businessName: string) => void }) {
  const [businessStats, setBusinessStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPostTrackingBusinessStats();
  }, []);

  const loadPostTrackingBusinessStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all non-closed jobs
      const allJobs = await getJobPosts(undefined);
      const nonClosedJobs = allJobs.filter(job => job.status !== 'closed');
      
      // Group by business and create stats
      const businessStatsMap = new Map();
      
      // For each non-closed job, count only applied/reviewed applications
      for (const job of nonClosedJobs) {
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
            applied_applications: 0,
            reviewed_applications: 0,
            total_applications: 0
          });
        }
        
        const stats = businessStatsMap.get(businessId);
        stats.total_jobs += 1;
        
        if (job.status === 'published') stats.published_jobs += 1;
        else if (job.status === 'draft') stats.draft_jobs += 1;
        
        // Count only applied and reviewed applications for this job
        try {
          const applications = await getApplicationsByJobPost(job.id);
          const appliedCount = applications.filter(app => app.status === 'applied').length;
          const reviewedCount = applications.filter(app => app.status === 'reviewed').length;
          
          stats.applied_applications += appliedCount;
          stats.reviewed_applications += reviewedCount;
          stats.total_applications += (appliedCount + reviewedCount);
        } catch (appError) {
          console.warn(`Failed to load applications for job ${job.id}:`, appError);
        }
      }
      
      // Only include businesses that have applied/reviewed applications or at least one job
      const businessesWithRelevantData = Array.from(businessStatsMap.values()).filter(
        business => business.total_jobs > 0
      );
      
      setBusinessStats(businessesWithRelevantData);
    } catch (err) {
      console.error('Failed to load post tracking business stats:', err);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post tracking statistics...</p>
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
          <span className="text-6xl">🏢</span>
        </div>
        <p className="text-gray-500 mb-6">
          Create your  job post to start tracking applications.
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
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white text-lg">
                  {getBusinessTypeIcon(business.business_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                    {business.business_name}
                  </h3>
                  <p className="text-blue-100 text-xs capitalize">
                    {business.business_type.replace('_', ' ')}
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

                {/* Job Statistics */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{business.total_jobs}</div>
                    <div className="text-xs text-gray-600">Job Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{business.total_applications}</div>
                    <div className="text-xs text-gray-600">New Applications</div>
                  </div>
                </div>

                {/* Click Indicator */}
                <div className="pt-2 text-center">
                  <span className="text-xs text-blue-600 font-medium">Click to view jobs →</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
