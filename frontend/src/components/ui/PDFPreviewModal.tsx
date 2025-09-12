import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Modal } from './Modal';

// Configure PDF.js worker with fallback options
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

// Fallback to CDN if local worker fails
if (!pdfjs.GlobalWorkerOptions.workerSrc || pdfjs.GlobalWorkerOptions.workerSrc.includes('undefined')) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

// Add additional PDF.js options for better compatibility
const pdfOptions = {
  cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/standard_fonts/`,
  // Disable worker for better compatibility in some environments
  disableWorker: false,
  // Add timeout for better error handling
  httpHeaders: {},
  withCredentials: false,
};

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
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [useIframeFallback, setUseIframeFallback] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string>(pdfUrl);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

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

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setLoading(false);
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Failed to load PDF document.';
    
    if (error.message.includes('Invalid PDF')) {
      errorMessage = 'This file appears to be corrupted or not a valid PDF document.';
    } else if (error.message.includes('fetch') || error.message.includes('Network')) {
      errorMessage = 'Unable to download the PDF file. The link may be expired or the file may have been moved.';
    } else if (error.message.includes('worker')) {
      errorMessage = 'PDF viewer initialization failed. Please try refreshing the page.';
    } else if (error.message.includes('password')) {
      errorMessage = 'This PDF is password protected and cannot be displayed.';
    } else {
      errorMessage = 'Failed to load PDF document. This could be due to network issues, expired links, or file format issues.';
    }
    
    setError(errorMessage);
  };

  const handleRetry = () => {
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
      setError(null);
      setLoading(true);
      setUseIframeFallback(false);
      
      // Try adding cache busting parameter
      const separator = currentPdfUrl.includes('?') ? '&' : '?';
      const urlWithCacheBust = `${currentPdfUrl}${separator}t=${Date.now()}`;
      setCurrentPdfUrl(urlWithCacheBust);
    } else {
      // After 2 retries, switch to iframe fallback
      setUseIframeFallback(true);
      setError(null);
      setLoading(false);
    }
  };

  const handleUseFallback = () => {
    setUseIframeFallback(true);
    setError(null);
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(pageNumber <= 1 ? 1 : pageNumber - 1);
  };

  const goToNextPage = () => {
    setPageNumber(pageNumber >= numPages ? numPages : pageNumber + 1);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };


  const resetModal = () => {
    setPageNumber(1);
    setNumPages(0);
    setLoading(true);
    setError(null);
    setScale(1.0);
    setUseIframeFallback(false);
    setRetryCount(0);
    setCurrentPdfUrl(pdfUrl);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Reset state when pdfUrl prop changes
  useEffect(() => {
    if (isOpen) {
      // Validate URL first
      if (!isValidUrl(pdfUrl)) {
        setError('Invalid PDF URL provided.');
        setLoading(false);
        return;
      }
      
      // Reset state for new PDF
      setPageNumber(1);
      setNumPages(0);
      setLoading(true);
      setError(null);
      setScale(1.0);
      setUseIframeFallback(false);
      setRetryCount(0);
      setCurrentPdfUrl(pdfUrl);
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
        {/* Controls Bar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            {/* Page Navigation */}
            {!loading && !error && !useIframeFallback && numPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  ◀
                </button>
                <span className="text-sm text-gray-700 px-3 py-1 bg-white border border-gray-300 rounded-lg">
                  Page {pageNumber} of {numPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  ▶
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            {!loading && !error && !useIframeFallback && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  title="Zoom out"
                >
                  🔍−
                </button>
                <span className="text-sm text-gray-700 px-2 py-1 bg-white border border-gray-300 rounded-lg min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={scale >= 2.0}
                  className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  title="Zoom in"
                >
                  🔍+
                </button>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div></div>
        </div>

        {/* PDF Viewer Area */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          )}

          {error && !useIframeFallback && (
            <div className="max-w-md text-center">
              <div className="text-6xl mb-4">📄❌</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cannot Load PDF</h3>
              <p className="text-gray-600 text-sm mb-4">{error}</p>
              <div className="space-y-2 mb-4">
                <p className="text-xs text-gray-500">
                  {retryCount > 0 && `Retry attempt: ${retryCount}/2`}
                </p>
              </div>
              <div className="space-x-3">
                {retryCount < 2 && (
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Retry Loading
                  </button>
                )}
                <button
                  onClick={handleUseFallback}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Try Alternative View
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Iframe Fallback */}
          {useIframeFallback && (
            <div className="w-full h-full">
              <iframe
                src={currentPdfUrl}
                className="w-full h-full border-0"
                title={`${applicantName ? `${applicantName}'s Resume` : 'PDF Document'}`}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setError('Unable to display PDF. The file may not be accessible.');
                  setUseIframeFallback(false);
                }}
              />
            </div>
          )}

          {!loading && !error && !useIframeFallback && (
            <div className="p-4">
              <Document
                file={currentPdfUrl}
                options={pdfOptions}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center space-x-2 p-8">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600">Loading document...</span>
                  </div>
                }
                className="shadow-lg"
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  loading={
                    <div className="flex items-center justify-center p-8">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  }
                  className="border border-gray-300"
                />
              </Document>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {!loading && !error && (
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              {applicantName ? `${applicantName}'s Resume` : 'Document Preview'} 
              {numPages > 1 && ` • ${numPages} pages total`}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
