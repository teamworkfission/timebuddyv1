import { useState, useEffect } from 'react';
import { PublicJobPost, formatPayRange, formatHoursPerWeek, formatTimeAgo, formatLocation } from '../../lib/public-job-api';
import { BUSINESS_TYPE_LABELS } from '../../lib/business-api';
import { Button } from '../ui/Button';
import { JobApplicationModal } from './JobApplicationModal';

interface JobCardProps {
  job: PublicJobPost;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  isAppliedJobsContext?: boolean;
}

export function JobCard({ job, isExpanded = false, onToggleExpanded, isAppliedJobsContext = false }: JobCardProps) {
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const locationInfo = formatLocation(job.location);

  // Check if job is saved on component mount
  useEffect(() => {
    const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    const isJobSaved = savedJobs.some((savedJob: any) => savedJob.id === job.id);
    setIsSaved(isJobSaved);
  }, [job.id]);

  const handleSaveJob = async () => {
    setIsSaving(true);
    try {
      const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      
      if (isSaved) {
        // Remove from saved jobs
        const filteredJobs = savedJobs.filter((savedJob: any) => savedJob.id !== job.id);
        localStorage.setItem('savedJobs', JSON.stringify(filteredJobs));
        setIsSaved(false);
        // Trigger custom event to refresh MyJobs component
        window.dispatchEvent(new CustomEvent('savedJobsChanged'));
      } else {
        // Add to saved jobs
        const jobWithSavedDate = {
          ...job,
          saved_at: new Date().toISOString()
        };
        savedJobs.push(jobWithSavedDate);
        localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
        setIsSaved(true);
        // Trigger custom event to refresh MyJobs component
        window.dispatchEvent(new CustomEvent('savedJobsChanged'));
      }
    } catch (error) {
      console.error('Failed to save job:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isExpanded) {
    // COMPACT VIEW - Only 3 elements
    return (
      <div 
        className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
        onClick={onToggleExpanded}
      >
        <div className="space-y-2">
          {/* Job Title */}
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {job.job_title}
          </h3>
          
          {/* Business Name */}
          <p className="text-gray-700 truncate">
            🏢 {job.business_name}
          </p>
          
          {/* Location */}
          <p className="text-gray-600 truncate">
            📍 {locationInfo.city}, {locationInfo.state}
          </p>
        </div>
        
        {/* Tap indicator */}
        <div className="flex justify-end mt-3">
          <span className="text-sm text-blue-600">Tap for details →</span>
        </div>
      </div>
    );
  }

  // EXPANDED VIEW - All details
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg">
      {/* Header with close button */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <span className="text-sm text-gray-600">Job Details</span>
        <button 
          onClick={onToggleExpanded}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ✖️
        </button>
      </div>

      <div className="p-6 space-y-4">
        {/* Main Job Info */}
        <div className="space-y-2">
          <h3 
            className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={onToggleExpanded}
            title="Click to collapse job details"
          >
            {job.job_title}
          </h3>
          <p 
            className="text-lg text-gray-700 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={onToggleExpanded}
            title="Click to collapse job details"
          >
            🏢 {job.business_name} <span className="font-bold text-gray-900">({BUSINESS_TYPE_LABELS[job.business_type as keyof typeof BUSINESS_TYPE_LABELS] || job.business_type})</span>
          </p>
          <div className="flex items-center space-x-2">
            <span>📍</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${locationInfo.city}${locationInfo.county ? `, ${locationInfo.county}` : ''}, ${locationInfo.state}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
              title="View on Google Maps"
            >
              {locationInfo.city}
              {locationInfo.county && `, ${locationInfo.county}`}
              , {locationInfo.state}
            </a>
          </div>
        </div>

        {/* Pay and Type Info */}
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-blue-900">Job Type:</span>
              <span className="text-blue-800">{job.job_type === 'full-time' ? 'Full-Time' : 'Part-Time'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-blue-900">Pay:</span>
              <span className="text-blue-800">{formatPayRange(job)}</span>
            </div>
            {job.expected_hours_per_week && (
              <div className="flex justify-between">
                <span className="font-medium text-blue-900">Hours/Week:</span>
                <span className="text-blue-800">{formatHoursPerWeek(job.expected_hours_per_week)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Schedule */}
        {job.schedule && (
          <div className="border-t-2 border-gray-300 pt-4">
            <h4 className="font-semibold text-gray-900 mb-2">Schedule</h4>
            <p className="text-gray-700">{job.schedule}</p>
          </div>
        )}

        {/* Supplemental Pay */}
        {job.supplemental_pay.length > 0 && (
          <div className="border-t-2 border-gray-300 pt-4">
            <h4 className="font-semibold text-gray-900 mb-2">Additional Pay</h4>
            <p className="text-gray-700">{job.supplemental_pay.join(' • ')}</p>
          </div>
        )}

        {/* Benefits */}
        {job.benefits.length > 0 && (
          <div className="border-t-2 border-gray-300 pt-4">
            <h4 className="font-semibold text-gray-900 mb-2">Benefits</h4>
            <p className="text-gray-700">{job.benefits.map(benefit => {
              if (benefit === 'health_insurance') return 'Health Insurance';
              if (benefit === '401k') return '401(k)';
              if (benefit === 'pto') return 'Paid Time Off';
              return benefit;
            }).join(' • ')}</p>
          </div>
        )}

        {/* Job Description */}
        <div className="border-t-2 border-gray-300 pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Job Description</h4>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
            {job.job_description}
          </p>
        </div>

        {/* Requirements */}
        {(job.language_preference || job.transportation_requirement) && (
          <div className="border-t-2 border-gray-300 pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Requirements</h4>
            <div className="space-y-2">
              {job.language_preference && (
                <div>
                  <span className="font-medium text-gray-800">Language:</span>
                  <span className="text-gray-700 ml-2">{job.language_preference}</span>
                </div>
              )}
              {job.transportation_requirement && (
                <div>
                  <span className="font-medium text-gray-800">Transportation:</span>
                  <span className="text-gray-700 ml-2">{job.transportation_requirement}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="border-t-2 border-gray-300 pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-800">Phone:</span>
              <a
                href={`tel:${job.phone}`}
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer ml-2"
                title="Call phone number"
              >
                {job.phone}
              </a>
            </div>
            {job.email && (
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-800">Email:</span>
                <a
                  href={`mailto:${job.email}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer ml-2"
                  title="Send email"
                >
                  {job.email}
                </a>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-800">Posted:</span>
              <span className="text-gray-600 text-sm ml-2">{formatTimeAgo(job.published_at || job.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons - Hidden in applied jobs context */}
        {!isAppliedJobsContext && (
          <div className="border-t-2 border-gray-300 pt-4 flex gap-3">
            <Button
              variant="outline"
              className={`flex-1 flex items-center justify-center gap-2 ${
                isSaved ? 'bg-green-50 border-green-200 text-green-700' : ''
              }`}
              onClick={handleSaveJob}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : isSaved ? (
                <>
                  ✅ Saved
                </>
              ) : (
                <>
                  💾 Save Job
                </>
              )}
            </Button>
            <Button
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => setShowApplicationModal(true)}
            >
              📝 Apply Now
            </Button>
          </div>
        )}
      </div>

      {/* Job Application Modal */}
      <JobApplicationModal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        job={job}
        onSuccess={() => {
          // Optional: Show success message or refresh applications list
          console.log('Application submitted successfully');
        }}
      />
    </div>
  );
}
