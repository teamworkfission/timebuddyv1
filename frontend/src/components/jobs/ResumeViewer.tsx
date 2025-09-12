import { useState } from 'react';

interface ResumeViewerProps {
  resumeUrl: string;
  applicantName: string;
}

export function ResumeViewer({ resumeUrl, applicantName }: ResumeViewerProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleViewResume = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if URL is accessible
      const response = await fetch(resumeUrl, { 
        method: 'HEAD',
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error('Resume file not accessible');
      }
      
      // Open in new tab for PDF/DOC viewing
      window.open(resumeUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error accessing resume:', err);
      setError('Unable to load resume. The file may have expired or been removed.');
      
      // Try to open anyway - might work
      window.open(resumeUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setLoading(false);
    }
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
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getFileIcon(resumeUrl)}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {applicantName}'s Resume
            </p>
            <p className="text-xs text-gray-500">
              {getFileType(resumeUrl)} • Click to view
            </p>
          </div>
        </div>
        
        <button
          onClick={handleViewResume}
          disabled={loading}
          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span>👁️</span>
          )}
          <span>{loading ? 'Loading...' : 'View'}</span>
        </button>
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <p>{error}</p>
          <p className="mt-1 text-yellow-600">
            The resume link may have expired. Ask the applicant to resubmit.
          </p>
        </div>
      )}
    </div>
  );
}
