import { useState, useEffect } from 'react';
import { JobCard } from './JobCard';
import { Button } from '../ui/Button';
import { getJobApplications, JobApplicationWithJobDetails, APPLICATION_STATUS_LABELS, getStatusColorClass } from '../../lib/job-applications-api';

export function AppliedJobs() {
  const [appliedJobs, setAppliedJobs] = useState<JobApplicationWithJobDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  useEffect(() => {
    loadAppliedJobs();
    
    // Listen for new job applications
    const handleNewApplication = () => {
      loadAppliedJobs();
    };
    
    window.addEventListener('jobApplicationSubmitted', handleNewApplication);
    
    return () => {
      window.removeEventListener('jobApplicationSubmitted', handleNewApplication);
    };
  }, []);

  const loadAppliedJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const applications = await getJobApplications();
      // Sort by application date (most recent first)
      const sortedApplications = applications.sort((a, b) => 
        new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
      );
      setAppliedJobs(sortedApplications);
    } catch (err) {
      console.error('Failed to load applied jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load applied jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleCardToggle = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const renderJobsList = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Loading applied jobs...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">
            <span className="text-6xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to Load Applications
          </h3>
          <p className="text-gray-500 mb-6">
            {error}
          </p>
          <Button 
            variant="outline" 
            onClick={loadAppliedJobs}
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (appliedJobs.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <span className="text-6xl">📄</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No applications yet
          </h3>
          <p className="text-gray-500 mb-6">
            Jobs you apply to will appear here with their current status.
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
        {appliedJobs.map((application) => {
          // Transform application to job format for JobCard using real data
          const jobForCard = {
            id: application.job_post_id,
            job_title: application.job_title,
            business_name: application.business_name,
            location: application.location,
            job_description: application.job_description,
            job_type: application.job_type,
            pay_type: application.pay_type,
            pay_min: application.pay_min,
            pay_max: application.pay_max,
            pay_currency: application.pay_currency,
            expected_hours_per_week: application.expected_hours_per_week,
            schedule: application.schedule,
            supplemental_pay: application.supplemental_pay || [],
            benefits: application.benefits || [],
            business_type: application.business_type,
            language_preference: application.language_preference,
            transportation_requirement: application.transportation_requirement,
            phone: application.phone,
            email: application.email,
            published_at: application.published_at,
            created_at: application.created_at
          };

          return (
            <div key={application.id} className="relative">
              <JobCard
                job={jobForCard}
                isExpanded={expandedJobId === application.job_post_id}
                onToggleExpanded={() => handleCardToggle(application.job_post_id)}
                isAppliedJobsContext={true}
              />
              {/* Show application status and date */}
              <div className="absolute top-2 right-2 sm:right-12">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColorClass(application.status)}`}>
                  {APPLICATION_STATUS_LABELS[application.status]} {
                    application.status === 'applied' 
                      ? new Date(application.applied_at).toLocaleDateString()
                      : new Date(application.status_updated_at || application.applied_at).toLocaleDateString()
                  }
                </span>
              </div>
              
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Applied Jobs
        </h2>
        <p className="text-gray-600">
          Track the status of your job applications
        </p>
      </div>

      {/* Jobs List */}
      {renderJobsList()}
    </div>
  );
}
