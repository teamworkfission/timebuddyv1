/**
 * Google Timezone API Integration
 * More accurate than hardcoded state mappings
 */

export interface GoogleTimezoneResponse {
  timeZoneId: string; // e.g., "America/Chicago"
  timeZoneName: string; // e.g., "Central Standard Time"
  rawOffset: number; // UTC offset in seconds
  dstOffset: number; // DST offset in seconds
  status: string;
}

export interface GoogleGeocodeResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
  }>;
  status: string;
}

// You'll need to add your Google API key to your environment variables
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

/**
 * Get timezone information from Google APIs using business location
 */
export async function getTimezoneFromGoogle(location: string): Promise<string | null> {
  if (!GOOGLE_API_KEY) {
    console.warn('Google API key not configured, falling back to hardcoded mappings');
    return null;
  }

  try {
    // Step 1: Geocode the location to get lat/lng
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_API_KEY}`;
    
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData: GoogleGeocodeResponse = await geocodeResponse.json();
    
    if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
      console.warn('Failed to geocode location:', location);
      return null;
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;
    console.log(`Geocoded "${location}" to: ${lat}, ${lng}`);

    // Step 2: Get timezone for those coordinates
    const timestamp = Math.floor(Date.now() / 1000); // Current timestamp
    const timezoneUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${GOOGLE_API_KEY}`;
    
    const timezoneResponse = await fetch(timezoneUrl);
    const timezoneData: GoogleTimezoneResponse = await timezoneResponse.json();
    
    if (timezoneData.status !== 'OK') {
      console.warn('Failed to get timezone for coordinates:', lat, lng);
      return null;
    }

    console.log(`Location "${location}" is in timezone: ${timezoneData.timeZoneId}`);
    return timezoneData.timeZoneId; // e.g., "America/Chicago"

  } catch (error) {
    console.error('Error getting timezone from Google APIs:', error);
    return null;
  }
}

/**
 * Get current week start (Sunday) using Google timezone detection
 */
export async function getWeekStartWithGoogleTimezone(location: string): Promise<string> {
  const timezoneId = await getTimezoneFromGoogle(location);
  
  if (!timezoneId) {
    // Fallback to simple UTC calculation
    console.warn('Using UTC fallback for week calculation');
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToSunday = -dayOfWeek;
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + daysToSunday);
    sunday.setHours(0, 0, 0, 0);
    return sunday.toISOString().split('T')[0];
  }

  // Use Google's timezone to calculate current Sunday
  const now = new Date();
  const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezoneId }));
  const dayOfWeek = localTime.getDay(); // 0=Sunday
  const daysToSunday = -dayOfWeek;
  const sunday = new Date(localTime);
  sunday.setDate(localTime.getDate() + daysToSunday);
  sunday.setHours(0, 0, 0, 0);
  
  return sunday.toISOString().split('T')[0];
}

/**
 * Cache timezone results to avoid repeated API calls
 */
const timezoneCache = new Map<string, { timezone: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedTimezone(location: string): Promise<string | null> {
  const cached = timezoneCache.get(location);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('Using cached timezone for:', location);
    return cached.timezone;
  }

  const timezone = await getTimezoneFromGoogle(location);
  
  if (timezone) {
    timezoneCache.set(location, { timezone, timestamp: Date.now() });
    // Also save to localStorage for persistence
    localStorage.setItem(`timezone_${location}`, JSON.stringify({ timezone, timestamp: Date.now() }));
  }

  return timezone;
}
