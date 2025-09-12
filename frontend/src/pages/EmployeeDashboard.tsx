import { useState } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { Button } from '../components/ui/Button';
import { ProfileDropdown } from '../components/ui/ProfileDropdown';
import { EmployeeDashboardTabs } from '../components/employee/EmployeeDashboardTabs';

export function EmployeeDashboard() {
  const { profile, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  if (showProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowProfile(false)}
                  className="flex items-center space-x-2"
                >
                  <span>←</span>
                  <span>Back to Jobs</span>
                </Button>
                <h1 className="text-2xl font-bold text-blue-600">PtimeBuddy</h1>
              </div>
              <div className="flex items-center">
                <ProfileDropdown email={profile?.email || ''} onLogout={logout} />
              </div>
            </div>
          </div>
        </header>

        {/* Profile Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <span className="text-2xl">👨‍💼</span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your Profile
            </h1>
            
            <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Account Information
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Email:</strong> {profile?.email}</p>
                <p><strong>Role:</strong> {profile?.role}</p>
                <p><strong>Status:</strong> <span className="text-green-600">Active</span></p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Profile Features Coming Soon
              </h3>
              <p className="text-sm text-blue-700">
                Complete your worker profile, upload resume, set preferences, and manage your job applications.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Main dashboard with tabbed interface
  return (
    <EmployeeDashboardTabs 
      userEmail={profile?.email}
      onLogout={logout}
      onShowProfile={() => setShowProfile(true)}
    />
  );
}
