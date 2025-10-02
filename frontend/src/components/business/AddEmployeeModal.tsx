import { useState, useRef } from 'react';
import { Button } from '../ui/Button';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (gid: string, message?: string) => Promise<void>;
  businessName: string;
  loading?: boolean;
}

export function AddEmployeeModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  businessName, 
  loading = false 
}: AddEmployeeModalProps) {
  const [gidChars, setGidChars] = useState(['', '', '', '', '', '']);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const validateGidChars = (chars: string[]): boolean => {
    return chars.every(char => char.length === 1 && /[A-Z0-9]/.test(char));
  };

  const getFullGid = (): string => {
    return `GID-${gidChars.join('')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if all 6 characters are filled
    if (gidChars.some(char => char === '')) {
      setError('Please enter all 6 characters of the Employee GID');
      return;
    }

    if (!validateGidChars(gidChars)) {
      setError('GID characters must be letters (A-Z) or numbers (0-9)');
      return;
    }

    try {
      await onSubmit(getFullGid(), message.trim() || undefined);
      // Reset form on success
      setGidChars(['', '', '', '', '', '']);
      setMessage('');
      setError('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send join request');
    }
  };

  const handleGidCharChange = (index: number, value: string) => {
    // Only allow alphanumeric characters and convert to uppercase
    const sanitizedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (sanitizedValue.length <= 1) {
      const newGidChars = [...gidChars];
      newGidChars[index] = sanitizedValue;
      setGidChars(newGidChars);
      setError(''); // Clear error when user types

      // Auto-focus next input if character was entered
      if (sanitizedValue.length === 1 && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to move to previous input
    if (e.key === 'Backspace' && gidChars[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const cleanText = text.replace(/[^A-Z0-9]/g, '').toUpperCase();
        if (cleanText.length >= 6) {
          const newChars = cleanText.slice(0, 6).split('');
          setGidChars(newChars);
          inputRefs.current[5]?.focus();
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Employee</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Invite an employee to join <strong>{businessName}</strong> by entering their Employee GID.
            </p>
            
            {/* How to find GID instruction */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-medium text-blue-900 mb-1">
                📋 How employees can find their GID:
              </p>
              <p className="text-xs text-blue-700">
                Ask your employee to log in → Click their <strong>Profile</strong> dropdown (top right) → Their GID is displayed at the top.
              </p>
            </div>
          </div>

          {/* GID Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Employee GID *
            </label>
            <div className="flex items-center justify-center space-x-2 mb-2">
              {/* GID- prefix */}
              <div className="flex items-center bg-gray-100 px-3 py-2 rounded-md border border-gray-300">
                <span className="text-sm font-mono font-medium text-gray-700">GID-</span>
              </div>
              
              {/* 6 character inputs */}
              {gidChars.map((char, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  value={char}
                  onChange={(e) => handleGidCharChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-10 text-center border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg font-medium uppercase"
                  disabled={loading}
                  maxLength={1}
                  placeholder="?"
                />
              ))}
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Enter the 6-character Employee GID (letters and numbers only)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Example: T I J N H O → GID-TIJNHO
              </p>
            </div>
          </div>

          {/* Optional Message */}
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to your invitation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
              disabled={loading}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || gidChars.some(char => char === '')}
              className="flex-1"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>

        {/* Info Section */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-start space-x-2">
            <div className="text-blue-500 mt-0.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-600">
                The employee will receive a join request and must accept it before being added to your business.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
