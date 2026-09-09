import React, { useState } from 'react';
import { MapPin, Sparkles, ArrowRight, Clock, ShieldCheck, ChevronDown } from 'lucide-react';
import { getRoleTheme } from '../../config/roleThemes';
import { getWeatherBackground } from '../../services/backgroundProvider';
import { useLocation } from '../../hooks/useLocation';
import { useLanguage } from '../../context/LanguageContext';
import { getWeatherIconInfo } from '../../utils/weatherIcons';
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
  onAskGpt,
}) => {
  const { location, openSelector } = useLocation();
  const { language } = useLanguage();
  const theme = getRoleTheme(role);
  const [imgError, setImgError] = useState(false);

  // Dynamic location display strictly from coordinates/context
  const displayCity = location?.city || weather.city || locationName.split(',')[0] || 'Detected Location';
  const displayState = location?.state || weather.state || '';
  const fullLocationString = displayState ? `${displayCity}, ${displayState}` : displayCity;
  const isGps = (location?.source || location?.location_source) === 'gps';

  // Section 10 & 13: Background Resolver
  const currentHour = new Date().getHours();
  const isNight = currentHour < 6 || currentHour >= 19;
  const bg = getWeatherBackground({
    role,
    location: fullLocationString,
    weatherCondition: weather.condition,
    isNight,
  });

  const decision = theme.defaultDecision;
  const iconInfo = getWeatherIconInfo(weather.weatherCode, weather.condition);
  const conditionDisplay = translateCondition(weather.condition || 'Clear Sky', language);

  return (
    <div className="relative rounded-[24px] sm:rounded-[36px] overflow-hidden shadow-2xl transition-all font-['Arimo'] border border-slate-200/80 bg-slate-900">
      {/* High-Resolution Location-Aware & Weather-Aware Background Image */}
      {!imgError && (
        <img
          src={bg.backgroundUrl}
          alt={bg.altText}
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-700 hover:scale-100"
        />
      )}

      {/* Role-Specific Weather-Responsive Blue Gradient Overlay (Section 8) */}
      <div className={`absolute inset-0 ${bg.overlay}`} />

      {/* Content Container */}
      <div className="relative z-10 p-3.5 sm:p-7 md:p-8 text-white space-y-3.5 sm:space-y-5 flex flex-col justify-between min-h-[380px] sm:min-h-[430px]">
        {/* Top Badges & Location Header */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between gap-2 pb-1">
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-blue-200 drop-shadow-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#fcd444]" />
              WeatherGPT
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-blue-100/90 italic">
              {translatePhrase('liveAtmosphericSync', language)}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1.5">
            {/* Interactive Location Selector Pill */}
            <button
              onClick={openSelector}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-[10px] sm:text-xs font-black text-white border border-white/30 transition-all cursor-pointer group shadow-sm"
              title="Click to set or change location"
            >
              <MapPin className="w-3.5 h-3.5 text-[#fcd444] shrink-0" />
              <span className="truncate">📍 {fullLocationString}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isGps ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'} shrink-0 ml-0.5`}></span>
              <span className="text-[9px] opacity-90 shrink-0 font-extrabold">
                {isGps ? `● ${translatePhrase('liveLocation', language)}` : `● ${translatePhrase('selectedLocation', language)}`}
              </span>
              <ChevronDown className="w-3 h-3 text-white/70 group-hover:text-white transition-transform group-hover:translate-y-0.5" />
            </button>

            {/* Badges Container */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Role Badge (Section 6 & 14) */}
              <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-blue-600/90 backdrop-blur-md text-[10px] sm:text-[11px] font-black text-white border border-blue-400/50 shrink-0 shadow-xs uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-blue-200" />
                <span>{translatePhrase('citizenRole', language)}</span>
              </div>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-[11px] sm:text-xs text-blue-100 font-medium pt-0.5">
            {translatePhrase('heroSubtitle', language)}
          </p>
        </div>

        {/* Hero Middle Section: Temperature & Weather Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end pt-1">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-7xl font-black tracking-tight leading-none text-white drop-shadow-md">
                {weather.temperature !== null && weather.temperature !== undefined ? `${weather.temperature}°` : '--°'}
              </span>
              <div className="text-[#fcd444] font-bold text-base sm:text-xl flex items-center gap-1">
                <span className="text-xl sm:text-2xl">{iconInfo.emoji}</span>
                <span>{conditionDisplay}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-white/90">
              <span>{translatePhrase('feelsLike', language)} {weather.feelsLike !== null && weather.feelsLike !== undefined ? `${weather.feelsLike}°` : '--°'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-white/80" />
                <span>{weather.updatedTime === 'Just now' ? translatePhrase('updatedJustNow', language) : weather.updatedTime || translatePhrase('updatedJustNow', language)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Weather Decision Card */}
        <div className="w-full bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-white/20 shadow-xl space-y-2.5 transition-all">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 text-xs font-black text-[#fcd444] tracking-wide uppercase min-w-0">
              <Sparkles className="w-4 h-4 shrink-0 text-[#fcd444]" />
              <span className="truncate">WeatherGPT {translatePhrase('citizenRole', language)} Intelligence</span>
            </div>

            <button
              onClick={() => onAskGpt(decision.action)}
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-white hover:text-[#fcd444] transition-colors cursor-pointer shrink-0"
            >
              <span>{translatePhrase('askAi', language)}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">
              {decision.icon} {language === 'en' ? decision.action : translatePhrase('carryUmbrella', language)}
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
              {language === 'en' ? decision.reason : translatePhrase('rainProbabilityIncrease', language)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
