import { useState, useEffect, useCallback } from 'react';
import { WeatherIntelligenceData } from '../types/weatherIntelligence';
import { weatherIntelligenceService } from '../services/weatherIntelligenceService';
import { useLocation } from './useLocation';

export const useWeatherIntelligence = () => {
  const { location } = useLocation();
  const [intelligence, setIntelligence] = useState<WeatherIntelligenceData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIntelligence = useCallback(async () => {
    if (location?.latitude == null || location?.longitude == null) {
      setIntelligence(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await weatherIntelligenceService.getWeatherIntelligence(
        location.latitude,
        location.longitude,
        location.city || undefined,
        undefined,
        location.state || undefined
      );
      setIntelligence(data);
    } catch (err: any) {
      console.error('[useWeatherIntelligence] Error fetching intelligence:', err);
      setError(err?.message || 'Weather intelligence is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [location?.latitude, location?.longitude, location?.city, location?.state]);

  // Fetch when coordinates change
  useEffect(() => {
    if (location?.latitude != null && location?.longitude != null) {
      fetchIntelligence();
    } else {
      setIntelligence(null);
    }
  }, [location?.latitude, location?.longitude, fetchIntelligence]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    if (location?.latitude == null || location?.longitude == null) return;
    const timer = setInterval(() => {
      fetchIntelligence();
    }, 600000);
    return () => clearInterval(timer);
  }, [location?.latitude, location?.longitude, fetchIntelligence]);

  return {
    intelligence,
    loading,
    error,
    refreshIntelligence: fetchIntelligence,
  };
};
