import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserLocation } from '../types/location';
import { CurrentWeather, HourlyForecast, DailyForecast, HyperlocalRisk } from '../types/weather';
import { UserRole } from '../types/role';
import { ChatMessage } from '../types/chat';
import { locationService } from '../services/locationService';
import { weatherService } from '../services/weatherService';
import { forecastService } from '../services/forecastService';
import { MOCK_CURRENT_WEATHER, MOCK_HOURLY_FORECAST, MOCK_DAILY_FORECAST, MOCK_HYPERLOCAL_RISKS } from '../data/mockWeather';
import { useAuthContext } from './AuthContext';

interface WeatherContextType {
  userLocation: UserLocation | null;
  locationLoading: boolean;
  locationError: string | null;
  hasLocationBeenSet: boolean;
  detectUserLocation: () => Promise<void>;
  setCustomLocation: (loc: UserLocation) => void;
  currentWeather: CurrentWeather;
  hourlyForecast: HourlyForecast[];
  sevenDayForecast: DailyForecast[];
  hyperlocalRisks: HyperlocalRisk[];
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  chatMessages: ChatMessage[];
  sendQueryToWeatherGPT: (query: string) => Promise<void>;
  isAiThinking: boolean;
  activeExplainableMsg: ChatMessage | null;
  setActiveExplainableMsg: (msg: ChatMessage | null) => void;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuthContext();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasLocationBeenSet, setHasLocationBeenSet] = useState<boolean>(false);

  const [currentWeather, setCurrentWeather] = useState<CurrentWeather>(MOCK_CURRENT_WEATHER);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>(MOCK_HOURLY_FORECAST);
  const [sevenDayForecast, setSevenDayForecast] = useState<DailyForecast[]>(MOCK_DAILY_FORECAST);
  const [hyperlocalRisks, setHyperlocalRisks] = useState<HyperlocalRisk[]>(MOCK_HYPERLOCAL_RISKS);
  const [activeRole, setActiveRole] = useState<UserRole>('Citizen');

  // Synchronize activeRole whenever userProfile changes
  useEffect(() => {
    if (userProfile?.role) {
      const r = userProfile.role.toLowerCase();
      if (r === 'farmer') setActiveRole('Farmer');
      else if (r === 'fisherman') setActiveRole('Fisher');
      else if (r === 'disaster_manager') setActiveRole('Disaster Manager');
      else if (r === 'aviation') setActiveRole('Aviation');
      else if (r === 'urban_planner') setActiveRole('Urban Planner');
      else if (r === 'researcher') setActiveRole('Researcher');
      else setActiveRole('Citizen');
    }
  }, [userProfile?.role]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Hello! I am **WeatherGPT**, your AI atmospheric intelligence assistant. Ask me anything about conditions, local rain risk, crop advisories, or route travel weather.',
      timestamp: 'Just now',
      suggestedFollowups: [
        'Will it rain today?',
        'Will it rain tomorrow?',
        'Is it safe to travel?',
        'Flood risk near me',
        'Weather for my farm',
        'Is it safe to go fishing?'
      ]
    }
  ]);

  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [activeExplainableMsg, setActiveExplainableMsg] = useState<ChatMessage | null>(null);

  // Trigger real browser Geolocation API
  const detectUserLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const coords = await locationService.getCurrentPosition();
      const resolvedLocation = await locationService.reverseGeocode(coords.latitude, coords.longitude);
      setUserLocation(resolvedLocation);
      setHasLocationBeenSet(true);

      // Refresh weather data for detected location
      const updatedWeather = await weatherService.getCurrentWeather(resolvedLocation);
      const updatedRisks = await weatherService.getHyperlocalRisks(resolvedLocation);
      setCurrentWeather(updatedWeather);
      setHyperlocalRisks(updatedRisks);
    } catch (err: any) {
      console.error('Location error:', err);
      setLocationError(err.message || 'Could not retrieve GPS location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const setCustomLocation = (loc: UserLocation) => {
    setUserLocation(loc);
    setHasLocationBeenSet(true);
    setLocationError(null);

    weatherService.getCurrentWeather(loc).then(setCurrentWeather);
    weatherService.getHyperlocalRisks(loc).then(setHyperlocalRisks);
  };

  // Conversational query launcher
  const sendQueryToWeatherGPT = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsAiThinking(true);

    const activeLoc: UserLocation = userLocation || {
      latitude: 0,
      longitude: 0,
      city: 'Current Location',
      district: '',
      state: '',
      country: 'India',
      source: 'gps',
    };

    try {
      const aiResponse = await weatherService.askWeatherGPT(queryText, activeLoc, activeRole);
      setChatMessages((prev) => [...prev, aiResponse]);
    } catch (e) {
      console.error('Failed to get AI response', e);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <WeatherContext.Provider
      value={{
        userLocation,
        locationLoading,
        locationError,
        hasLocationBeenSet,
        detectUserLocation,
        setCustomLocation,
        currentWeather,
        hourlyForecast,
        sevenDayForecast,
        hyperlocalRisks,
        activeRole,
        setActiveRole,
        chatMessages,
        sendQueryToWeatherGPT,
        isAiThinking,
        activeExplainableMsg,
        setActiveExplainableMsg,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used within WeatherProvider');
  return ctx;
};
