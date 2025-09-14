import { useState, useEffect } from 'react';
import { 
  JobApplication, 
  getApplicationsByJobPost, 
  APPLICATION_STATUS_LABELS, 
  TRANSPORTATION_LABELS,
  getStatusColorClass,
  formatApplicationDate 
} from '../../lib/job-applications-api';
import { PDFPreviewModal } from '../ui/PDFPreviewModal';

interface ApplicationsListProps {
  jobPostId: string;
  jobTitle: string;
}

export function ApplicationsList({ jobPostId, jobTitle }: ApplicationsListProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hiddenApplications, setHiddenApplications] = useState<Set<string>>(new Set());
  const [previewApplication, setPreviewApplication] = useState<{resumeUrl: string, applicantName: string} | null>(null);

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

  const handleHideApplication = (applicationId: string) => {
    setHiddenApplications(prev => new Set([...prev, applicationId]));
  };

  const handleViewResume = (resumeUrl: string, applicantName: string) => {
    // Validate URL before opening modal
    if (!resumeUrl || resumeUrl.trim() === '') {
      console.error('Invalid resume URL provided');
      return;
    }
    
    // Debug logging
    console.log('Opening resume preview for:', applicantName);
    console.log('Resume URL:', resumeUrl);
    console.log('URL type:', resumeUrl.includes('supabase') ? 'Supabase Storage' : 'External URL');
    
    setPreviewApplication({ resumeUrl, applicantName });
  };

  const getFileType = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF';
      case 'doc':
      case 'docx':
        return 'Word Document';
      default:
        return 'Document';
    }
  };

  const getFileIcon = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      default:
        return '📎';
    }
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
              {applications.filter(app => !hiddenApplications.has(app.id)).map((application) => (
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
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColorClass(application.status)}`}>
                          {APPLICATION_STATUS_LABELS[application.status]}
                        </span>
                        <button
                          onClick={() => handleHideApplication(application.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Hide this application"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="p-6 space-y-6">
                    
                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {application.show_email ? (
                        <a 
                          href={`mailto:${application.email}`}
                          className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <span className="text-blue-500">✉️</span>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                            <p className="text-sm font-medium text-blue-600 hover:text-blue-800">
                              {application.email}
                            </p>
                          </div>
                        </a>
                      ) : (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-blue-500">✉️</span>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                            <p className="text-sm font-medium text-gray-900">
                              🔒 Hidden by user
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {application.phone && (
                        application.show_phone ? (
                          <a 
                            href={`tel:${application.phone}`}
                            className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <span className="text-green-500">📞</span>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                              <p className="text-sm font-medium text-green-600 hover:text-green-800">
                                {application.phone}
                              </p>
                            </div>
                          </a>
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-green-500">📞</span>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                              <p className="text-sm font-medium text-gray-900">
                                🔒 Hidden by user
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Work Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {application.availability && (
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="text-xs text-blue-700 uppercase tracking-wide font-medium">Availability</p>
                            <p className="text-sm text-gray-900">{application.availability}</p>
                          </div>
                        </div>
                      )}
                      
                      {application.transportation && (
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
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
                            <p className="text-sm font-medium text-gray-700 mb-2">Languages</p>
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

                    {/* Resume - Only show if resume_url exists and is not empty */}
                    {application.resume_url && application.resume_url.trim() !== '' && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">📄 Resume</p>
                        <div 
                          className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => handleViewResume(application.resume_url, application.full_name)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getFileIcon(application.resume_url)}</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {application.full_name}'s Resume
                                </p>
                                <p className="text-xs text-gray-500">
                                  {getFileType(application.resume_url)} • Click to view
                                </p>
                              </div>
                            </div>
                            <div className="text-blue-600">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewApplication && (
        <PDFPreviewModal
          isOpen={!!previewApplication}
          onClose={() => setPreviewApplication(null)}
          pdfUrl={previewApplication.resumeUrl}
          applicantName={previewApplication.applicantName}
        />
      )}
    </div>
  );
}
