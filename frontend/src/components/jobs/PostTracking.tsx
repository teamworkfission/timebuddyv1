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
import { BusinessTileView } from './BusinessTileView';

export function PostTracking() {
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
                {selectedBusinessId ? `${selectedBusinessName} - Post Tracking` : 'Post Tracking'}
              </h2>
              <p className="text-gray-600">
                {selectedBusinessId 
                  ? `Monitor job posts and applicants for ${selectedBusinessName}`
                  : 'Monitor your job posts and applicants'
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
        <BusinessTileView onBusinessSelect={handleBusinessSelect} />
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

                {/* Job Applications - Only show applied and reviewed, with action buttons */}
                <ApplicationsList 
                  jobPostId={job.id} 
                  jobTitle={job.job_title}
                  statusFilter={['applied', 'reviewed']}
                  showActionButtons={true}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
