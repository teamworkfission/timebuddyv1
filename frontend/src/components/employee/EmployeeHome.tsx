import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LocationFilter } from './LocationFilter';
import { JobBrowse } from './JobBrowse';

interface SearchParams {
  keywords: string;
  state: string;
  city: string;
  county: string;
}

export function EmployeeHome() {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    keywords: '',
    state: '',
    city: '',
    county: ''
  });
  
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    // Only trigger search if there's some search criteria
    if (searchParams.keywords.trim() || searchParams.state || searchParams.city || searchParams.county) {
      setHasSearched(true);
    }
  };

  const handleLocationChange = (location: { state?: string; city?: string; county?: string }) => {
    setSearchParams(prev => ({
      ...prev,
      state: location.state || '',
      city: location.city || '',
      county: location.county || ''
    }));
    setShowLocationFilter(false);
  };

  const clearLocationFilter = () => {
    setSearchParams(prev => ({
      ...prev,
      state: '',
      city: '',
      county: ''
    }));
  };

  // If user has searched, show the JobBrowse component
  if (hasSearched) {
    return (
      <div>
        {/* Back to search button */}
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHasSearched(false)}
              className="flex items-center gap-2"
            >
              ← Back to Search
            </Button>
          </div>
        </div>
        
        <JobBrowse 
          initialSearchParams={{
            keywords: searchParams.keywords,
            state: searchParams.state,
            city: searchParams.city,
            county: searchParams.county,
            page: 1,
            limit: 20
          }}
          autoLoad={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Logo and Messaging */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          {/* Logo/Brand Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">PTimeBuddy</h1>
            <p className="text-xl text-blue-500 font-medium">Your local gig work companion</p>
          </div>

          {/* Main Search Interface */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Find Your Next Gig</h2>
              
              {/* Search Input */}
              <div className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    value={searchParams.keywords}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, keywords: e.target.value }))}
                    className="w-full text-lg py-3"
                  />
                </div>

                {/* Location and Search Button Row */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowLocationFilter(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3"
                  >
                    📍 
                    {searchParams.state || searchParams.city || searchParams.county 
                      ? `${searchParams.city || searchParams.state}${searchParams.county ? `, ${searchParams.county}` : ''}`
                      : 'Ashburn, VA'
                    }
                  </Button>
                  
                  <Button
                    onClick={handleSearch}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700"
                    disabled={!searchParams.keywords.trim() && !searchParams.state && !searchParams.city && !searchParams.county}
                  >
                    Search
                  </Button>
                </div>
              </div>

              {/* Active Location Filters */}
              {(searchParams.state || searchParams.city || searchParams.county) && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-sm text-gray-600">Location:</span>
                  <div className="flex items-center gap-2">
                    {searchParams.state && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {searchParams.state}
                      </span>
                    )}
                    {searchParams.city && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {searchParams.city}
                      </span>
                    )}
                    {searchParams.county && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {searchParams.county}
                      </span>
                    )}
                    <button
                      onClick={clearLocationFilter}
                      className="text-gray-500 hover:text-gray-700 ml-1"
                    >
                      ✖️
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Local Community Benefits Section */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Connecting Local Communities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              PTimeBuddy helps you find meaningful gig work near your location, 
              supporting local businesses while building stronger community connections.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* For Workers */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <span className="text-3xl">👨‍💼</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">For Workers</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li>• Find gig work within your neighborhood</li>
                <li>• Flexible scheduling around your life</li>
                <li>• Build relationships with local employers</li>
                <li>• Competitive pay rates in your area</li>
                <li>• Support your local community</li>
              </ul>
            </div>

            {/* For Businesses */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <span className="text-3xl">🏪</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">For Local Businesses</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li>• Connect with reliable local workers</li>
                <li>• Fill positions quickly and efficiently</li>
                <li>• Build a strong community workforce</li>
                <li>• Reduce hiring costs and time</li>
                <li>• Strengthen local economic growth</li>
              </ul>
            </div>

            {/* For Community */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <span className="text-3xl">🤝</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">For Community</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li>• Strengthen local economic ecosystem</li>
                <li>• Reduce commute times and traffic</li>
                <li>• Keep money circulating locally</li>
                <li>• Build lasting community connections</li>
                <li>• Support sustainable employment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Ready to find your next opportunity?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Start your search above and discover gig work opportunities in your local area.
          </p>
          <Button
            size="lg"
            onClick={() => document.getElementById('search-input')?.focus()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Get Started →
          </Button>
        </div>
      </div>

      {/* Location Filter Modal */}
      {showLocationFilter && (
        <LocationFilter
          currentLocation={{
            state: searchParams.state,
            city: searchParams.city,
            county: searchParams.county
          }}
          onLocationChange={handleLocationChange}
          onClose={() => setShowLocationFilter(false)}
        />
      )}
    </div>
  );
}
