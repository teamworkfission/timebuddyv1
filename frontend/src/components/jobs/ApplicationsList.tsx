import { useState, useEffect } from 'react';
import { 
  JobApplication, 
  getApplicationsByJobPost, 
  APPLICATION_STATUS_LABELS, 
  TRANSPORTATION_LABELS,
  getStatusColorClass,
  formatApplicationDate 
} from '../../lib/job-applications-api';
import { ResumeViewer } from './ResumeViewer';

interface ApplicationsListProps {
  jobPostId: string;
  jobTitle: string;
}

export function ApplicationsList({ jobPostId, jobTitle }: ApplicationsListProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getApplicationsByJobPost(jobPostId);
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications:', err);
      // Show more specific error message
      const errorMessage = err instanceof Error ? err.message : 'Failed to load applications';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load applications immediately to show count
    loadApplications();
  }, [jobPostId]);

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Applications Header - Always Visible */}
      <button
        onClick={handleToggleExpanded}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors rounded-lg"
      >
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            applications.length > 0 ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <span className="text-lg">👥</span>
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">Applications</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                applications.length > 0 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {applications.length}
              </span>
              {applications.length > 0 && !isExpanded && (
                <span className="inline-flex h-2 w-2 bg-blue-600 rounded-full animate-pulse"></span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {applications.length === 0 
                ? 'No applications received yet' 
                : `${applications.length} ${applications.length === 1 ? 'application' : 'applications'} received • Click to view details`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {applications.length > 0 && (
            <span className="text-xs text-gray-500 hidden sm:block">
              {isExpanded ? 'Hide' : 'Show'} Details
            </span>
          )}
          <span className={`transform transition-transform text-gray-400 ${isExpanded ? 'rotate-90' : ''}`}>
            ▶
          </span>
        </div>
      </button>

      {/* Applications List - Expandable */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {loading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading applications...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <p className="text-sm text-red-800">{error}</p>
              <p className="text-xs text-red-600 mt-1">
                Check if employee_job_application table exists in your database.
              </p>
            </div>
          )}

          {!loading && !error && applications.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <span className="text-3xl mb-2 block">📭</span>
              <p className="text-sm font-medium">No applications yet</p>
              <p className="text-xs">When employees apply to "{jobTitle}", they'll appear here.</p>
            </div>
          )}

          {!loading && !error && applications.length > 0 && (
            <div className="space-y-4 p-4">
              {applications.map((application) => (
                <div key={application.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                  {/* Application Header Card */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {/* Avatar/Initial */}
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {application.full_name.charAt(0).toUpperCase()}
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {application.full_name}
                          </h3>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <span>📅</span>
                              <span>Applied {formatApplicationDate(application.applied_at)}</span>
                            </span>
                            {application.city && application.state && (
                              <span className="flex items-center space-x-1">
                                <span>📍</span>
                                <span>{application.city}, {application.state}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColorClass(application.status)}`}>
                        {APPLICATION_STATUS_LABELS[application.status]}
                      </span>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="p-6 space-y-6">
                    
                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-blue-500">✉️</span>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                          <p className="text-sm font-medium text-gray-900">
                            {application.show_email ? application.email : '🔒 Hidden by user'}
                          </p>
                        </div>
                      </div>
                      
                      {application.phone && (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-green-500">📞</span>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                            <p className="text-sm font-medium text-gray-900">
                              {application.show_phone ? application.phone : '🔒 Hidden by user'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Work Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {application.availability && (
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                          <span className="text-blue-600">⏰</span>
                          <div>
                            <p className="text-xs text-blue-700 uppercase tracking-wide font-medium">Availability</p>
                            <p className="text-sm text-gray-900">{application.availability}</p>
                          </div>
                        </div>
                      )}
                      
                      {application.transportation && (
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <span className="text-green-600">🚗</span>
                          <div>
                            <p className="text-xs text-green-700 uppercase tracking-wide font-medium">Transportation</p>
                            <p className="text-sm text-gray-900">
                              {TRANSPORTATION_LABELS[application.transportation]}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Skills & Languages */}
                    {(application.skills?.length > 0 || application.languages?.length > 0) && (
                      <div className="space-y-3">
                        {application.skills && application.skills.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">💼 Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {application.skills.map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {application.languages && application.languages.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">🌍 Languages</p>
                            <div className="flex flex-wrap gap-2">
                              {application.languages.map((language, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
                                >
                                  {language}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bio */}
                    {application.short_bio && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">👤 About</p>
                        <p className="text-gray-900 text-sm leading-relaxed">{application.short_bio}</p>
                      </div>
                    )}

                    {/* Cover Message */}
                    {application.cover_message && (
                      <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm font-medium text-blue-800 mb-2">💬 Cover Message</p>
                        <p className="text-gray-800 text-sm leading-relaxed italic">
                          "{application.cover_message}"
                        </p>
                      </div>
                    )}

                    {/* Resume */}
                    {application.resume_url && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">📄 Resume</p>
                        <ResumeViewer 
                          resumeUrl={application.resume_url} 
                          applicantName={application.full_name}
                        />
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
