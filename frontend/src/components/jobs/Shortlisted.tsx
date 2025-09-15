import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { 
  JobPost, 
  getJobPosts, 
  updateJobPost, 
  deleteJobPost,
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS
} from '../../lib/jobs-api';
import { ApplicationsList } from './ApplicationsList';

export function Shortlisted() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'closed'>('all');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>('');

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
      setJobs(jobData);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setError('Failed to load job posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: 'published' | 'closed') => {
    try {
      await updateJobPost(jobId, { status: newStatus });
      loadJobs(); // Reload to show updated status
    } catch (error) {
      console.error('Failed to update job status:', error);
      setError('Failed to update job status. Please try again.');
    }
  };

  const handleDelete = async (jobId: string, jobTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteJobPost(jobId);
      loadJobs(); // Reload to reflect deletion
    } catch (error) {
      console.error('Failed to delete job:', error);
      setError('Failed to delete job post. Please try again.');
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2">Loading shortlisted applications...</span>
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
                {selectedBusinessId ? `${selectedBusinessName} - Shortlisted` : 'Shortlisted Applications'}
              </h2>
              <p className="text-gray-600">
                {selectedBusinessId 
                  ? `View shortlisted and interviewed candidates for ${selectedBusinessName}`
                  : 'Manage your shortlisted and interviewed candidates'
                }
              </p>
            </div>
          </div>
        </div>
        
        {selectedBusinessId && (
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              {(['all', 'draft', 'published', 'closed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-orange-600 text-white'
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
        <ShortlistedBusinessTileView onBusinessSelect={handleBusinessSelect} />
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <span className="text-6xl">📥</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shortlisted applications found</h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? "No applications have been shortlisted yet."
              : `No shortlisted applications found for ${filter} job posts.`
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
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Shortlisted
                      </span>
                    </div>
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
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                    {job.status === 'draft' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStatusChange(job.id, 'published')}
                      >
                        Publish
                      </Button>
                    )}
                    {job.status === 'published' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(job.id, 'closed')}
                      >
                        Close
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(job.id, job.job_title)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Delete
                    </Button>
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

                {/* Shortlisted Applications - Only show shortlisted and interviewed */}
                <ShortlistedApplicationsList jobPostId={job.id} jobTitle={job.job_title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Custom Business Tile View for Shortlisted - only shows businesses with shortlisted/interviewed applications
function ShortlistedBusinessTileView({ onBusinessSelect }: { onBusinessSelect: (businessId: string, businessName: string) => void }) {
  const [businessStats, setBusinessStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShortlistedBusinessStats();
  }, []);

  const loadShortlistedBusinessStats = async () => {
    try {
      setLoading(true);
      setError(null);
      // This would need a new API endpoint to get businesses with shortlisted applications
      // For now, we'll use the existing one and filter client-side
      const { getBusinessJobStats } = await import('../../lib/business-api');
      const data = await getBusinessJobStats();
      // Filter to only show businesses that have shortlisted or interviewed applications
      // This is a placeholder - in a real implementation, we'd filter on the backend
      setBusinessStats(data);
    } catch (err) {
      console.error('Failed to load shortlisted business stats:', err);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shortlisted applications...</p>
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
          <span className="text-6xl">📥</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No shortlisted applications yet</h3>
        <p className="text-gray-500 mb-6">
          When you shortlist candidates from your job posts, they'll appear here organized by business.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 mb-1">{businessStats.length}</div>
          <div className="text-sm text-gray-600 font-medium">
            Business{businessStats.length !== 1 ? 'es' : ''}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {businessStats.reduce((sum, b) => sum + (b.shortlisted_applications || 0), 0)}
          </div>
          <div className="text-sm text-gray-600 font-medium">Shortlisted</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {businessStats.reduce((sum, b) => sum + (b.interviewed_applications || 0), 0)}
          </div>
          <div className="text-sm text-gray-600 font-medium">Interviewed</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {businessStats.reduce((sum, b) => sum + b.published_jobs, 0)}
          </div>
          <div className="text-sm text-gray-600 font-medium">Active Jobs</div>
        </div>
      </div>

      {/* Business Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {businessStats.map((business) => (
          <div
            key={business.business_id}
            onClick={() => onBusinessSelect(business.business_id, business.business_name)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-orange-300 transition-all duration-200 cursor-pointer overflow-hidden"
          >
            {/* Header with Business Type */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{getBusinessTypeIcon(business.business_type)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-white truncate">{business.business_name}</h3>
                  <p className="text-orange-100 text-sm truncate">
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

                {/* Shortlisted Statistics */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-600">{business.shortlisted_applications || 0}</div>
                    <div className="text-xs text-gray-600">Shortlisted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">{business.interviewed_applications || 0}</div>
                    <div className="text-xs text-gray-600">Interviewed</div>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Jobs: {business.total_jobs}</span>
                    <span>Published: {business.published_jobs}</span>
                  </div>
                </div>

                {/* Click Indicator */}
                <div className="pt-2 text-center">
                  <span className="text-xs text-orange-600 font-medium">Click to view candidates →</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Custom Applications List for Shortlisted - only shows shortlisted and interviewed applications
function ShortlistedApplicationsList({ jobPostId, jobTitle }: { jobPostId: string; jobTitle: string }) {
  return (
    <ApplicationsList 
      jobPostId={jobPostId} 
      jobTitle={jobTitle}
      statusFilter={['shortlisted', 'interviewed']}
      showActionButtons={true}
    />
  );
}
