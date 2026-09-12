import React from 'react';
import {
  RefreshCw,
  AlertCircle,
  MapPin,
  Loader2,
} from 'lucide-react';
import { useWeatherIntelligence } from '../hooks/useWeatherIntelligence';
import { useLocation } from '../hooks/useLocation';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { WeatherHero } from '../components/dashboard/WeatherHero';
import { CitizenAlertBanner } from '../components/dashboard/CitizenAlertBanner';
import { CitizenLightAirQualityCard } from '../components/dashboard/CitizenLightAirQualityCard';
import { CitizenLightHourlyStrip } from '../components/dashboard/CitizenLightHourlyStrip';
import { CitizenLightMultiDayForecast } from '../components/dashboard/CitizenLightMultiDayForecast';
import { CitizenRadarSplitCard } from '../components/dashboard/CitizenRadarSplitCard';
import { CitizenTravelSplitCard } from '../components/dashboard/CitizenTravelSplitCard';
import { CitizenAskFloatingBar } from '../components/dashboard/CitizenAskFloatingBar';
import { useWeather } from '../context/WeatherContext';
import { useUI } from '../context/UIContext';

interface Props {
  onBack?: () => void;
  onOpenChatWithPrompt?: (promptText: string) => void;
  onNavigatePage?: (page: any) => void;
}

export const DashboardPage: React.FC<Props> = ({
  onOpenChatWithPrompt,
  onNavigatePage,
}) => {
  const { intelligence, loading, error, refreshIntelligence } = useWeatherIntelligence();
  const { location, openSelector } = useLocation();
  const { profile } = useAuthContext();
  const { language } = useLanguage();
  const { activeRole } = useWeather();
  const { setActiveTab, setVoiceModalOpen } = useUI();

  const role = (profile?.role || activeRole || 'citizen').toLowerCase();

  // Location display strictly from coordinates/geocoding
  const city = location?.city || intelligence?.location?.city || '';
  const state = location?.state || intelligence?.location?.state || '';
  const locationDisplay = city
    ? (state ? `${city}, ${state}` : city)
    : (location ? `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}` : 'Kalyan-Dombivli, Maharashtra');

  const handleAskGpt = (promptText: string) => {
    if (onOpenChatWithPrompt) {
      onOpenChatWithPrompt(promptText);
    } else {
      setActiveTab('ask');
    }
  };

  const handleNavigate = (tab: string) => {
    if (tab === 'travel') {
      handleAskGpt(
        language === 'mr'
          ? `${locationDisplay} पासून हवामान-सुरक्षित प्रवास मार्गाची योजना करा`
          : language === 'hi'
          ? `${locationDisplay} से मौसम-सुरक्षित यात्रा मार्ग की योजना बनाएं`
          : `Plan a weather-safe travel route from ${locationDisplay}`
      );
      return;
    }
    if (onNavigatePage) {
      onNavigatePage(tab);
    } else {
      setActiveTab(tab as any);
    }
  };

  const getUpdatedTimeString = (retrievedAt?: string | null): string => {
    if (!retrievedAt) return 'Just now';
    try {
      const diffMs = Date.now() - new Date(retrievedAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 minute ago';
      return `${diffMins} minutes ago`;
    } catch {
      return 'Just now';
    }
  };

  const heroWeatherData = intelligence ? {
    city: intelligence.location.city || city || 'Kalyan-Dombivli',
    state: intelligence.location.state || state || 'Maharashtra',
    temperature: intelligence.current.temperature.value,
    feelsLike: intelligence.current.feels_like.value,
    condition: intelligence.current.condition || 'Partly Cloudy',
    weatherCode: intelligence.current.weather_code,
    humidity: intelligence.current.humidity.value,
    windSpeed: intelligence.current.wind_speed.value,
    windDirection: String(intelligence.current.wind_direction.value || 'SW'),
    visibility: intelligence.current.visibility.value,
    pressure: intelligence.current.pressure.value,
    uvIndex: intelligence.current.uv_index.value,
    rainProbability: intelligence.current.rain_probability.value,
    providerSource: intelligence.current.temperature.source || 'Open-Meteo',
    updatedTime: getUpdatedTimeString(intelligence.data_freshness.retrieved_at),
  } : {
    city: city || 'Kalyan-Dombivli',
    state: state || 'Maharashtra',
    temperature: 25,
    feelsLike: 27,
    condition: 'Partly Cloudy',
    weatherCode: 2,
    humidity: 96,
    windSpeed: 5,
    windDirection: 'SW',
    visibility: 10,
    pressure: 1010,
    uvIndex: 0,
    rainProbability: 86,
    providerSource: 'Open-Meteo',
    updatedTime: 'Just now',
  };

  const [citizenAlerts, setCitizenAlerts] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;
    import('../services/alertService').then(({ alertService }) => {
      alertService.getCurrentAlerts(
        location.latitude,
        location.longitude,
        city,
        location.district || undefined,
        state,
        profile?.user_id || undefined,
        language
      ).then((res) => {
        setCitizenAlerts(res.alerts || []);
      }).catch(() => {});
    });
  }, [location?.latitude, location?.longitude, city, state, language]);

  const isFarmerAlert = (a: any) => {
    const t = (a?.type || '').toUpperCase();
    const title = (a?.title || '').toUpperCase();
    const desc = (a?.description || '').toUpperCase();
    return (
      t.includes('SPRAY') ||
      t.includes('PEST') ||
      t.includes('DISEASE') ||
      t.includes('FUNGAL') ||
      t.includes('CROP') ||
      t.includes('AGRICULTURE') ||
      t.includes('SOIL') ||
      t.includes('IRRIGAT') ||
      title.includes('SPRAY') ||
      title.includes('PEST') ||
      title.includes('CROP') ||
      title.includes('पिका') ||
      title.includes('फसल') ||
      desc.includes('पिका') ||
      desc.includes('फसल')
    );
  };

  const hourlyItems = intelligence?.forecast?.hourly || [];
  const dailyItems = intelligence?.forecast?.daily || [];
  const rawAlerts = citizenAlerts.length > 0 ? citizenAlerts : (intelligence?.alerts || []);
  const activeAlerts = role === 'farmer' ? rawAlerts : rawAlerts.filter((a) => !isFarmerAlert(a));
  const topAlert = activeAlerts.length > 0 ? activeAlerts[0] : null;

  const currentRainProb = intelligence?.current?.rain_probability?.value ?? 86;
  const currentTemp = intelligence?.current?.temperature?.value ?? 25;

  // Missing Location State
  if (!location?.latitude || !location?.longitude) {
    return (
      <div className="min-h-[70vh] bg-[#F5F7F9] p-4 flex flex-col items-center justify-center text-center font-sans space-y-4">
        <div className="gov-panel p-6 max-w-sm space-y-3">
          <div className="w-12 h-12 bg-sky-50 border border-sky-200 text-[#17365D] flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-[#17365D] uppercase tracking-wide">
            Location Jurisdiction Required
          </h2>
          <p className="text-xs text-[#5B6770]">
            Select your district or coordinates to receive localized meteorological bulletins and IMD advisories.
          </p>
          <button
            onClick={openSelector}
            className="gov-btn-primary w-full py-2 text-xs uppercase font-bold cursor-pointer"
          >
            Select District / Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] p-3 sm:p-4 max-w-4xl mx-auto space-y-3 pb-28 font-sans w-full">
      {/* Error Notice */}
      {error && (
        <div className="gov-panel p-3 border-l-4 border-l-[#B42318] bg-red-50/50 flex items-center justify-between gap-2 text-xs text-[#1F2933]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#B42318] shrink-0" />
            <span>Weather telemetry connection interrupted ({error}). Reconnecting...</span>
          </div>
          <button
            onClick={() => refreshIntelligence()}
            className="gov-btn-secondary px-2.5 py-1 text-[11px] font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !intelligence ? (
        <div className="gov-panel p-8 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 text-[#006B3C] animate-spin" />
          <p className="text-xs font-bold text-[#1F2933] uppercase tracking-wide">
            Querying IMD & Meteorological Observatories...
          </p>
        </div>
      ) : (
        <>
          {/* 1. IMD Meteorological Observation Panel */}
          {heroWeatherData && (
            <WeatherHero
              weather={heroWeatherData}
              role={role}
              locationName={locationDisplay}
              onAskGpt={handleAskGpt}
            />
          )}

          {/* 2. Active Severe Weather / Rainfall Forecast Banner */}
          <CitizenAlertBanner
            alert={topAlert}
            locationName={locationDisplay}
            rainProbability={currentRainProb}
            onViewDetails={() => handleNavigate('alerts')}
          />

          {/* 3. National Air Quality Index (CPCB / NAQI) */}
          <CitizenLightAirQualityCard
            latitude={location?.latitude}
            longitude={location?.longitude}
            onOpenDetails={() => handleNavigate('advisories')}
          />

          {/* 4. Hourly Forecast Strip */}
          <CitizenLightHourlyStrip
            hourly={hourlyItems}
            currentTemp={currentTemp}
          />

          {/* 5. 7-Day Meteorological Outlook Table */}
          <CitizenLightMultiDayForecast
            daily={dailyItems}
            onViewDetails={() => handleNavigate('forecast')}
          />

          {/* 6. Radar & Route Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CitizenRadarSplitCard
              locationName={locationDisplay}
              onOpenRadar={() => handleNavigate('radar')}
            />
            <CitizenTravelSplitCard
              onPlanRoute={() => handleNavigate('travel')}
            />
          </div>

          {/* 7. Agromet & Citizen Query Desk */}
          <CitizenAskFloatingBar
            onOpenChat={() => handleAskGpt(
              language === 'mr'
                ? `${locationDisplay} साठी सविस्तर हवामान अहवाल आणि सल्ला द्या`
                : language === 'hi'
                ? `${locationDisplay} के लिए मौसम रिपोर्ट और सलाह दें`
                : `Give me a weather report and advice for ${locationDisplay}`
            )}
            onOpenVoice={() => setVoiceModalOpen(true)}
          />
        </>
      )}
    </div>
  );
};
