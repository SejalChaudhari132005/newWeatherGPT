import { UserLocation, LocationSource, CityOption } from '../types/location';
import { supabase } from '../lib/supabase';
import { apiClient } from './api';

export class LocationService {
  /**
   * Retrieve EXACT device hardware/network GPS coordinates via HTML5 Geolocation API.
   * Tries high accuracy first, and automatically falls back to standard accuracy for desktop PCs/laptops.
   */
  public async getExactGPSPosition(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser. Please search your location manually.'));
        return;
      }

      const attemptGPS = (highAccuracy: boolean) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            console.log(`[LocationService] GPS coordinates obtained (highAccuracy=${highAccuracy}):`, { latitude: lat, longitude: lon });
            resolve({ latitude: lat, longitude: lon });
          },
          (error) => {
            console.warn(`[LocationService] Geolocation error (highAccuracy=${highAccuracy}):`, error.code, error.message);
            if (highAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
              console.info('[LocationService] High-accuracy GPS timed out or unavailable. Retrying with standard network accuracy...');
              attemptGPS(false);
            } else {
              let errorMsg = 'Unable to access your location.';
              if (error.code === error.PERMISSION_DENIED) {
                errorMsg = 'Location permission was not granted. Click the lock 🔒 icon in your browser address bar to allow location access, or select location manually.';
              } else if (error.code === error.POSITION_UNAVAILABLE) {
                errorMsg = 'Location information is unavailable on your device. Please select location manually.';
              } else if (error.code === error.TIMEOUT) {
                errorMsg = 'GPS location detection timed out. Please select location manually.';
              }
              reject(new Error(errorMsg));
            }
          },
          {
            enableHighAccuracy: highAccuracy,
            timeout: highAccuracy ? 8000 : 12000,
            maximumAge: highAccuracy ? 0 : 60000,
          }
        );
      };

      attemptGPS(true);
    });
  }

  public async getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
    return this.getExactGPSPosition();
  }

  /**
   * Call FastAPI backend GET /api/location/reverse-geocode to reverse geocode exact coordinates
   */
  public async resolveLocation(
    latitude: number,
    longitude: number,
    source: LocationSource = 'gps'
  ): Promise<UserLocation> {
    console.log('[LocationService] Sending coordinates to FastAPI backend:', { latitude, longitude });
    try {
      const data: any = await apiClient.get(`/api/location/reverse-geocode?latitude=${latitude}&longitude=${longitude}&source=${source}`);
      
      if (data && data.success && data.location) {
        const loc = data.location;
        console.log('[LocationService] FastAPI reverse-geocoded result:', loc);
        return {
          latitude: loc.latitude,
          longitude: loc.longitude,
          city: loc.city || null,
          district: loc.district || loc.city || null,
          state: loc.state || null,
          country: loc.country || null,
          postalCode: loc.postal_code || null,
          postal_code: loc.postal_code || null,
          formattedAddress: loc.formatted_address || null,
          formatted_address: loc.formatted_address || null,
          source: loc.source || source,
          location_source: loc.source || source,
          updatedAt: new Date().toISOString(),
        };
      }
      throw new Error('Invalid location response from backend');
    } catch (err) {
      console.warn('[LocationService] Backend reverse-geocode warning:', err);
      return {
        latitude,
        longitude,
        city: null,
        district: null,
        state: null,
        country: null,
        postalCode: null,
        formattedAddress: null,
        source,
        location_source: source,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  public async reverseGeocode(latitude: number, longitude: number): Promise<UserLocation> {
    return this.resolveLocation(latitude, longitude, 'gps');
  }

  /**
   * Call FastAPI backend GET /api/location/search?q=query for manual location search
   */
  public async searchLocations(query: string): Promise<UserLocation[]> {
    const q = query.trim();
    if (!q) return [];

    try {
      const data: any = await apiClient.get(`/api/location/search?q=${encodeURIComponent(q)}`);
      if (data && data.success && Array.isArray(data.results)) {
        return data.results.map((res: any) => ({
          latitude: res.latitude,
          longitude: res.longitude,
          city: res.city || null,
          district: res.district || res.city || null,
          state: res.state || null,
          country: res.country || 'India',
          postalCode: res.postal_code || null,
          source: 'manual' as LocationSource,
          location_source: 'manual' as LocationSource,
          displayName: res.display_name,
        }));
      }
      return [];
    } catch (err) {
      console.warn('[LocationService] Location search error:', err);
      return [];
    }
  }

  /**
   * Save location context to user profile in Supabase
   */
  public async saveLocation(userId: string, location: UserLocation): Promise<boolean> {
    if (!userId) return false;
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('profiles')
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city || null,
          district: location.district || null,
          state: location.state || null,
          country: location.country || null,
          postal_code: location.postalCode || location.postal_code || null,
          formatted_address: location.formattedAddress || location.formatted_address || null,
          location_source: location.source || 'gps',
          location_updated_at: now,
          updated_at: now,
        })
        .eq('id', userId);

      if (error) {
        console.warn('[LocationService] Supabase profile location update error:', error.message);
        return false;
      }
      console.log('[LocationService] Saved location to Supabase profile:', { latitude: location.latitude, longitude: location.longitude });
      return true;
    } catch (err) {
      console.warn('[LocationService] Save location exception:', err);
      return false;
    }
  }

  /**
   * Fetch saved location from Supabase profile
   */
  public async getSavedLocation(userId: string): Promise<UserLocation | null> {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('latitude, longitude, city, district, state, country, postal_code, formatted_address, location_source')
        .eq('id', userId)
        .single();

      if (error || !data || data.latitude == null || data.longitude == null) {
        return null;
      }

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city || null,
        district: data.district || data.city || null,
        state: data.state || null,
        country: data.country || null,
        postalCode: data.postal_code || null,
        formattedAddress: data.formatted_address || null,
        source: (data.location_source as LocationSource) || 'gps',
        location_source: (data.location_source as LocationSource) || 'gps',
      };
    } catch (err) {
      console.warn('[LocationService] getSavedLocation error:', err);
      return null;
    }
  }
}

export const locationService = new LocationService();
