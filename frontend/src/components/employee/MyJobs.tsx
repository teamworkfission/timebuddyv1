import { useState, useEffect } from 'react';
import { JobCard } from './JobCard';
import { Button } from '../ui/Button';
import { PublicJobPost } from '../../lib/public-job-api';

interface SavedJob extends PublicJobPost {
  saved_at: string;
}

export function MyJobs() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  useEffect(() => {
    loadSavedJobs();
    
    // Listen for saved jobs changes
    const handleSavedJobsChange = () => {
      loadSavedJobs();
    };
    
    window.addEventListener('savedJobsChanged', handleSavedJobsChange);
    
    return () => {
      window.removeEventListener('savedJobsChanged', handleSavedJobsChange);
    };
  }, []);

  const loadSavedJobs = async () => {
    setLoading(true);
    try {
      // Load saved jobs from localStorage for now
      const savedJobsData = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      setSavedJobs(savedJobsData);
    } catch (error) {
      console.error('Failed to load saved jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardToggle = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const handleUnsaveJob = async (jobId: string) => {
    try {
      const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      const filteredJobs = savedJobs.filter((savedJob: any) => savedJob.id !== jobId);
      localStorage.setItem('savedJobs', JSON.stringify(filteredJobs));
      
      // Update local state immediately
      setSavedJobs(filteredJobs);
      
      // Trigger custom event to update JobCard states
      window.dispatchEvent(new CustomEvent('savedJobsChanged'));
    } catch (error) {
      console.error('Failed to unsave job:', error);
    }
  };

  const renderJobsList = () => {    
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Loading saved jobs...</div>
        </div>
      );
    }

    if (savedJobs.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <span className="text-6xl">💾</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No saved jobs yet
          </h3>
          <p className="text-gray-500 mb-6">
            Jobs you save will appear here for easy access later.
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              // TODO: Navigate to job browse
              console.log('Navigate to job browse');
            }}
          >
            Browse Jobs
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {savedJobs.map((job) => (
          <div key={job.id} className="relative">
            <JobCard
              job={job}
              isExpanded={expandedJobId === job.id}
              onToggleExpanded={() => handleCardToggle(job.id)}
            />
            {/* Show when job was saved with unsave option */}
            <div className="absolute top-2 right-12 flex items-center gap-2">
              <button
                onClick={() => handleUnsaveJob(job.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm border border-red-500 transition-all duration-200 hover:shadow-md"
                title="Remove from saved jobs"
              >
                ✕ Unsave
              </button>
              <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                Saved {new Date(job.saved_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Saved Jobs
        </h2>
        <p className="text-gray-600">
          Jobs you've saved for later review and application
        </p>
      </div>

      {/* Jobs List */}
      {renderJobsList()}
    </div>
  );
}
