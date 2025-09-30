import { useState, useRef, useCallback } from 'react';
import { Button } from './Button';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  onRemove?: () => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  preview?: string; // URL for preview
  fileName?: string; // Name of selected file
}

export function ImageUpload({ 
  onFileSelect, 
  onRemove,
  accept = 'image/*',
  maxSize = 2 * 1024 * 1024, // 2MB to match backend/bucket config
  className = '',
  disabled = false,
  loading = false,
  preview,
  fileName
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`;
    }

    // Check file type - only images
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP images are allowed';
    }

    return null;
  }, [maxSize]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const error = validateFile(file);
    
    if (error) {
      alert(error);
      return;
    }

    onFileSelect(file);
  }, [onFileSelect, validateFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || loading) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, loading, handleFiles]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || loading) return;
    handleFiles(e.target.files);
  }, [disabled, loading, handleFiles]);

  const handleButtonClick = useCallback(() => {
    if (disabled || loading) return;
    fileInputRef.current?.click();
  }, [disabled, loading]);

  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove();
    }
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onRemove]);

  // Show preview if image is uploaded
  if (preview || fileName) {
    return (
      <div className={`relative ${className}`}>
        <div className="border-2 border-dashed border-green-300 bg-green-50 rounded-lg p-4">
          {preview ? (
            <div className="flex flex-col items-center space-y-3">
              <img 
                src={preview} 
                alt="Screenshot preview" 
                className="max-w-full max-h-48 object-contain rounded border border-gray-200"
              />
              <div className="flex items-center space-x-2 text-sm text-green-700">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Screenshot uploaded successfully</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-sm text-green-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{fileName} uploaded</span>
            </div>
          )}
          
          <div className="flex justify-center mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || loading}
              className="text-sm text-red-600 border-red-300 hover:bg-red-50"
            >
              Remove Screenshot
            </Button>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || loading}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || loading}
      />
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
          }
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <div className="flex flex-col items-center space-y-2">
          {loading ? (
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          )}
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">
              {loading ? 'Processing...' : 'Drop your screenshot here or click to browse'}
            </p>
            <p className="text-xs text-gray-500">
              JPEG, PNG, WebP up to {Math.round(maxSize / (1024 * 1024))}MB
            </p>
          </div>
          
          <Button
            type="button"
            variant="outline"
            disabled={disabled || loading}
            className="mt-2 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleButtonClick();
            }}
          >
            {loading ? 'Processing...' : 'Choose Image'}
          </Button>
        </div>
      </div>
    </div>
  );
}
