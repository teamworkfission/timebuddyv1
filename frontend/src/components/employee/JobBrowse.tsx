import { useState, useEffect } from 'react';
import { PublicJobPost, JobSearchParams, searchPublicJobs, JobSearchResponse } from '../../lib/public-job-api';
import { getAppliedJobStatuses } from '../../lib/job-applications-api';
import { JobCard } from './JobCard';
import { LocationFilter } from './LocationFilter';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface JobBrowseState {
  jobs: PublicJobPost[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  hasNextPage: boolean;
}

interface JobBrowseProps {
  initialSearchParams?: Partial<JobSearchParams>;
  autoLoad?: boolean;
}

export function JobBrowse({ initialSearchParams, autoLoad = false }: JobBrowseProps) {
  const [searchParams, setSearchParams] = useState<JobSearchParams>({
    keywords: initialSearchParams?.keywords || '',
    state: initialSearchParams?.state || '',
    city: initialSearchParams?.city || '',
    county: initialSearchParams?.county || '',
    page: initialSearchParams?.page || 1,
    limit: initialSearchParams?.limit || 20
  });

  const [jobState, setJobState] = useState<JobBrowseState>({
    jobs: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    hasNextPage: false
  });

  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [appliedStatuses, setAppliedStatuses] = useState<Record<string, boolean>>({});

  // Load jobs when search params change
  useEffect(() => {
    loadJobs();
  }, [searchParams]);

  // Initial load - only if autoLoad is true
  useEffect(() => {
    if (autoLoad) {
      loadJobs();
    }
  }, [autoLoad]);

  const loadJobs = async (loadMore = false) => {
    setJobState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const currentPage = loadMore ? jobState.pagination.page + 1 : searchParams.page || 1;
      const response: JobSearchResponse = await searchPublicJobs({
        ...searchParams,
        page: currentPage
      });

      const allJobs = loadMore ? [...jobState.jobs, ...response.jobs] : response.jobs;
      
      setJobState(prev => ({
        ...prev,
        jobs: allJobs,
        pagination: response.pagination,
        hasNextPage: response.pagination.page < response.pagination.totalPages,
        loading: false
      }));

      // Fetch applied statuses for all jobs
      try {
        const jobIds = allJobs.map(job => job.id);
        const statuses = await getAppliedJobStatuses(jobIds);
        setAppliedStatuses(statuses);
      } catch (statusError) {
        console.warn('Failed to load applied statuses:', statusError);
        // Don't fail the whole operation if status check fails
      }

    } catch (error) {
      setJobState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load jobs',
        loading: false
      }));
    }
  };

  const handleSearch = (keywords: string) => {
    setSearchParams(prev => ({ ...prev, keywords, page: 1 }));
    setExpandedJobId(null); // Collapse any expanded cards
  };

  const handleLocationChange = (location: { state?: string; city?: string; county?: string }) => {
    setSearchParams(prev => ({ 
      ...prev, 
      state: location.state || '',
      city: location.city || '',
      county: location.county || '',
      page: 1
    }));
    setExpandedJobId(null);
    setShowLocationFilter(false);
  };

  const clearLocationFilter = () => {
    setSearchParams(prev => ({ 
      ...prev, 
      state: '',
      city: '',
      county: '',
      page: 1
    }));
    setExpandedJobId(null);
  };

  const handleCardToggle = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const loadMoreJobs = () => {
    loadJobs(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">PtimeBuddy Jobs</h1>
          
          {/* Search Bar */}
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Search jobs (e.g., cashier, server, data entry)"
              value={searchParams.keywords || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
            
            {/* Or divider */}
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-200"></div>
              <div className="px-4 text-sm text-gray-500 font-medium">or</div>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* Location and Search Button Row */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLocationFilter(true)}
                className="flex-1 flex items-center justify-center gap-2"
              >
                📍 Browse Local Jobs
                {searchParams.state || searchParams.city || searchParams.county 
                  ? ` (${searchParams.city || searchParams.state}${searchParams.county ? `, ${searchParams.county}` : ''})`
                  : ''
                }
              </Button>
              <Button
                onClick={() => loadJobs()}
                className="px-6 bg-blue-600 hover:bg-blue-700"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Active filters display */}
          {(searchParams.state || searchParams.city || searchParams.county) && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-gray-600">Filters:</span>
              <div className="flex items-center gap-2">
                {searchParams.state && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {searchParams.state}
                  </span>
                )}
                {searchParams.city && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {searchParams.city}
                  </span>
                )}
                {searchParams.county && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {searchParams.county}
                  </span>
                )}
                <button
                  onClick={clearLocationFilter}
                  className="text-gray-500 hover:text-gray-700 ml-1"
                >
                  ✖️
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Results Summary */}
        {!jobState.loading && jobState.jobs.length > 0 && (
          <div className="mb-4">
            <p className="text-gray-600">
              Showing {jobState.jobs.length} of {jobState.pagination.total} jobs
              {searchParams.keywords && ` for "${searchParams.keywords}"`}
              {(searchParams.state || searchParams.city) && 
                ` in ${searchParams.city || searchParams.state}`
              }
            </p>
          </div>
        )}

        {/* Error State */}
        {jobState.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error: {jobState.error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadJobs()}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Job Feed */}
        <div className="space-y-4">
          {jobState.jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isExpanded={expandedJobId === job.id}
              onToggleExpanded={() => handleCardToggle(job.id)}
              hasApplied={appliedStatuses[job.id] || false}
            />
          ))}
        </div>

        {/* Loading State */}
        {jobState.loading && (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Loading jobs...</div>
          </div>
        )}

        {/* Empty State */}
        {!jobState.loading && jobState.jobs.length === 0 && !jobState.error && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or location filters.
            </p>
            {(searchParams.keywords || searchParams.state || searchParams.city || searchParams.county) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchParams({ keywords: '', state: '', city: '', county: '', page: 1, limit: 20 });
                }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}

        {/* Load More Button */}
        {!jobState.loading && jobState.hasNextPage && jobState.jobs.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              onClick={loadMoreJobs}
              className="px-8"
            >
              Load More Jobs
            </Button>
          </div>
        )}
      </main>

      {/* Location Filter Modal */}
      {showLocationFilter && (
        <LocationFilter
          currentLocation={{
            state: searchParams.state || '',
            city: searchParams.city || '',
            county: searchParams.county || ''
          }}
          onLocationChange={handleLocationChange}
          onClose={() => setShowLocationFilter(false)}
        />
      )}
    </div>
  );
}
