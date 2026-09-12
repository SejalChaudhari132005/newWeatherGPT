import React from 'react';
import {
  CloudRain,
  RefreshCw,
  Droplets,
  Wind,
  Gauge,
  Sun,
  CloudSun,
  Cloud,
  CloudLightning,
  CloudSnow,
  CloudFog,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { translatePhrase, translateCondition } from '../../../utils/dashboardTranslator';

interface FarmLiveWeatherCardProps {
  temperature: number;
  feelsLike?: number;
  condition: string;
  weatherCode?: number;
  humidity: number;
  windSpeed: number;
  pressure?: number;
  uvIndex?: number;
  lastUpdated?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const FarmLiveWeatherCard: React.FC<FarmLiveWeatherCardProps> = ({
  temperature,
  feelsLike,
  condition,
  weatherCode = 0,
  humidity,
  windSpeed,
  pressure = 1008,
  uvIndex = 2,
  lastUpdated = '5 min ago',
  onRefresh,
  isLoading = false,
}) => {
  const { language } = useLanguage();

  // Helper for dynamic weather icon
  const getWeatherIcon = (code: number, cond: string) => {
    const c = cond.toLowerCase();
    if (code >= 95 || c.includes('thunder') || c.includes('storm')) {
      return <CloudLightning className="w-10 h-10 text-amber-300 drop-shadow-md" />;
    }
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || c.includes('rain') || c.includes('drizzle')) {
      return <CloudRain className="w-10 h-10 text-sky-200 drop-shadow-md" />;
    }
    if (code >= 71 && code <= 77) {
      return <CloudSnow className="w-10 h-10 text-slate-100 drop-shadow-md" />;
    }
    if (code >= 45 && code <= 48) {
      return <CloudFog className="w-10 h-10 text-slate-200 drop-shadow-md" />;
    }
    if (code >= 1 && code <= 3) {
      return <CloudSun className="w-10 h-10 text-amber-200 drop-shadow-md" />;
    }
    if (code === 0 || c.includes('clear') || c.includes('sun')) {
      return <Sun className="w-10 h-10 text-amber-300 drop-shadow-md animate-spin-slow" />;
    }
    return <Cloud className="w-10 h-10 text-slate-100 drop-shadow-md" />;
  };

  const translatedConditionText = translateCondition(condition, language);

  return (
    <div className="w-full rounded-3xl overflow-hidden shadow-lg border border-sky-400/40 bg-gradient-to-br from-[#1b5dbf] via-[#2470d8] to-[#12499c] text-white p-4 sm:p-5 relative transition-all">
      {/* Subtle Background Cloud & Mountain Silhouette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-400/20 via-transparent to-black/30 pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-white/15 backdrop-blur-sm">
            <CloudRain className="w-4 h-4 text-sky-200" />
          </div>
          <span className="text-xs sm:text-sm font-black tracking-wide text-white drop-shadow-sm">
            {translatePhrase('liveWeather', language)}
          </span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm transition-all cursor-pointer"
          title="Refresh Live Weather"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-sky-200' : ''}`} />
          <span>
            {translatePhrase('lastUpdated', language)} {lastUpdated}
          </span>
        </button>
      </div>

      {/* Hero Temperature & Condition */}
      <div className="my-4 relative z-10 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
              {typeof temperature === 'number' ? temperature.toFixed(1) : temperature}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-sky-200">°C</span>
          </div>

          <div className="text-xs font-semibold text-sky-100/90 mt-0.5">
            {translatePhrase('feelsLike', language)}{' '}
            {typeof feelsLike === 'number' ? feelsLike.toFixed(1) : (feelsLike ?? temperature)}°C
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 shadow-inner">
          {getWeatherIcon(weatherCode, condition)}
          <span className="text-sm sm:text-base font-extrabold text-white capitalize max-w-[130px] sm:max-w-xs truncate drop-shadow-sm">
            {translatedConditionText}
          </span>
        </div>
      </div>

      {/* 4 Bottom Telemetry Metrics */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-3 border-t border-white/15 relative z-10">
        {/* Humidity */}
        <div className="flex flex-col items-center text-center p-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
          <div className="flex items-center gap-1 text-sky-200 mb-0.5">
            <Droplets className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">{translatePhrase('humidity', language)}</span>
          </div>
          <span className="text-xs sm:text-sm font-black text-white">{Math.round(humidity)}%</span>
        </div>

        {/* Wind */}
        <div className="flex flex-col items-center text-center p-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
          <div className="flex items-center gap-1 text-sky-200 mb-0.5">
            <Wind className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">{translatePhrase('wind', language)}</span>
          </div>
          <span className="text-xs sm:text-sm font-black text-white">{Math.round(windSpeed)} km/h</span>
        </div>

        {/* Pressure */}
        <div className="flex flex-col items-center text-center p-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
          <div className="flex items-center gap-1 text-sky-200 mb-0.5">
            <Gauge className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">{translatePhrase('pressure', language)}</span>
          </div>
          <span className="text-xs sm:text-sm font-black text-white">{Math.round(pressure)} hPa</span>
        </div>

        {/* UV Index */}
        <div className="flex flex-col items-center text-center p-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
          <div className="flex items-center gap-1 text-sky-200 mb-0.5">
            <Sun className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">{translatePhrase('uvIndex', language)}</span>
          </div>
          <span className="text-xs sm:text-sm font-black text-white">
            {uvIndex} {uvIndex <= 2 ? '(Low)' : uvIndex <= 5 ? '(Mod)' : '(High)'}
          </span>
        </div>
      </div>
    </div>
  );
};
