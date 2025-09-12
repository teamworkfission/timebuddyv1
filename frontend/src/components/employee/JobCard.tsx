import { useState } from 'react';
import { PublicJobPost, formatPayRange, formatHoursPerWeek, formatTimeAgo, formatLocation } from '../../lib/public-job-api';
import { BUSINESS_TYPE_LABELS } from '../../lib/business-api';
import { Button } from '../ui/Button';

interface JobCardProps {
  job: PublicJobPost;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export function JobCard({ job, isExpanded = false, onToggleExpanded }: JobCardProps) {
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const locationInfo = formatLocation(job.location);

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
          <h3 className="text-xl font-bold text-gray-900">
            {job.job_title}
          </h3>
          <p className="text-lg text-gray-700">
            🏢 {job.business_name} <span className="font-bold text-gray-900">({BUSINESS_TYPE_LABELS[job.business_type as keyof typeof BUSINESS_TYPE_LABELS] || job.business_type})</span>
          </p>
          <p className="text-gray-600">
            📍 {locationInfo.city}
            {locationInfo.county && `, ${locationInfo.county}`}
            , {locationInfo.state}
          </p>
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
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
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
            <div>
              <span className="font-medium text-gray-800">Phone:</span>
              <span className="text-gray-700 ml-2">{job.phone}</span>
            </div>
            {job.email && (
              <div>
                <span className="font-medium text-gray-800">Email:</span>
                <span className="text-gray-700 ml-2">{job.email}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-800">Posted:</span>
              <span className="text-gray-600 text-sm ml-2">{formatTimeAgo(job.published_at || job.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t-2 border-gray-300 pt-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={() => {
              // TODO: Implement save job functionality
              console.log('Save job:', job.id);
            }}
          >
            💾 Save Job
          </Button>
          <Button
            className="flex-1 flex items-center justify-center gap-2"
            onClick={() => setShowApplicationModal(true)}
          >
            📝 Apply Now
          </Button>
        </div>
      </div>

      {/* Application Modal Placeholder */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Apply to {job.job_title}</h3>
            <p className="text-gray-600 mb-4">
              Application system coming soon! For now, please contact:
            </p>
            <p className="text-gray-800 mb-4">
              📞 {job.phone}<br />
              {job.email && (
                <>✉️ {job.email}</>
              )}
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowApplicationModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
