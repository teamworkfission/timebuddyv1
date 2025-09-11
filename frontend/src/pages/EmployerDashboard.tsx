import { useAuth } from '../contexts/AuthProvider';
import { Button } from '../components/ui/Button';

export function EmployerDashboard() {
  const { profile, logout } = useAuth();

  const dashboardTiles = [
    {
      id: 'manage-businesses',
      title: 'Manage Businesses',
      description: 'Add, edit, and manage your business profiles and locations',
      icon: '🏢',
      bgColor: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      id: 'job-post-hiring',
      title: 'Job Post & Hiring',
      description: 'Post job openings and manage your hiring process',
      icon: '💼',
      bgColor: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      iconBg: 'bg-green-100',
    },
    {
      id: 'manage-schedule',
      title: 'Manage Schedule',
      description: 'Create and manage employee schedules and shifts',
      icon: '📅',
      bgColor: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      iconBg: 'bg-purple-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-blue-600">PtimeBuddy</h1>
            
            {/* Profile Section */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <span className="text-sm text-gray-600">Welcome back</span>
                <span className="text-sm font-medium text-gray-900">{profile?.email}</span>
              </div>
              
              {/* Profile Avatar */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="hidden sm:block">
                  Logout
                </Button>
                {/* Mobile logout */}
                <Button variant="outline" size="sm" onClick={logout} className="sm:hidden">
                  <span className="sr-only">Logout</span>
                  <span className="text-sm">↗️</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Employer Dashboard
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Manage your business operations from one central location
          </p>
        </div>

        {/* Dashboard Tiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {dashboardTiles.map((tile) => (
            <div
              key={tile.id}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  // Handle tile click functionality here
                  console.log(`Clicked ${tile.title}`);
                }
              }}
            >
              {/* Tile Header with Gradient */}
              <div className={`${tile.bgColor} ${tile.hoverColor} transition-colors duration-200 p-6 relative`}>
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 ${tile.iconBg} rounded-lg flex items-center justify-center`}>
                    <span className="text-xl">{tile.icon}</span>
                  </div>
                  <div className="text-white opacity-75 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-sm font-medium">Click to open</span>
                  </div>
                </div>
              </div>

              {/* Tile Content */}
              <div className="p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200">
                  {tile.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {tile.description}
                </p>
              </div>

              {/* Hover Effect Border */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </div>
          ))}
        </div>

        {/* Quick Stats Section */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">0</div>
            <div className="text-sm text-gray-600">Active Businesses</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">0</div>
            <div className="text-sm text-gray-600">Job Posts</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">0</div>
            <div className="text-sm text-gray-600">Scheduled Employees</div>
          </div>
        </div>
      </main>
    </div>
  );
}
