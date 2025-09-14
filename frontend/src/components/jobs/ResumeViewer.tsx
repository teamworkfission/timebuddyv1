import { useState } from 'react';
import { PDFPreviewModal } from '../ui/PDFPreviewModal';

interface ResumeViewerProps {
  resumeUrl: string;
  applicantName: string;
}

export function ResumeViewer({ resumeUrl, applicantName }: ResumeViewerProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleViewResume = () => {
    // Validate URL before opening modal
    if (!resumeUrl || resumeUrl.trim() === '') {
      console.error('Invalid resume URL provided');
      return;
    }
    
    // Debug logging
    console.log('Opening resume preview for:', applicantName);
    console.log('Resume URL:', resumeUrl);
    console.log('URL type:', resumeUrl.includes('supabase') ? 'Supabase Storage' : 'External URL');
    
    setIsPreviewOpen(true);
  };

  // Don't render if no valid URL
  if (!resumeUrl || resumeUrl.trim() === '') {
    return (
      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📄</span>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {applicantName}'s Resume
            </p>
            <p className="text-xs text-red-500">
              No resume available
            </p>
          </div>
        </div>
      </div>
    );
  }

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
    <>
      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getFileIcon(resumeUrl)}</span>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {applicantName}'s Resume
              </p>
              <p className="text-xs text-gray-500">
                {getFileType(resumeUrl)} • Click to view in app
              </p>
            </div>
          </div>
          
          <button
            onClick={handleViewResume}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            <span>👁️</span>
            <span>Preview</span>
          </button>
        </div>
      </div>

      <PDFPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfUrl={resumeUrl}
        applicantName={applicantName}
      />
    </>
  );
}
