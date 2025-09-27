import { useState, useEffect } from 'react';
import { LocationOption, getStatesWithJobs, getCitiesWithJobs, getCountiesWithJobs } from '../../lib/public-job-api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface LocationFilterProps {
  currentLocation: {
    state: string;
    city: string;
    county: string;
  };
  onLocationChange: (location: { state?: string; city?: string; county?: string }) => void;
  onClose: () => void;
}

export function LocationFilter({ currentLocation, onLocationChange, onClose }: LocationFilterProps) {
  const [states, setStates] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [counties, setCounties] = useState<LocationOption[]>([]);
  
  const [selectedState, setSelectedState] = useState(currentLocation.state);
  const [selectedCity, setSelectedCity] = useState(currentLocation.city);
  const [selectedCounty, setSelectedCounty] = useState(currentLocation.county);
  
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [countySearch, setCountySearch] = useState('');
  
  const [loading, setLoading] = useState({ states: false, cities: false, counties: false });

  // Load states on mount
  useEffect(() => {
    loadStates();
  }, []);

  // Load cities when state is selected
  useEffect(() => {
    if (selectedState) {
      loadCities(selectedState);
    } else {
      setCities([]);
      setSelectedCity('');
      setSelectedCounty('');
    }
  }, [selectedState]);

  // Load counties when city is selected
  useEffect(() => {
    if (selectedState && selectedCity) {
      loadCounties(selectedState, selectedCity);
    } else {
      setCounties([]);
      setSelectedCounty('');
    }
  }, [selectedState, selectedCity]);

  const loadStates = async () => {
    setLoading(prev => ({ ...prev, states: true }));
    try {
      const stateData = await getStatesWithJobs();
      setStates(stateData);
    } catch (error) {
      console.error('Failed to load states:', error);
    } finally {
      setLoading(prev => ({ ...prev, states: false }));
    }
  };

  const loadCities = async (state: string) => {
    setLoading(prev => ({ ...prev, cities: true }));
    try {
      const cityData = await getCitiesWithJobs(state);
      setCities(cityData);
    } catch (error) {
      console.error('Failed to load cities:', error);
    } finally {
      setLoading(prev => ({ ...prev, cities: false }));
    }
  };

  const loadCounties = async (state: string, city: string) => {
    setLoading(prev => ({ ...prev, counties: true }));
    try {
      const countyData = await getCountiesWithJobs(state, city);
      setCounties(countyData);
    } catch (error) {
      console.error('Failed to load counties:', error);
    } finally {
      setLoading(prev => ({ ...prev, counties: false }));
    }
  };

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    setSelectedCity('');
    setSelectedCounty('');
    setCitySearch('');
    setCountySearch('');
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setSelectedCounty('');
    setCountySearch('');
  };

  const handleCountySelect = (county: string) => {
    setSelectedCounty(county);
  };

  const applyFilter = () => {
    onLocationChange({
      state: selectedState,
      city: selectedCity,
      county: selectedCounty
    });
  };

  const clearAll = () => {
    setSelectedState('');
    setSelectedCity('');
    setSelectedCounty('');
    setStateSearch('');
    setCitySearch('');
    setCountySearch('');
  };

  // Filter functions
  const filteredStates = states.filter(state =>
    state.name.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  const filteredCounties = counties.filter(county =>
    county.name.toLowerCase().includes(countySearch.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={(e) => {
        // Close modal when clicking on overlay
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onTouchMove={(e) => {
        // Prevent background scrolling when touching the overlay
        e.preventDefault();
      }}
    >
      <div 
        className="bg-white w-full max-w-md mx-4 rounded-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">📍 Location Filter</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✖️
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* State Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏛️ State
            </label>
            <Input
              type="text"
              placeholder="Search states..."
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
              className="mb-3"
            />
            
            {loading.states ? (
              <div className="text-center py-4 text-gray-500">Loading states...</div>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded">
                {filteredStates.map((state) => (
                  <button
                    key={state.name}
                    onClick={() => handleStateSelect(state.name)}
                    className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-gray-50 flex justify-between ${
                      selectedState === state.name ? 'bg-blue-50 text-blue-800' : ''
                    }`}
                  >
                    <span>{state.name}</span>
                    <span className="text-sm text-gray-500">({state.job_count} jobs)</span>
                  </button>
                ))}
                {filteredStates.length === 0 && (
                  <div className="text-center py-4 text-gray-500">No states found</div>
                )}
              </div>
            )}
          </div>

          {/* City Selection */}
          {selectedState && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏙️ City in {selectedState}
              </label>
              <Input
                type="text"
                placeholder="Search cities..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="mb-3"
              />
              
              {loading.cities ? (
                <div className="text-center py-4 text-gray-500">Loading cities...</div>
              ) : (
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded">
                  {filteredCities.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => handleCitySelect(city.name)}
                      className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-gray-50 flex justify-between ${
                        selectedCity === city.name ? 'bg-blue-50 text-blue-800' : ''
                      }`}
                    >
                      <span>{city.name}</span>
                      <span className="text-sm text-gray-500">({city.job_count} jobs)</span>
                    </button>
                  ))}
                  {filteredCities.length === 0 && cities.length === 0 && !loading.cities && (
                    <div className="text-center py-4 text-gray-500">No cities with jobs in {selectedState}</div>
                  )}
                  {filteredCities.length === 0 && cities.length > 0 && (
                    <div className="text-center py-4 text-gray-500">No cities match your search</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* County Selection */}
          {selectedState && selectedCity && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏘️ County in {selectedCity}, {selectedState}
              </label>
              <Input
                type="text"
                placeholder="Search counties..."
                value={countySearch}
                onChange={(e) => setCountySearch(e.target.value)}
                className="mb-3"
              />
              
              {loading.counties ? (
                <div className="text-center py-4 text-gray-500">Loading counties...</div>
              ) : (
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded">
                  {filteredCounties.map((county) => (
                    <button
                      key={county.name}
                      onClick={() => handleCountySelect(county.name)}
                      className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-gray-50 flex justify-between ${
                        selectedCounty === county.name ? 'bg-blue-50 text-blue-800' : ''
                      }`}
                    >
                      <span>{county.name}</span>
                      <span className="text-sm text-gray-500">({county.job_count} jobs)</span>
                    </button>
                  ))}
                  {filteredCounties.length === 0 && counties.length === 0 && !loading.counties && (
                    <div className="text-center py-4 text-gray-500">No county data available</div>
                  )}
                  {filteredCounties.length === 0 && counties.length > 0 && (
                    <div className="text-center py-4 text-gray-500">No counties match your search</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {/* Selected location preview */}
          {(selectedState || selectedCity || selectedCounty) && (
            <div className="text-sm text-gray-600">
              <strong>Selected:</strong> {[selectedCity, selectedCounty, selectedState].filter(Boolean).join(', ')}
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={clearAll}
              className="flex-1"
            >
              Clear All
            </Button>
            <Button
              onClick={applyFilter}
              className="flex-1"
              disabled={!selectedState && !selectedCity && !selectedCounty}
            >
              Apply Filter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
