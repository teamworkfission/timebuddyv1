import { useState, useEffect } from 'react';
import { Modal } from './Modal';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title?: string;
  applicantName?: string;
}

export function PDFPreviewModal({ 
  isOpen, 
  onClose, 
  pdfUrl, 
  title = "Document Preview",
  applicantName 
}: PDFPreviewModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string>(pdfUrl);

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const resetModal = () => {
    setLoading(true);
    setError(null);
    setCurrentPdfUrl(pdfUrl);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Reset state when modal opens or pdfUrl changes  
  useEffect(() => {
    if (isOpen) {
      // Validate URL first
      if (!isValidUrl(pdfUrl)) {
        setError('Invalid PDF URL provided.');
        setLoading(false);
        return;
      }
      
      // Reset state for new PDF
      setLoading(true);
      setError(null);
      setCurrentPdfUrl(pdfUrl);
      
      // Log for debugging
      const isSupabaseUrl = pdfUrl.includes('supabase') || pdfUrl.includes('storage');
      if (isSupabaseUrl) {
        console.log('Loading Supabase PDF URL:', pdfUrl);
      }
    }
  }, [pdfUrl, isOpen]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={applicantName ? `${applicantName}'s Resume` : title}
      maxWidth="6xl"
    >
      <div className="flex flex-col h-[80vh]">

        {/* PDF Viewer Area */}
        <div className="flex-1 overflow-auto bg-gray-100">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="max-w-md text-center">
                <div className="text-6xl mb-4">📄❌</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cannot Load PDF</h3>
                <p className="text-gray-600 text-sm mb-4">{error}</p>
                {applicantName && (
                  <p className="text-xs text-blue-600 mb-4">
                    📄 {applicantName}'s Resume
                  </p>
                )}
                <div className="flex justify-center">
                  <a
                    href={currentPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm transition-colors text-center inline-block"
                  >
                    📥 Download PDF
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col relative">
              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading PDF...</p>
                  </div>
                </div>
              )}
              
              <iframe
                src={`${currentPdfUrl}#view=FitH`}
                className="w-full h-full border-0"
                title={`${applicantName ? `${applicantName}'s Resume` : 'PDF Document'}`}
                onLoad={() => {
                  setLoading(false);
                }}
                onError={() => {
                  console.error('Failed to load PDF in iframe:', currentPdfUrl);
                  setError('Unable to display PDF. The file may not be accessible or the link may have expired.');
                  setLoading(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Footer Info */}
        {!loading && !error && (
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              {applicantName ? `${applicantName}'s Resume` : 'Document Preview'}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
