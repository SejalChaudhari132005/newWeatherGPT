import React, { useState, useEffect } from 'react';
import {
  MapPin,
  ChevronDown,
  Droplets,
  Wind,
  Gauge,
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Radio,
} from 'lucide-react';
import { getWeatherBackground } from '../../services/backgroundProvider';
import { useLocation } from '../../hooks/useLocation';
import { useLanguage } from '../../context/LanguageContext';
import { translateCondition, translatePhrase } from '../../utils/dashboardTranslator';

interface Props {
  weather: any;
  role: string;
  locationName: string;
  onAskGpt: (promptText: string) => void;
}

export const WeatherHero: React.FC<Props> = ({
  weather,
  role,
  locationName,
}) => {
  const { location, openSelector } = useLocation();
  const { language } = useLanguage();
  const [imgError, setImgError] = useState(false);
  const [formattedDateTime, setFormattedDateTime] = useState('');

  // Location string
  const displayCity = location?.city || weather?.city || locationName.split(',')[0] || 'New Delhi';
  const displayState = location?.state || weather?.state || (locationName.split(',')[1] || '').trim();
  const fullLocationString = displayState ? `${displayCity}, ${displayState}` : displayCity;

  // Format real-time local date and time string
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      };
      const datePart = now.toLocaleDateString('en-GB', options);
      const timePart = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setFormattedDateTime(`${datePart} | ${timePart}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = new Date().getHours();
  const isNight = currentHour < 6 || currentHour >= 19;
  const conditionDisplay = translateCondition(weather?.condition || 'Partly Cloudy', language);

  // Background Resolver based on GPS/location & condition
  const bg = getWeatherBackground({
    role,
    location: fullLocationString,
    weatherCondition: weather?.condition,
    isNight,
  });

  // Weather SVG Icon Resolver
  const getWeatherIcon = (conditionStr: string = '') => {
    const c = conditionStr.toLowerCase();
    if (c.includes('thunder') || c.includes('lightning') || c.includes('storm')) {
      return <CloudLightning className="w-8 h-8 text-amber-300" />;
    }
    if (c.includes('rain') || c.includes('shower') || c.includes('drizzle')) {
      return <CloudRain className="w-8 h-8 text-sky-200" />;
    }
    if (c.includes('snow')) {
      return <CloudSnow className="w-8 h-8 text-blue-100" />;
    }
    if (c.includes('cloud') || c.includes('overcast') || c.includes('fog') || c.includes('mist') || c.includes('haze')) {
      return isNight ? (
        <CloudMoon className="w-8 h-8 text-indigo-200" />
      ) : (
        <CloudSun className="w-8 h-8 text-amber-200" />
      );
    }
    if (c.includes('clear') || c.includes('sunny')) {
      return isNight ? (
        <Moon className="w-8 h-8 text-indigo-100" />
      ) : (
        <Sun className="w-8 h-8 text-amber-300" />
      );
    }
    return isNight ? (
      <CloudMoon className="w-8 h-8 text-indigo-200" />
    ) : (
      <CloudSun className="w-8 h-8 text-amber-200" />
    );
  };

  const tempVal = weather?.temperature !== null && weather?.temperature !== undefined ? Math.round(weather.temperature) : 27;
  const feelsLikeVal = weather?.feelsLike !== null && weather?.feelsLike !== undefined ? Math.round(weather.feelsLike) : tempVal;
  const humidityVal = weather?.humidity ?? 83;
  const windVal = weather?.windSpeed ? `${Math.round(weather.windSpeed)} km/h ${weather?.windDirection || 'SW'}` : '6.2 km/h ESE';
  const pressureVal = weather?.pressure ? `${Math.round(weather.pressure)} hPa` : '1008 hPa';
  const uvVal = weather?.uvIndex !== null && weather?.uvIndex !== undefined ? `${Math.round(weather.uvIndex)}` : '4';
  const rainProbVal = weather?.rainProbability ?? 86;

  const isFarmer = role.toLowerCase() === 'farmer';
  const heroBgImage = isFarmer ? '/assets/farmer-bg.jpg' : bg.backgroundUrl;

  return (
    <div className="gov-panel overflow-hidden relative">
      {/* Top Station Header */}
      <div className="gov-panel-header flex items-center justify-between relative z-20">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-[#006B3C] animate-pulse" />
          <span>{translatePhrase('surfaceObservation', language).toUpperCase()}</span>
        </div>
        <span className="gov-badge gov-badge-success text-[10px]">
          {translatePhrase('realtimeTelemetry', language).toUpperCase()}
        </span>
      </div>

      {/* Visual Image Container with Telemetry Overlay */}
      <div className="relative min-h-[280px] sm:min-h-[320px] bg-slate-900 overflow-hidden flex flex-col justify-between">
        {/* Background Photo */}
        {!imgError && (
          <img
            src={heroBgImage}
            alt={bg.altText || 'Live Weather Background'}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          />
        )}

        {/* Transparent Gradient Scrim (Natural photo visibility with text contrast) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none" />

        {/* Top Overlay: Station Location & Observation Timestamp */}
        <div className="relative z-10 p-2.5 sm:p-4 text-white">
          <div className="bg-black/55 backdrop-blur-md rounded-md p-2 sm:p-2.5 border border-white/15 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
            <div className="space-y-0.5 min-w-0">
              <button
                onClick={openSelector}
                className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-[#FF9933] transition-colors cursor-pointer group text-left"
                title="Change Observatory Location"
              >
                <MapPin className="w-3.5 h-3.5 text-[#FF9933] shrink-0" />
                <span className="truncate drop-shadow-sm max-w-[200px] sm:max-w-[300px]">{fullLocationString}</span>
                <ChevronDown className="w-3 h-3 text-white/80 group-hover:text-white shrink-0" />
              </button>
              <div className="text-[9px] sm:text-[10px] text-white/80 font-mono pl-5 drop-shadow-xs">
                Lat: {location?.latitude?.toFixed(4) || '19.2437'}°N, Lon: {location?.longitude?.toFixed(4) || '73.1355'}°E
              </div>
            </div>

            <div className="text-left sm:text-right text-[9px] sm:text-[10px] text-white/90 font-mono shrink-0 pl-5 sm:pl-0 border-t sm:border-t-0 border-white/10 pt-1 sm:pt-0">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                {formattedDateTime || 'Live Telemetry'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Overlay: Primary Temperature Reading & Condition */}
        <div className="relative z-10 p-2.5 sm:p-4 text-white">
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#17365D]/90 backdrop-blur-sm border border-white/20 rounded-md flex items-center justify-center shrink-0 shadow-lg">
                {getWeatherIcon(weather?.condition)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                  <span className="text-3xl sm:text-5xl font-black text-white leading-none drop-shadow-md">
                    {tempVal}°C
                  </span>
                  <span className="text-[10px] sm:text-xs text-white/90 font-semibold drop-shadow-xs">
                    ({translatePhrase('feelsLike', language)} {feelsLikeVal}°C)
                  </span>
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-emerald-300 uppercase tracking-wide pt-0.5 drop-shadow-xs truncate">
                  {conditionDisplay}
                </div>
              </div>
            </div>

            <div className="text-right text-xs text-white space-y-0.5 shrink-0 bg-black/45 backdrop-blur-sm rounded-md px-2 py-1.5 border border-white/10">
              <div className="text-[9px] sm:text-[10px] font-bold text-white/90 uppercase tracking-wider">
                {translatePhrase('rainProbability', language)}
              </div>
              <div className="text-lg sm:text-2xl font-black text-sky-200 leading-none">{rainProbVal}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Observation Telemetry Table with Dedicated Icons */}
      <div className="p-2.5 sm:p-3 bg-white space-y-2">
        <div className="border border-[#CBD5E1] rounded-xs overflow-x-auto scrollbar-thin">
          <table className="gov-table min-w-[360px] sm:min-w-full w-full text-left">
            <thead>
              <tr className="bg-[#F1F5F9] border-b border-[#CBD5E1]">
                <th className="w-[32%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider">
                  {translatePhrase('parameter', language)}
                </th>
                <th className="w-[20%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider">
                  {translatePhrase('observedValue', language)}
                </th>
                <th className="w-[28%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider">
                  {translatePhrase('standardReference', language)}
                </th>
                <th className="w-[20%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider text-right sm:text-left">
                  {translatePhrase('status', language)}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[11px] sm:text-xs">
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-[#1D5F91] shrink-0" />
                    <span className="truncate">{translatePhrase('relativeHumidity', language)}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{humidityVal}%</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">{translatePhrase('humidityRef', language)}</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className={`gov-badge text-[9px] sm:text-[10px] px-1.5 py-0.5 ${humidityVal > 80 ? 'gov-badge-warning' : 'gov-badge-success'}`}>
                    {humidityVal > 80 ? translatePhrase('high', language) : translatePhrase('normal', language)}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-[#006B3C] shrink-0" />
                    <span className="truncate">{translatePhrase('surfaceWind', language)}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{windVal}</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">{translatePhrase('windRef', language)}</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className="gov-badge gov-badge-success text-[9px] sm:text-[10px] px-1.5 py-0.5">{translatePhrase('favorable', language)}</span>
                </td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-[#17365D] shrink-0" />
                    <span className="truncate">{translatePhrase('barometricPressure', language)}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{pressureVal}</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">{translatePhrase('pressureRef', language)}</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className="gov-badge gov-badge-info text-[9px] sm:text-[10px] px-1.5 py-0.5">{translatePhrase('normal', language)}</span>
                </td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                    <span className="truncate">{translatePhrase('uvIndex', language)}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{uvVal}</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">{translatePhrase('uvRef', language)}</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className="gov-badge gov-badge-neutral text-[9px] sm:text-[10px] px-1.5 py-0.5">{translatePhrase('moderate', language)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
