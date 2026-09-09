import React from 'react';
import {
  MessageSquare,
  RefreshCw,
  AlertCircle,
  MapPin,
  Loader2,
  Building2,
  Database,
  Radio,
} from 'lucide-react';
import { useWeatherIntelligence } from '../hooks/useWeatherIntelligence';
import { useLocation } from '../hooks/useLocation';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage, LANGUAGES, LanguageCode } from '../context/LanguageContext';
import { getMockWeatherData } from '../data/mockWeather';
import { WeatherHero } from '../components/dashboard/WeatherHero';
import { WeatherMetrics } from '../components/dashboard/WeatherMetrics';
import { HourlyForecast } from '../components/dashboard/HourlyForecast';
import { RoleIntelligence } from '../components/dashboard/RoleIntelligence';
import { LiveWeatherMap } from '../components/dashboard/LiveWeatherMap';
import { WeatherAlerts } from '../components/dashboard/WeatherAlerts';
import { WeeklyForecast } from '../components/dashboard/WeeklyForecast';
import { QuickActions } from '../components/dashboard/QuickActions';
import { WeatherInsightCard } from '../components/dashboard/WeatherInsightCard';
import { WeatherConfidenceCard } from '../components/dashboard/WeatherConfidenceCard';
import { RiskOverview } from '../components/dashboard/RiskOverview';

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
  const { language, setLanguage } = useLanguage();

  const role = (profile?.role || 'citizen').toLowerCase();

  // Location display strictly from coordinates/geocoding
  const city = location?.city || intelligence?.location?.city || '';
  const state = location?.state || intelligence?.location?.state || '';
  const locationDisplay = city
    ? (state ? `${city}, ${state}` : city)
    : (location ? `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}` : 'Location Detected');

  const handleAskGpt = (promptText: string) => {
    if (onOpenChatWithPrompt) {
      onOpenChatWithPrompt(promptText);
    }
  };

  // Helper for last updated time calculation
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

  // Convert live verified intelligence into WeatherHero structure
  const heroWeatherData = intelligence ? {
    city: intelligence.location.city || city || 'Location Detected',
    state: intelligence.location.state || state || '',
    temperature: intelligence.current.temperature.value,
    feelsLike: intelligence.current.feels_like.value,
    condition: intelligence.current.condition,
    weatherCode: intelligence.current.weather_code,
    humidity: intelligence.current.humidity.value,
    windSpeed: intelligence.current.wind_speed.value,
    windDirection: String(intelligence.current.wind_direction.value || 'N'),
    visibility: intelligence.current.visibility.value,
    pressure: intelligence.current.pressure.value,
    uvIndex: intelligence.current.uv_index.value,
    rainProbability: intelligence.current.rain_probability.value,
    providerSource: intelligence.current.temperature.source || 'Open-Meteo',
    updatedTime: getUpdatedTimeString(intelligence.data_freshness.retrieved_at),
  } : null;

  // Adapt current for WeatherMetrics component
  const currentMetrics = intelligence ? {
    temperature: intelligence.current.temperature.value,
    feels_like: intelligence.current.feels_like.value,
    humidity: intelligence.current.humidity.value,
    rain_probability: intelligence.current.rain_probability.value,
    precipitation: intelligence.current.precipitation.value,
    wind_speed: intelligence.current.wind_speed.value,
    wind_direction: String(intelligence.current.wind_direction.value || 'N'),
    visibility: intelligence.current.visibility.value,
    pressure: intelligence.current.pressure.value,
    uv_index: intelligence.current.uv_index.value,
    condition: intelligence.current.condition,
    icon: intelligence.current.icon,
    weather_code: intelligence.current.weather_code,
    observed_at: intelligence.current.observed_at,
  } : undefined;

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

  const hourlyItems = intelligence?.forecast?.hourly || [];
  const weeklyItems = intelligence?.forecast?.daily || [];
  const activeAlerts = citizenAlerts.length > 0 ? citizenAlerts : (intelligence?.alerts || []);
  const officialInfo = intelligence?.official_information;
  const officialObs = officialInfo?.observations?.[0];

  // Static structure fallback for secondary non-weather role advisory templates
  const fallbackMock = getMockWeatherData(city || locationDisplay, state || 'India');
  const roleIntelligence = fallbackMock.roleIntelligence[role] || fallbackMock.roleIntelligence.citizen;

  // 1. Missing Location State
  if (!location?.latitude || !location?.longitude) {
    return (
      <div className="min-h-[70vh] bg-[#F4F7FC] p-4 flex flex-col items-center justify-center text-center font-['Arimo'] space-y-4">
        <div className="p-4 rounded-full bg-blue-50 text-[#004aad] border border-blue-200 shadow-sm">
          <MapPin className="w-10 h-10 animate-bounce" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h2 className="text-xl font-black text-slate-900">Set your location to see local weather</h2>
          <p className="text-xs text-slate-500 font-medium">
            WeatherGPT requires precise coordinates to deliver accurate Open-Meteo forecasts and official IMD intelligence.
          </p>
        </div>
        <button
          onClick={openSelector}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#004aad] to-[#38b6ff] text-white shadow-lg text-xs font-black hover:opacity-95 transition-all cursor-pointer"
        >
          📍 Set Location
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] p-2.5 sm:p-4 md:p-6 font-['Arimo'] max-w-4xl mx-auto space-y-3.5 sm:space-y-5 pb-24 overflow-x-hidden w-full max-w-full">
      
      {/* Top Header with Multi-Provider Status Badges & Manual Refresh */}
      <div className="flex items-center justify-between gap-2 px-0.5 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-white text-[#004aad] border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
            <img src="/assets/logo-icon.png" alt="WeatherGPT Logo" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-2xl font-black text-slate-900 tracking-tight truncate">WeatherGPT Intelligence</h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black tracking-wide border border-blue-200">
                ● Open-Meteo
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black tracking-wide border border-amber-200">
                ● IMD Official
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
              📍 {locationDisplay} {intelligence?.location?.imd_subdivision ? `• ${intelligence.location.imd_subdivision}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Visible Dashboard Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-[11px] sm:text-xs font-black py-1.5 pl-2 pr-5 rounded-xl shadow-2xs hover:border-[#38b6ff] focus:outline-none focus:ring-2 focus:ring-[#38b6ff]/20 cursor-pointer transition-all"
              title="Select Language / भाषा निवडा"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="font-medium text-slate-800">
                  🌐 {lang.nativeName}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-slate-400 text-[8px]">
              ▼
            </div>
          </div>

          <button
            onClick={() => refreshIntelligence()}
            disabled={loading}
            title="Refresh weather data"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#004aad] hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#38b6ff]' : ''}`} />
          </button>

          <button
            onClick={() => handleAskGpt(`Give me a complete weather report and verified intelligence analysis for ${locationDisplay}`)}
            className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#004aad] to-[#38b6ff] text-white shadow-md flex items-center gap-1 text-xs font-extrabold cursor-pointer hover:opacity-95 transition-all shrink-0 active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#fcd444]" />
            <span className="text-[11px] sm:text-xs font-black">Chat</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Weather intelligence is temporarily unavailable. ({error})</span>
          </div>
          <button
            onClick={() => refreshIntelligence()}
            className="px-3 py-1 rounded-xl bg-rose-600 text-white font-black text-[11px] hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !intelligence ? (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#004aad] animate-spin" />
          <p className="text-xs font-bold text-slate-600">Synthesizing verified weather intelligence & risk metrics...</p>
        </div>
      ) : (
        <>
          {/* 1. Location-Aware Hero (Current Weather) */}
          {heroWeatherData && (
            <WeatherHero
              weather={heroWeatherData}
              role={role}
              locationName={locationDisplay}
              onAskGpt={handleAskGpt}
            />
          )}

          {/* 2. Deterministic Weather Insights Card */}
          {intelligence?.insights && intelligence.insights.length > 0 && (
            <WeatherInsightCard
              insights={intelligence.insights}
              locationName={locationDisplay}
            />
          )}

          {/* 3. Official IMD Weather Alert */}
          <WeatherAlerts
            alerts={activeAlerts}
            locationName={locationDisplay}
            onOpenAlerts={() => onNavigatePage && onNavigatePage('alerts')}
          />

          {/* 4. Current Environmental Metrics */}
          <WeatherMetrics current={currentMetrics} />

          {/* 5. Verified Risk Matrix */}
          <RiskOverview
            risks={intelligence?.risks}
            legacyRisks={fallbackMock.risks}
            onAskGpt={handleAskGpt}
          />

          {/* 6. Hourly Forecast Timeline (Open-Meteo Numerical Model) */}
          {hourlyItems.length > 0 && <HourlyForecast hourly={hourlyItems} />}

          {/* 7. 7-Day Forecast (Open-Meteo Numerical Model) */}
          {weeklyItems.length > 0 && <WeeklyForecast weekly={weeklyItems} />}

          {/* 8. WeatherGPT Confidence Card */}
          {intelligence?.confidence && (
            <WeatherConfidenceCard
              confidence={intelligence.confidence}
              sourceStatus={intelligence.source_status}
            />
          )}

          {/* 9. Live Weather Radar Map */}
          <LiveWeatherMap
            locationName={locationDisplay}
            onOpenFullMap={() => onNavigatePage && onNavigatePage('map')}
          />

          {/* 10. Role Intelligence & Quick Actions */}
          <RoleIntelligence
            intelligence={roleIntelligence}
            roleTitle={role.replace('_', ' ').toUpperCase()}
            onAskGpt={handleAskGpt}
          />
          <QuickActions role={role} locationName={locationDisplay} onAskGpt={handleAskGpt} />

          {/* 11. Data Provenance & Official IMD Attribution Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3 font-['Arimo']">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#004aad]" />
                Weather Intelligence Provenance & Attribution
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Freshness: {intelligence?.data_freshness.age_minutes != null ? `${intelligence.data_freshness.age_minutes}m ago` : 'Real-time'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              {/* Numerical Model Data Attribution */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-blue-950 flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5 text-blue-600" />
                    Model & Forecast Data
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-blue-200/80 text-blue-900 text-[9px] font-black">
                    Open-Meteo
                  </span>
                </div>
                <p className="text-[10px] text-blue-900/80 leading-tight">
                  High-resolution hourly & 7-day predictive models computed from global ECMWF/GFS meteorological datasets.
                </p>
              </div>

              {/* Official IMD Intelligence Attribution */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-950 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-700" />
                    Official Meteorological Intelligence
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 text-[9px] font-black">
                    IMD (Govt. of India)
                  </span>
                </div>
                <p className="text-[10px] text-amber-900/80 leading-tight">
                  {officialObs?.station_name ? `Mapped Station: ${officialObs.station_name}` : 'District & Subdivision Severe Warnings'} • Ministry of Earth Sciences.
                </p>
                {officialInfo?.message && (
                  <p className="text-[9px] text-amber-800 font-medium italic pt-0.5">
                    {officialInfo.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
