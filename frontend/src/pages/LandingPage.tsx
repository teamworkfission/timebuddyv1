import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ProfileDropdown } from '../components/ui/ProfileDropdown';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../contexts/AuthProvider';

export function LandingPage() {
  const navigate = useNavigate();
  const { user, profile, loading, processingAuth, logout } = useAuth();
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

  // Show loading state during auth processing or initial load
  if (loading || processingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If already logged in, show welcome message with logout
  if (user && profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-blue-600">PtimeBuddy</h1>
              <div className="flex items-center">
                <ProfileDropdown email={profile.email} onLogout={logout} />
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
          <div className="py-8 text-center">
            {/* Logo */}
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-3">
                <span className="text-2xl font-bold text-white">PB</span>
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Your next job starts here
            </h2>
            
            <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
              Create an account or sign in to see your personalized job recommendations.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center mb-8">
              <Button 
                size="lg" 
                onClick={() => openAuthModal('employee', 'signup')}
                className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-500 ease-out border-0 hover:-translate-y-1"
              >
                Get Started
              </Button>
            </div>

            {/* Three Tiles Section */}
            <div className="max-w-6xl mx-auto mb-8">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Connecting Local Communities
                </h3>
                <p className="text-lg text-gray-600 max-w-4xl mx-auto">
                  PTimeBuddy helps you find meaningful gig work near your location, supporting local businesses while building stronger community connections.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* For Workers */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 ease-in-out border border-blue-200 hover:border-blue-300">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-6">👥 For Workers</h4>
                  <ul className="text-gray-700 space-y-3 text-left">
                    <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span> Find gig work within your neighborhood</li>
                    <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span> Flexible scheduling around your life</li>
                    <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span> Build relationships with local employers</li>
                    <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span> Competitive pay rates in your area</li>
                    <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span> Support your local community</li>
                  </ul>
                </div>

                {/* For Local Businesses */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 ease-in-out border border-green-200 hover:border-green-300">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-6">🏢 For Local Businesses</h4>
                  <ul className="text-gray-700 space-y-3 text-left">
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Connect with reliable local workers</li>
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Fill positions quickly and efficiently</li>
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Build a strong community workforce</li>
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Reduce hiring costs and time</li>
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Strengthen local economic growth</li>
                  </ul>
                </div>

                {/* For Community */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 ease-in-out border border-purple-200 hover:border-purple-300">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-6">🤝 For Community</h4>
                  <ul className="text-gray-700 space-y-3 text-left">
                    <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span> Strengthen local economic ecosystem</li>
                    <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span> Reduce commute times and traffic</li>
                    <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span> Keep money circulating locally</li>
                    <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span> Build lasting community connections</li>
                    <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span> Support sustainable employment</li>
                  </ul>
                </div>
              </div>
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
