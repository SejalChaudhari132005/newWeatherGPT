export type LocationSource = 'gps' | 'manual';
export type GPSStatus = 'idle' | 'loading' | 'success' | 'error' | 'denied';

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  postal_code?: string | null;
  formattedAddress?: string | null;
  formatted_address?: string | null;
  source: LocationSource;
  location_source?: LocationSource;
  displayName?: string;
  display_name?: string;
  updatedAt?: string;
}

export interface CityOption {
  id?: string;
  name: string;
  district: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  pincode?: string;
  display_name?: string;
}
