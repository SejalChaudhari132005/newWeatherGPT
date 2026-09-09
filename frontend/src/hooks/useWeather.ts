import { useState, useEffect, useCallback } from 'react';
import { WeatherGPTResponse } from '../types/weather';
import { weatherService } from '../services/weatherService';
import { useLocation } from './useLocation';

export const useWeather = () => {
  const { location } = useLocation();
  const [weather, setWeather] = useState<WeatherGPTResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (location?.latitude == null || location?.longitude == null) {
      setWeather(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await weatherService.getWeather(
        location.latitude,
        location.longitude,
        location.city || undefined,
        location.state || undefined
      );
      setWeather(data);
    } catch (err: any) {
      console.error('[useWeather] Failed to fetch live weather:', err);
      setError(err?.message || 'Weather data is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [location?.latitude, location?.longitude, location?.city, location?.state]);

  // Refetch weather when coordinates change
  useEffect(() => {
    if (location?.latitude != null && location?.longitude != null) {
      fetchWeather();
    } else {
      setWeather(null);
    }
  }, [location?.latitude, location?.longitude, fetchWeather]);

  // Auto-refresh weather every 10 minutes (600,000 ms)
  useEffect(() => {
    if (location?.latitude == null || location?.longitude == null) return;

    const timer = setInterval(() => {
      fetchWeather();
    }, 600000);

    return () => clearInterval(timer);
  }, [location?.latitude, location?.longitude, fetchWeather]);

  return {
    weather,
    loading,
    error,
    refreshWeather: fetchWeather,
  };
};
