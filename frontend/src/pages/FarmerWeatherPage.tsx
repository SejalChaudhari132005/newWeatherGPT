import React, { useState, useEffect, useCallback } from 'react';
import { useWeather } from '../hooks/useWeather';
import { useWeatherIntelligence } from '../hooks/useWeatherIntelligence';
import { useLocation } from '../hooks/useLocation';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { farmService } from '../services/farmService';
import { FarmProfile } from '../types/farm';

import { FarmerHeroCard } from '../components/roles/farmer/FarmerHeroCard';
import { FarmAdvisoryBanner } from '../components/roles/farmer/FarmAdvisoryBanner';
import { FarmHourlyForecast } from '../components/roles/farmer/FarmHourlyForecast';
import { FarmRainfallModule } from '../components/roles/farmer/FarmRainfallModule';
import { CitizenLightMultiDayForecast } from '../components/dashboard/CitizenLightMultiDayForecast';
import { CitizenAskFloatingBar } from '../components/dashboard/CitizenAskFloatingBar';
import { ManageFarmModal } from '../components/roles/farmer/ManageFarmModal';

interface FarmerWeatherPageProps {
  onOpenChatWithPrompt?: (prompt: string) => void;
}

export const FarmerWeatherPage: React.FC<FarmerWeatherPageProps> = ({
  onOpenChatWithPrompt,
}) => {
  const { weather, loading: weatherLoading } = useWeather();
  const { intelligence } = useWeatherIntelligence();
  const { location } = useLocation();
  const { profile } = useAuthContext();
  const { language } = useLanguage();
  const { setActiveTab } = useUI();

  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [isManageFarmOpen, setIsManageFarmOpen] = useState(false);

  const userId = profile?.user_id || profile?.id || 'farmer_user';

  // Load farm profile
  const loadFarm = useCallback(async () => {
    try {
      let f = await farmService.getFarm(userId);
      if (!f) {
        f = await farmService.upsertFarm({
          user_id: userId,
          farm_name: 'My Farm',
          latitude: location?.latitude || 19.2437,
          longitude: location?.longitude || 73.1355,
          village: location?.city || 'Kolam',
          district: location?.district || 'Thane',
          state: location?.state || 'Maharashtra',
          primary_crop: 'rice',
          crop_variety: 'Kolam',
          growth_stage: 'pod_filling',
          farm_size: 2.5,
          farm_size_unit: 'acres',
          irrigation_type: 'field_irrigation',
          soil_type: 'alluvial',
        });
      }
      setFarm(f);
    } catch (e) {
      console.warn('[FarmerWeatherPage] Failed to load farm profile:', e);
    }
  }, [userId, location?.latitude, location?.longitude, location?.city, location?.district, location?.state]);

  useEffect(() => {
    loadFarm();
  }, [loadFarm]);

  const handleAskGpt = (promptText?: string) => {
    if (onOpenChatWithPrompt) {
      onOpenChatWithPrompt(
        promptText ||
          (language === 'mr'
            ? 'आजचे हवामान माझ्या पिकासाठी कसे आहे? कृपया मार्गदर्शन करा.'
            : language === 'hi'
            ? 'आज का मौसम मेरी फसल के लिए कैसा है? कृपया मार्गदर्शन करें।'
            : 'How is today\'s weather for my crop? Please advise.')
      );
    } else {
      setActiveTab('ask');
    }
  };

  // Convert weather.hourly to FarmHourlyForecast format
  const hourlyItems = (weather?.hourly || []).map((h, i) => ({
    time: h.time || `${i}:00`,
    hour: i,
    temp: h.temp ?? 25,
    condition: h.condition || 'Clear',
    weatherCode: h.weatherCode,
    rainProbability: h.rainProb ?? 0,
    precipitation: h.precipitation ?? 0,
  }));

  // Calculate dynamic peak rain timing
  const peakRainTiming = (() => {
    if (!weather?.hourly || weather.hourly.length === 0) return null;
    const peakItem = weather.hourly.slice(0, 12).reduce((prev, curr) =>
      (curr.rainProb ?? 0) > (prev.rainProb ?? 0) ? curr : prev, weather.hourly[0]
    );
    const maxProb = peakItem?.rainProb ?? 0;
    if (maxProb < 30) {
      return language === 'mr' ? 'कमी शक्यता' : language === 'hi' ? 'कम संभावना' : 'Low Chance';
    }
    if (peakItem?.time === 'NOW' || peakItem?.time === 'now') {
      return language === 'mr' ? 'आत्ता / पुढील २ तास' : language === 'hi' ? 'अभी / अगले २ घंटे' : 'Now / Next 2h';
    }
    return `${peakItem?.time}`;
  })();

  const todayRainfall = weather?.current?.precipitation ?? 0;
  const next24hRainfall = (weather?.hourly || []).slice(0, 24).reduce((acc, h) => acc + (h.precipitation ?? 0), todayRainfall);
  const next7DaysRainfall = (weather?.daily || []).reduce((acc, d) => {
    const p = d.rainProbability ?? 0;
    return acc + (p > 60 ? 8.5 : p > 30 ? 3.0 : 0.4);
  }, todayRainfall);

  return (
    <div className="w-full px-3.5 sm:px-4 pt-3 pb-24 space-y-3.5 font-['Arimo',sans-serif]">
      {/* 1. Farmer Hero Card (Farmland scenic background with live weather and crop summary) */}
      <FarmerHeroCard
        farm={farm}
        weather={{
          temperature: weather?.current?.temperature ?? 28,
          condition: weather?.current?.condition ?? 'Light Rain',
          humidity: weather?.current?.humidity ?? 83,
          windSpeed: weather?.current?.wind_speed ?? 6.2,
          windDirection: weather?.current?.wind_direction ?? 'ESE',
          pressure: weather?.current?.pressure ?? 1008,
          uvIndex: weather?.current?.uv_index ?? 4,
          city: farm?.village || location?.city || 'Kolam',
          state: farm?.state || location?.state || 'Maharashtra',
        }}
        onOpenManageFarm={() => setIsManageFarmOpen(true)}
      />

      {/* 2. Farm Advisory Banner */}
      <FarmAdvisoryBanner
        cropName={farm?.primary_crop || 'rice'}
        rainProbability={weather?.current?.rain_probability ?? 15}
        onClick={() => handleAskGpt()}
      />

      {/* 3. Farm Hourly Forecast Strip */}
      <FarmHourlyForecast
        items={hourlyItems}
        onViewAll={() => setActiveTab('home')}
      />

      {/* 4. Farm Rainfall Outlook Module */}
      <FarmRainfallModule
        todayRainfallMm={todayRainfall}
        rainProbabilityPct={weather?.current?.rain_probability ?? 0}
        peakRainTiming={peakRainTiming}
        next24hRainfallMm={next24hRainfall}
        next7DaysRainfallMm={next7DaysRainfall}
      />

      {/* 5. 7-Day Multi-Day Forecast */}
      <CitizenLightMultiDayForecast
        daily={weather?.daily || []}
        onViewDetails={() => setActiveTab('home')}
      />

      {/* 6. Floating Ask WeatherGPT Action Bar */}
      <CitizenAskFloatingBar
        onOpenChat={() => handleAskGpt()}
      />

      {/* Manage Farm Modal */}
      <ManageFarmModal
        isOpen={isManageFarmOpen}
        onClose={() => setIsManageFarmOpen(false)}
        farm={farm}
        userId={userId}
        onFarmUpdated={(updatedFarm) => {
          setFarm(updatedFarm);
        }}
      />
    </div>
  );
};
