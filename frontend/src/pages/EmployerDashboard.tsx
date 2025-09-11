import { useAuth } from '../contexts/AuthProvider';
import { Button } from '../components/ui/Button';
import { useState, useEffect } from 'react';
import { BusinessManagement } from '../components/business/BusinessManagement';
import { getBusinessStats, BusinessStats } from '../lib/business-api';

export function EmployerDashboard() {
  const { profile, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'businesses'>('dashboard');
  const [businessStats, setBusinessStats] = useState<BusinessStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadBusinessStats = async () => {
    try {
      setStatsLoading(true);
      const stats = await getBusinessStats();
      setBusinessStats(stats);
    } catch (error) {
      console.error('Failed to load business stats:', error);
      // Set default stats if loading fails
      setBusinessStats({ total_businesses: 0, total_employees: 0 });
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadBusinessStats();
  }, []);

  const handleTileClick = (tileId: string) => {
    switch (tileId) {
      case 'manage-businesses':
        setCurrentView('businesses');
        break;
      case 'job-post-hiring':
        console.log('Job Post & Hiring clicked - coming soon');
        break;
      case 'manage-schedule':
        console.log('Manage Schedule clicked - coming soon');
        break;
      default:
        console.log(`Unknown tile clicked: ${tileId}`);
    }
  };

  const dashboardTiles = [
    {
      id: 'manage-businesses',
      title: 'Manage Businesses',
      description: 'Add, edit, and manage your business profiles and locations',
      icon: '🏢',
      bgColor: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      iconBg: 'bg-blue-100',
      onClick: () => handleTileClick('manage-businesses'),
    },
    {
      id: 'job-post-hiring',
      title: 'Job Post & Hiring',
      description: 'Post job openings and manage your hiring process',
      icon: '💼',
      bgColor: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      iconBg: 'bg-green-100',
      onClick: () => handleTileClick('job-post-hiring'),
    },
    {
      id: 'manage-schedule',
      title: 'Manage Schedule',
      description: 'Create and manage employee schedules and shifts',
      icon: '📅',
      bgColor: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      iconBg: 'bg-purple-100',
      onClick: () => handleTileClick('manage-schedule'),
    },
  ];

  // Handle different views
  if (currentView === 'businesses') {
    return <BusinessManagement onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Optimized Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-600">PtimeBuddy</h1>
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded-full hidden sm:inline-block">
                Employer
              </span>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden relative w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle menu"
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center">
                <span className={`block h-0.5 w-5 bg-current transform transition duration-200 ${
                  mobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'
                }`} />
                <span className={`block h-0.5 w-5 bg-current transform transition duration-200 ${
                  mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`} />
                <span className={`block h-0.5 w-5 bg-current transform transition duration-200 ${
                  mobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'
                }`} />
              </div>
            </button>

            {/* Desktop Profile Section */}
            <div className="hidden sm:flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <span className="text-sm text-gray-600">Welcome back</span>
                <span className="text-sm font-medium text-gray-900 truncate max-w-[150px] lg:max-w-none">
                  {profile?.email}
                </span>
              </div>
              
              {/* Profile Avatar */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm sm:text-lg">👤</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`sm:hidden overflow-hidden transition-all duration-200 ease-in-out ${
            mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3 px-4 py-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">👤</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile?.email}
                  </p>
                  <p className="text-xs text-gray-500">Employer Account</p>
                </div>
              </div>
              <div className="px-4 pb-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-center"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Dashboard Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Dashboard Overview
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl">
            Manage your business operations from one central location
          </p>
        </div>

        {/* Dashboard Tiles Grid - Optimized for All Screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {dashboardTiles.map((tile) => (
            <div
              key={tile.id}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg active:scale-[0.98] transition-all duration-200 cursor-pointer overflow-hidden touch-manipulation"
              role="button"
              tabIndex={0}
              onClick={tile.onClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  tile.onClick();
                }
              }}
              aria-label={`Open ${tile.title}`}
            >
              {/* Tile Header with Gradient - Mobile Optimized */}
              <div className={`${tile.bgColor} ${tile.hoverColor} transition-colors duration-200 p-4 sm:p-6 relative`}>
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 ${tile.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className="text-lg sm:text-xl">{tile.icon}</span>
                  </div>
                  <div className="text-white opacity-75 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
                    <span className="text-xs sm:text-sm font-medium">Tap to open</span>
                  </div>
                  {/* Mobile: Show arrow instead */}
                  <div className="text-white opacity-75 group-hover:opacity-100 transition-opacity duration-200 sm:hidden">
                    <span className="text-lg">→</span>
                  </div>
                </div>
              </div>

              {/* Tile Content - Improved Mobile Layout */}
              <div className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
                  {tile.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed line-clamp-3">
                  {tile.description}
                </p>
              </div>

              {/* Hover Effect Border */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 group-active:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>
          ))}
        </div>

        {/* Quick Stats Section - Optimized Layout */}
        <div className="mt-8 sm:mt-12">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Quick Stats</h2>
          
          {/* Stats Grid - Responsive Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 text-center hover:shadow-sm transition-shadow duration-200">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                  <span className="text-blue-600 text-lg sm:text-xl">🏢</span>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-1">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded mx-auto"></div>
                  ) : (
                    businessStats?.total_businesses || 0
                  )}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Active Businesses</div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 text-center hover:shadow-sm transition-shadow duration-200">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                  <span className="text-green-600 text-lg sm:text-xl">💼</span>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1">0</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Job Posts</div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 text-center hover:shadow-sm transition-shadow duration-200 col-span-2 sm:col-span-1">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                  <span className="text-purple-600 text-lg sm:text-xl">👥</span>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 mb-1">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded mx-auto"></div>
                  ) : (
                    businessStats?.total_employees || 0
                  )}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Employee Slots</div>
              </div>
          </div>
          </div>
          
          {/* Additional Info for Mobile */}
          <div className="mt-4 sm:mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 sm:hidden">
            <p className="text-xs text-blue-700 text-center">
              💡 Tap any dashboard tile above to get started with managing your business operations
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
