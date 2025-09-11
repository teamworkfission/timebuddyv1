import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../contexts/AuthProvider';

export function LandingPage() {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    role: 'employee' | 'employer';
    mode: 'signup' | 'signin';
  }>({
    isOpen: false,
    role: 'employee',
    mode: 'signup'
  });

  const openAuthModal = (role: 'employee' | 'employer', mode: 'signup' | 'signin' = 'signup') => {
    setAuthModal({ isOpen: true, role, mode });
  };

  const closeAuthModal = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }));
  };

  // If already logged in, show welcome message with logout
  if (user && profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-blue-600">PtimeBuddy</h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Welcome, {profile.email}</span>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome back!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              You're signed in as a <strong>{profile.role}</strong>
            </p>
            <Button 
              size="lg"
              onClick={() => navigate(profile.role === 'employer' ? '/app/employer' : '/app/employee')}
            >
              Go to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">PtimeBuddy</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => openAuthModal('employer', 'signup')}
                className="hidden sm:inline-flex"
              >
                Employers / Post Job
              </Button>
              <Button 
                variant="outline" 
                onClick={() => openAuthModal('employee', 'signin')}
              >
                Sign In
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 text-center">
            {/* Logo */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
                <span className="text-2xl font-bold text-white">PB</span>
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Your next job starts here
            </h2>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create an account or sign in to see your personalized job recommendations.
            </p>

            {/* Search Bar (Visual Only) */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="flex flex-col sm:flex-row gap-4 p-2 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    className="w-full px-4 py-3 text-base border-0 focus:outline-none"
                    readOnly
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Ashburn, VA"
                    className="w-full px-4 py-3 text-base border-0 focus:outline-none"
                    readOnly
                  />
                </div>
                <Button size="lg" className="px-8">
                  Search
                </Button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                size="lg" 
                onClick={() => openAuthModal('employee', 'signup')}
                className="px-8 py-4 text-lg"
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => openAuthModal('employer', 'signup')}
                className="px-8 py-4 text-lg sm:hidden"
              >
                Employers / Post Job
              </Button>
            </div>

            {/* Secondary CTA */}
            <div className="border-t border-gray-200 pt-8">
              <p className="text-gray-600">
                It only takes a few seconds
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 PtimeBuddy. Building connections in the workplace.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={closeAuthModal}
        role={authModal.role}
        mode={authModal.mode}
      />
    </div>
  );
}
