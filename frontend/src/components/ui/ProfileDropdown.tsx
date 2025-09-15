import { useState, useRef, useEffect } from 'react';
import { Button } from './Button';

interface ProfileDropdownProps {
  email: string;
  onLogout: () => void;
  onJobProfile?: () => void;
  isProfileComplete?: boolean;
  profileCompletionPercentage?: number;
  employeeGid?: string;
  className?: string;
}

export function ProfileDropdown({ 
  email, 
  onLogout, 
  onJobProfile, 
  isProfileComplete = false, 
  profileCompletionPercentage = 0,
  employeeGid,
  className = '' 
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Profile Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2"
      >
        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm">👤</span>
        </div>
        <span className="text-sm">Profile</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-2">
            {/* Email Display */}
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">👤</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500">Signed in as</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{email}</p>
                </div>
              </div>
            </div>

            {/* Employee GID Display */}
            {employeeGid && (
              <div className="px-4 py-3 border-b border-gray-100 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-200 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-700">ID</span>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Employee GID</p>
                      <p className="text-sm font-mono font-bold text-blue-800">{employeeGid}</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(employeeGid);
                        // You could add a toast notification here
                        alert('GID copied to clipboard!');
                      } catch (err) {
                        console.error('Failed to copy GID:', err);
                      }
                    }}
                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                    title="Copy GID to clipboard"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                
              </div>
            )}

            {/* Profile Button */}
            {onJobProfile && (
              <div className="px-2 py-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    onJobProfile();
                  }}
                  className={`w-full text-left justify-start px-3 py-2 text-sm hover:bg-gray-50 ${
                    isProfileComplete 
                      ? 'text-blue-700 border-blue-200 bg-blue-50' 
                      : 'text-red-700 border-red-200 bg-red-50'
                  }`}
                >
                  {isProfileComplete ? (
                    <div className="flex items-center">
                      <span>Profile Complete</span>
                      {/* Checkmark icon after text */}
                      <svg className="ml-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {/* Pencil icon for incomplete profile */}
                      <svg className="mr-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.379-8.379-2.828-2.828z" />
                      </svg>
                      <span>
                        {profileCompletionPercentage > 0 
                          ? `Complete Profile ${profileCompletionPercentage}%`
                          : 'Complete Your Profile'
                        }
                      </span>
                    </div>
                  )}
                </Button>
                
                {/* Progress bar for incomplete profiles */}
                {!isProfileComplete && profileCompletionPercentage > 0 && (
                  <div className="px-3 py-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${profileCompletionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Logout Button */}
            <div className="px-2 py-1">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full text-left justify-start px-3 py-2 text-sm hover:bg-gray-50"
              >
                <span className="mr-2">🚪</span>
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
