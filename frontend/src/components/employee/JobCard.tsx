import { useState } from 'react';
import { PublicJobPost, formatPayRange, formatHoursPerWeek, formatTimeAgo, formatLocation } from '../../lib/public-job-api';
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
            🏷️ {job.job_title}
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
            🏷️ {job.job_title}
          </h3>
          <p className="text-lg text-gray-700">
            🏢 {job.business_name}
          </p>
          <p className="text-gray-600">
            📍 {locationInfo.city}
            {locationInfo.county && `, ${locationInfo.county}`}
            , {locationInfo.state}
          </p>
        </div>

        {/* Pay and Type Info */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-blue-800">
              💼 {job.job_type === 'full-time' ? 'Full-Time' : 'Part-Time'}
            </span>
            <span className="text-blue-800">
              💰 {formatPayRange(job)}
            </span>
            {job.expected_hours_per_week && (
              <span className="text-blue-800">
                ⏰ {formatHoursPerWeek(job.expected_hours_per_week)}
              </span>
            )}
          </div>
        </div>

        {/* Schedule */}
        {job.schedule && (
          <div>
            <p className="text-gray-800">
              📅 <span className="font-medium">Schedule:</span> {job.schedule}
            </p>
          </div>
        )}

        {/* Supplemental Pay */}
        {job.supplemental_pay.length > 0 && (
          <div>
            <p className="text-gray-800">
              💵 <span className="font-medium">Additional Pay:</span> {job.supplemental_pay.join(' • ')}
            </p>
          </div>
        )}

        {/* Benefits */}
        {job.benefits.length > 0 && (
          <div>
            <p className="text-gray-800">
              🎁 <span className="font-medium">Benefits:</span> {job.benefits.map(benefit => {
                if (benefit === 'health_insurance') return 'Health Insurance';
                if (benefit === '401k') return '401(k)';
                if (benefit === 'pto') return 'Paid Time Off';
                return benefit;
              }).join(' • ')}
            </p>
          </div>
        )}

        {/* Job Description */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-2">📝 Job Description</h4>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {job.job_description}
          </p>
        </div>

        {/* Requirements */}
        {(job.language_preference || job.transportation_requirement) && (
          <div className="border-t border-gray-200 pt-4 space-y-2">
            {job.language_preference && (
              <p className="text-gray-800">
                🗣️ <span className="font-medium">Language:</span> {job.language_preference}
              </p>
            )}
            {job.transportation_requirement && (
              <p className="text-gray-800">
                🚗 <span className="font-medium">Transportation:</span> {job.transportation_requirement}
              </p>
            )}
            <p className="text-gray-800">
              🏪 <span className="font-medium">Business Type:</span> {job.business_type}
            </p>
          </div>
        )}

        {/* Contact Info */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <p className="text-gray-800">
            📞 <span className="font-medium">Phone:</span> {job.phone}
          </p>
          {job.email && (
            <p className="text-gray-800">
              ✉️ <span className="font-medium">Email:</span> {job.email}
            </p>
          )}
          <p className="text-gray-600 text-sm">
            📅 Posted {formatTimeAgo(job.published_at || job.created_at)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 pt-4 flex gap-3">
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
