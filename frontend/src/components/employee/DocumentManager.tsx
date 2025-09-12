import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { FileUpload } from '../ui/FileUpload';
import { documentsApi, DocumentData, DocumentType } from '../../lib/documents-api';

interface DocumentManagerProps {
  onDocumentsChange?: (documents: { resume?: string }) => void;
}

export function DocumentManager({ onDocumentsChange }: DocumentManagerProps) {
  const [document, setDocument] = useState<DocumentData | undefined>(undefined);
  const [loading, setLoading] = useState<{
    upload: boolean;
    init: boolean;
  }>({
    upload: false,
    init: true,
  });
  const [error, setError] = useState<string | null>(null);

  // Load existing documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Notify parent component when document changes
  useEffect(() => {
    if (onDocumentsChange) {
      onDocumentsChange({
        resume: document?.url,
      });
    }
  }, [document, onDocumentsChange]);

  const loadDocuments = async () => {
    try {
      setLoading(prev => ({ ...prev, init: true }));
      setError(null);

      // Try to load resume first, then cover letter if no resume exists
      try {
        const resume = await documentsApi.getDocument(DocumentType.RESUME);
        if (resume) {
          setDocument(resume);
          return;
        }
      } catch (resumeErr) {
        console.log('No resume found, checking for cover letter');
      }

      try {
        const coverLetter = await documentsApi.getDocument(DocumentType.COVER_LETTER);
        if (coverLetter) {
          setDocument(coverLetter);
        }
      } catch (coverErr) {
        console.log('No cover letter found either');
      }

    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(prev => ({ ...prev, init: false }));
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setLoading(prev => ({ ...prev, upload: true }));
      setError(null);

      // Always upload as resume type
      const uploadedDoc = await documentsApi.uploadDocument(file, DocumentType.RESUME);
      setDocument(uploadedDoc);

    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setLoading(prev => ({ ...prev, upload: false }));
    }
  };

  const handleFileDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your document?')) {
      return;
    }

    try {
      setLoading(prev => ({ ...prev, upload: true }));
      setError(null);

      // Try to delete both resume and cover letter (in case user had uploaded as cover letter before)
      await Promise.allSettled([
        documentsApi.deleteDocument(DocumentType.RESUME),
        documentsApi.deleteDocument(DocumentType.COVER_LETTER),
      ]);
      
      setDocument(undefined);

    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setLoading(prev => ({ ...prev, upload: false }));
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
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

  if (loading.init) {
    return (
      <div className="text-center py-4">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Loading documents...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Document Upload Section */}
      {document ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getFileIcon(document.filename)}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{document.filename}</p>
                <p className="text-xs text-gray-500">
                  Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <a
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-red-600 hover:text-red-700 underline"
              >
                View
              </a>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFileDelete}
                disabled={loading.upload}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                {loading.upload ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
          
          <div className="mt-3">
            <p className="text-xs text-gray-600">Want to update? Upload a new file below:</p>
            <div className="mt-2">
              <FileUpload
                onFileSelect={handleFileUpload}
                loading={loading.upload}
                className="border-dashed border-gray-300 bg-white"
              />
            </div>
          </div>
        </div>
      ) : (
        <FileUpload
          onFileSelect={handleFileUpload}
          loading={loading.upload}
        />
      )}
    </div>
  );
}
