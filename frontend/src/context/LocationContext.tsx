import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserLocation, LocationSource, GPSStatus, CityOption } from '../types/location';
import { locationService } from '../services/locationService';
import { useAuthContext } from './AuthContext';

export interface LocationContextType {
  location: UserLocation | null;
  setLocation: (loc: UserLocation | null) => void;
  loading: boolean;
  isSubmitting: boolean;
  gpsStatus: GPSStatus;
  statusMessage: string;
  error: string | null;
  errorMessage: string | null;
  detectLocation: () => Promise<UserLocation | null>;
  selectLocation: (loc: UserLocation) => Promise<void>;
  saveLocationGps: () => Promise<boolean>;
  saveLocationManual: (locationObj: any) => Promise<boolean>;
  refreshLocation: () => Promise<void>;
  clearLocation: () => void;
  clearError: () => void;
  searchLocations: (query: string) => Promise<UserLocation[]>;
  isSelectorOpen: boolean;
  openSelector: () => void;
  closeSelector: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId, userProfile, handleUpdateLocation } = useAuthContext();
  const [location, setLocationState] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<GPSStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Location ready');
  const [error, setError] = useState<string | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);

  // Sync location with userProfile when profile updates or loads
  useEffect(() => {
    if (userProfile && userProfile.latitude != null && userProfile.longitude != null) {
      const profLoc: UserLocation = {
        latitude: userProfile.latitude,
        longitude: userProfile.longitude,
        city: userProfile.city || null,
        district: userProfile.district || null,
        state: userProfile.state || null,
        country: userProfile.country || null,
        postalCode: userProfile.postal_code || null,
        formattedAddress: userProfile.formatted_address || null,
        source: (userProfile.location_source as LocationSource) || 'gps',
      };
      setLocationState(profLoc);
    }
  }, [userProfile]);

  const setLocation = useCallback((loc: UserLocation | null) => {
    setLocationState(loc);
    if (loc && userId) {
      handleUpdateLocation(loc);
    }
  }, [userId, handleUpdateLocation]);

  // Detect exact device GPS Location
  const detectLocation = useCallback(async (): Promise<UserLocation | null> => {
    setLoading(true);
    setGpsStatus('loading');
    setStatusMessage('Detecting exact device GPS coordinates...');
    setError(null);

    try {
      // 1. Get exact hardware GPS coordinates
      const coords = await locationService.getExactGPSPosition();
      console.log('GPS coordinates:', coords);

      // 2. Reverse geocode via FastAPI backend LocationAgent
      const resolved = await locationService.resolveLocation(coords.latitude, coords.longitude, 'gps');
      console.log('Resolved location:', resolved);
      
      setLocationState(resolved);
      setGpsStatus('success');
      setStatusMessage(resolved.city ? `Detected: ${resolved.city}` : 'Exact location detected');

      if (userId) {
        await locationService.saveLocation(userId, resolved);
      }

      setLoading(false);
      return resolved;
    } catch (err: any) {
      console.warn('[LocationContext] detectLocation error:', err);
      const msg = err.message || 'Unable to access your location.';
      setError(msg);
      
      if (msg.includes('permission')) {
        setGpsStatus('denied');
        setStatusMessage('Location permission was not granted.');
      } else {
        setGpsStatus('error');
        setStatusMessage('Unable to access your location.');
      }

      setLoading(false);
      return null;
    }
  }, [userId]);

  // Save location from onboarding GPS flow
  const saveLocationGps = useCallback(async (): Promise<boolean> => {
    setIsSubmitting(true);
    const loc = await detectLocation();
    setIsSubmitting(false);
    return loc !== null;
  }, [detectLocation]);

  // Save location from onboarding manual selection
  const saveLocationManual = useCallback(async (locationObj: any): Promise<boolean> => {
    setIsSubmitting(true);
    const manualLoc: UserLocation = {
      latitude: locationObj.latitude || locationObj.lat,
      longitude: locationObj.longitude || locationObj.lng,
      city: locationObj.city || locationObj.name || null,
      district: locationObj.district || locationObj.city || null,
      state: locationObj.state || null,
      country: locationObj.country || 'India',
      postalCode: locationObj.postal_code || locationObj.pincode || null,
      formattedAddress: locationObj.display_name || locationObj.formatted_address || null,
      source: 'manual',
      location_source: 'manual',
    };

    console.log('[LocationContext] Selected manual location:', manualLoc);
    setLocationState(manualLoc);
    
    if (userId) {
      await locationService.saveLocation(userId, manualLoc);
    }
    setIsSubmitting(false);
    return true;
  }, [userId]);

  // Select Manual Location
  const selectLocation = useCallback(async (newLoc: UserLocation) => {
    setLoading(true);
    const manualLoc: UserLocation = { ...newLoc, source: 'manual', location_source: 'manual' };
    console.log('[LocationContext] Manually selected location active:', manualLoc);
    
    setLocationState(manualLoc);
    setStatusMessage(manualLoc.city ? `Selected: ${manualLoc.city}` : 'Selected location active');
    setError(null);

    if (userId) {
      await locationService.saveLocation(userId, manualLoc);
    }
    setLoading(false);
    setIsSelectorOpen(false);
  }, [userId]);

  const refreshLocation = useCallback(async () => {
    if (location?.source === 'gps' && location.latitude != null && location.longitude != null) {
      const resolved = await locationService.resolveLocation(location.latitude, location.longitude, 'gps');
      setLocationState(resolved);
    } else if (location?.latitude != null && location?.longitude != null) {
      const resolved = await locationService.resolveLocation(location.latitude, location.longitude, 'manual');
      setLocationState(resolved);
    }
  }, [location]);

  const searchLocations = useCallback(async (query: string): Promise<UserLocation[]> => {
    return await locationService.searchLocations(query);
  }, []);

  const clearLocation = useCallback(() => {
    setLocationState(null);
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        loading,
        isSubmitting,
        gpsStatus,
        statusMessage,
        error,
        errorMessage: error,
        detectLocation,
        selectLocation,
        saveLocationGps,
        saveLocationManual,
        refreshLocation,
        clearLocation,
        clearError: () => setError(null),
        searchLocations,
        isSelectorOpen,
        openSelector: () => setIsSelectorOpen(true),
        closeSelector: () => setIsSelectorOpen(false),
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};
