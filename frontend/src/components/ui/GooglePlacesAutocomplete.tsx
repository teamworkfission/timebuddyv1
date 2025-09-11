import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from './Input';

interface GooglePlacesAutocompleteProps {
  onPlaceSelect: (place: {
    address: string;
    city?: string;
    state?: string;
    county?: string;
    country?: string;
    postalCode?: string;
  }) => void;
  value?: string;
  placeholder?: string;
  className?: string;
}

interface GooglePlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
}

declare global {
  interface Window {
    google: any;
  }
}

export function GooglePlacesAutocomplete({
  onPlaceSelect,
  value = '',
  placeholder = 'Enter address...',
  className,
}: GooglePlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<GooglePlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [hasSelectedPlace, setHasSelectedPlace] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        try {
          setGoogleMapsLoaded(true);
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
          const mapDiv = document.createElement('div');
          const map = new window.google.maps.Map(mapDiv, {
            zoom: 1,
            center: { lat: 40.7128, lng: -74.0060 }
          });
          placesService.current = new window.google.maps.places.PlacesService(map);
        } catch (error) {
          console.error('Failed to initialize Google Maps services:', error);
        }
        return;
      }

      // Check if script already exists to avoid duplicate loading
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found. Using fallback mode.');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Add a small delay to ensure all Google Maps objects are ready
        setTimeout(() => {
          try {
            if (window.google && window.google.maps && window.google.maps.places) {
              setGoogleMapsLoaded(true);
              autocompleteService.current = new window.google.maps.places.AutocompleteService();
              const mapDiv = document.createElement('div');
              const map = new window.google.maps.Map(mapDiv, {
                zoom: 1,
                center: { lat: 40.7128, lng: -74.0060 }
              });
              placesService.current = new window.google.maps.places.PlacesService(map);
            }
          } catch (error) {
            console.error('Failed to initialize Google Maps services:', error);
          }
        }, 100);
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!googleMapsLoaded || !autocompleteService.current || query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      autocompleteService.current.getPlacePredictions(
        {
          input: query,
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: 'us' }, // Restrict to US for business addresses
        },
        (predictions: GooglePlacePrediction[] | null, status: any) => {
          setIsLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    }, 300),
    [googleMapsLoaded]
  );

  useEffect(() => {
    debouncedSearch(inputValue);
  }, [inputValue, debouncedSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setHasSelectedPlace(false);
  };

  const handleSuggestionClick = (prediction: GooglePlacePrediction) => {
    setInputValue(prediction.description);
    setShowSuggestions(false);
    setHasSelectedPlace(true);

    if (!placesService.current) {
      // Fallback parsing if Places service is not available
      const parts = prediction.description.split(',').map(part => part.trim());
      onPlaceSelect({
        address: prediction.description,
        city: parts[1] || undefined,
        state: parts[2]?.split(' ')[0] || undefined,
        county: undefined,
        postalCode: parts[2]?.split(' ')[1] || undefined,
      });
      return;
    }

    // Get detailed place information
    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['address_components', 'formatted_address', 'geometry'],
      },
      (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          const addressComponents = place.address_components || [];
          
          const getComponent = (types: string[]) => {
            const component = addressComponents.find((comp: any) =>
              types.some((type: string) => comp.types.includes(type))
            );
            return component?.long_name || undefined;
          };

          onPlaceSelect({
            address: place.formatted_address || prediction.description,
            city: getComponent(['locality', 'sublocality']),
            state: getComponent(['administrative_area_level_1']),
            county: getComponent(['administrative_area_level_2']),
            country: getComponent(['country']),
            postalCode: getComponent(['postal_code']),
          });
        } else {
          // Fallback if detailed info fails
          const parts = prediction.description.split(',').map(part => part.trim());
          onPlaceSelect({
            address: prediction.description,
            city: parts[1] || undefined,
            state: parts[2]?.split(' ')[0] || undefined,
            county: undefined,
            postalCode: parts[2]?.split(' ')[1] || undefined,
          });
        }
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => !hasSelectedPlace && inputValue.length > 2 && setShowSuggestions(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {suggestions.slice(0, 5).map((prediction) => (
            <div
              key={prediction.place_id}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(prediction)}
            >
              <div className="font-medium text-gray-900">
                {prediction.structured_formatting.main_text}
              </div>
              {prediction.structured_formatting.secondary_text && (
                <div className="text-xs text-gray-500">
                  {prediction.structured_formatting.secondary_text}
                </div>
              )}
            </div>
          ))}
          {googleMapsLoaded && (
            <div className="px-4 py-2 text-xs text-gray-500 border-t bg-gray-50">
              🗺️ Powered by Google Maps
            </div>
          )}
        </div>
      )}
      
      <div className="mt-1 text-xs text-gray-500">
        {googleMapsLoaded 
          ? "Start typing to search for addresses" 
          : "Loading Google Maps... or enter address manually"
        }
      </div>
    </div>
  );
}

// Simple debounce utility function
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}
