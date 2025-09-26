import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// @ts-ignore - tz-lookup doesn't have TypeScript definitions
import * as tzlookup from 'tz-lookup';

export interface TimezoneResolution {
  latitude: number;
  longitude: number;
  timezone: string;
  source: 'google' | 'offline' | 'fallback';
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
}

@Injectable()
export class TimezoneService {
  private readonly logger = new Logger(TimezoneService.name);
  private readonly googleApiKey: string;
  
  // Simple cache to avoid repeated API calls within the same process
  private readonly cache = new Map<string, { result: TimezoneResolution; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor(private configService: ConfigService) {
    this.googleApiKey = this.configService.get<string>('GOOGLE_API_KEY');
    if (!this.googleApiKey) {
      this.logger.warn('Google API key not configured, will use offline fallback only');
    }
  }

  /**
   * Resolve timezone for a business address
   * Priority: Google API -> tz-lookup (offline) -> UTC fallback
   */
  async resolveTimezone(address: string): Promise<TimezoneResolution> {
    const normalizedAddress = address.trim().toLowerCase();
    
    // Check cache first
    const cached = this.cache.get(normalizedAddress);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      this.logger.debug(`Using cached timezone for: ${address}`);
      return cached.result;
    }

    let result: TimezoneResolution;

    try {
      // Try Google API first
      if (this.googleApiKey) {
        result = await this.resolveWithGoogle(address);
        this.logger.log(`Resolved timezone via Google API: ${address} -> ${result.timezone}`);
      } else {
        throw new Error('Google API key not configured');
      }
    } catch (googleError) {
      this.logger.warn(`Google API failed for ${address}: ${googleError.message}`);
      
      try {
        // Fallback to offline detection
        result = await this.resolveOffline(address);
        this.logger.log(`Resolved timezone via offline lookup: ${address} -> ${result.timezone}`);
      } catch (offlineError) {
        this.logger.error(`Offline lookup failed for ${address}: ${offlineError.message}`);
        
        // Final fallback to UTC
        result = {
          latitude: 0,
          longitude: 0,
          timezone: 'UTC',
          source: 'fallback'
        };
        this.logger.warn(`Using UTC fallback for: ${address}`);
      }
    }

    // Cache the result
    this.cache.set(normalizedAddress, { result, timestamp: Date.now() });
    return result;
  }

  /**
   * Resolve timezone using Google Geocoding + Timezone API
   */
  private async resolveWithGoogle(address: string): Promise<TimezoneResolution> {
    // Step 1: Geocode the address
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.googleApiKey}`;
    
    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) {
      throw new Error(`Geocoding API request failed: ${geocodeResponse.statusText}`);
    }
    
    const geocodeData = await geocodeResponse.json();
    if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
      throw new Error(`Failed to geocode address: ${geocodeData.status}`);
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;

    // Step 2: Get timezone for coordinates
    const timestamp = Math.floor(Date.now() / 1000);
    const timezoneUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${this.googleApiKey}`;
    
    const timezoneResponse = await fetch(timezoneUrl);
    if (!timezoneResponse.ok) {
      throw new Error(`Timezone API request failed: ${timezoneResponse.statusText}`);
    }
    
    const timezoneData = await timezoneResponse.json();
    if (timezoneData.status !== 'OK') {
      throw new Error(`Failed to get timezone: ${timezoneData.status}`);
    }

    return {
      latitude: lat,
      longitude: lng,
      timezone: timezoneData.timeZoneId,
      source: 'google'
    };
  }

  /**
   * Resolve timezone using offline tz-lookup library
   * Fallback when Google API is not available
   */
  private async resolveOffline(address: string): Promise<TimezoneResolution> {
    // For offline resolution, we need coordinates first
    // Try basic US state/major city coordinate mapping as simple geocoder
    const locationMap: Record<string, { lat: number; lng: number }> = {
      // Major US cities for common business locations
      'birmingham, al': { lat: 33.5207, lng: -86.8025 },
      'los angeles, ca': { lat: 34.0522, lng: -118.2437 },
      'new york, ny': { lat: 40.7128, lng: -74.0060 },
      'chicago, il': { lat: 41.8781, lng: -87.6298 },
      'houston, tx': { lat: 29.7604, lng: -95.3698 },
      'phoenix, az': { lat: 33.4484, lng: -112.0740 },
      'philadelphia, pa': { lat: 39.9526, lng: -75.1652 },
      'san antonio, tx': { lat: 29.4241, lng: -98.4936 },
      'san diego, ca': { lat: 32.7157, lng: -117.1611 },
      'dallas, tx': { lat: 32.7767, lng: -96.7970 },
    };

    // Normalize address for lookup
    const normalizedAddress = address.toLowerCase().trim();
    let coordinates = locationMap[normalizedAddress];

    // If no exact match, try to extract state and use state center
    if (!coordinates) {
      const stateMap: Record<string, { lat: number; lng: number }> = {
        'AL': { lat: 32.806671, lng: -86.79113 },
        'CA': { lat: 36.116203, lng: -119.681564 },
        'NY': { lat: 42.165726, lng: -74.948051 },
        'TX': { lat: 31.054487, lng: -97.563461 },
        'FL': { lat: 27.766279, lng: -81.686783 },
        'IL': { lat: 40.349457, lng: -88.986137 },
        'PA': { lat: 40.590752, lng: -77.209755 },
        'OH': { lat: 40.388783, lng: -82.764915 },
        'GA': { lat: 33.040619, lng: -83.643074 },
        'NC': { lat: 35.630066, lng: -79.806419 },
        'MI': { lat: 43.326618, lng: -84.536095 },
        'AZ': { lat: 33.729759, lng: -111.431221 },
      };

      const stateMatch = address.match(/,\s*([A-Z]{2})\s*(?:,|\s|$)/i);
      if (stateMatch) {
        const state = stateMatch[1].toUpperCase();
        coordinates = stateMap[state];
      }
    }

    if (!coordinates) {
      throw new Error('Could not resolve coordinates for offline timezone lookup');
    }

    // Use tz-lookup to get timezone from coordinates
    const timezone = tzlookup(coordinates.lat, coordinates.lng);
    if (!timezone) {
      throw new Error('tz-lookup failed to resolve timezone');
    }

    return {
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      timezone,
      source: 'offline'
    };
  }

  /**
   * Get current week start in a specific timezone
   */
  getCurrentWeekStart(timezone: string): string {
    const now = new Date();
    
    // Get current time in the business timezone
    const businessTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const dayOfWeek = businessTime.getDay(); // 0=Sunday
    const daysToSunday = -dayOfWeek;
    
    const sunday = new Date(businessTime);
    sunday.setDate(businessTime.getDate() + daysToSunday);
    sunday.setHours(0, 0, 0, 0);
    
    return sunday.toISOString().split('T')[0];
  }

  /**
   * Check if a week is within the scheduling window for a business
   * UPDATED: Removed 4-week limit, now only prevents past week scheduling
   */
  isWeekInSchedulingWindow(weekStart: string, timezone: string, windowWeeks?: number): boolean {
    const windowStart = this.getCurrentWeekStart(timezone);
    // Only prevent scheduling for past weeks, allow unlimited future scheduling
    return weekStart >= windowStart;
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.debug('Timezone cache cleared');
  }
}
