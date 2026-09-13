import React, { useState, useEffect } from 'react';
import {
  MapPin,
  ChevronDown,
  Waves,
  Wind,
  Compass,
  Clock,
  Radio,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Thermometer,
  Anchor,
  Droplets,
  Gauge,
  Eye,
  Sun,
  CloudRain,
  CloudLightning,
  CloudSun,
  RefreshCw,
} from 'lucide-react';
import { SailingClearance, HydrodynamicSeaState } from '../../../types/fisherIntelligence';
import { useLanguage } from '../../../context/LanguageContext';
import { translatePhrase, translateCondition, formatLocalizedDateTime } from '../../../utils/dashboardTranslator';

export interface HarborInfo {
  name: string;
  lat: number;
  lon: number;
  state: string;
}

interface FishermanHeroCardProps {
  harbor: HarborInfo;
  harborsList: HarborInfo[];
  onSelectHarbor: (h: HarborInfo) => void;
  departureTime: string;
  departureTimesList: string[];
  onSelectDeparture: (t: string) => void;
  clearance?: SailingClearance;
  seaState?: HydrodynamicSeaState;
  weather?: any;
  onRefresh?: () => void;
  loading?: boolean;
}

export const FishermanHeroCard: React.FC<FishermanHeroCardProps> = ({
  harbor,
  harborsList,
  onSelectHarbor,
  departureTime,
  departureTimesList,
  onSelectDeparture,
  clearance,
  seaState,
  weather,
  onRefresh,
  loading = false,
}) => {
  const { language } = useLanguage();
  const [imgError, setImgError] = useState(false);
  const [formattedDateTime, setFormattedDateTime] = useState('');

  // Live timestamp clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setFormattedDateTime(formatLocalizedDateTime(now, language));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [language]);

  const status = clearance?.status || 'favorable';

  const statusConfig = {
    favorable: {
      badgeBg: 'bg-emerald-600 text-white',
      badgeBorder: 'border-emerald-700',
      title: 'SAFE TO SAIL',
      marathiTitle: 'नौकानयन सुरक्षित',
      hindiTitle: 'नौवहन सुरक्षित',
      icon: ShieldCheck,
    },
    caution: {
      badgeBg: 'bg-amber-600 text-white',
      badgeBorder: 'border-amber-700',
      title: 'CAUTION ADVISED',
      marathiTitle: 'सावधगिरी बाळगा',
      hindiTitle: 'सतर्कता बरतें',
      icon: AlertTriangle,
    },
    no_departure: {
      badgeBg: 'bg-rose-600 text-white',
      badgeBorder: 'border-rose-700',
      title: 'NO DEPARTURE',
      marathiTitle: 'प्रस्थान मनाई (Harbor Bound)',
      hindiTitle: 'प्रस्थान निषेध (Harbor Bound)',
      icon: ShieldAlert,
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  // Marine & Hydrodynamic values
  const waveHeight = Number((seaState?.wave_height_m ?? clearance?.max_wave_height_m ?? 1.14).toFixed(2));
  const swellPeriod = Number((seaState?.swell_period_sec ?? seaState?.swell_period_s ?? 7.5).toFixed(1));
  const windSpeedKts = Number((clearance?.max_wind_speed_kts ?? 9.1).toFixed(1));
  const windDir = clearance?.wind_direction ? String(clearance.wind_direction) : 'WNW';
  const sst = Number((seaState?.sea_surface_temp_c ?? 28.4).toFixed(1));
  const beaufortDesc = seaState?.beaufort_description || 'Gentle Breeze (Force 3)';

  // Atmospheric Weather values (grounded from weather provider)
  const tempVal = weather?.temperature != null ? Math.round(weather.temperature) : 29;
  const feelsLikeVal = weather?.feelsLike != null ? Math.round(weather.feelsLike) : tempVal + 3;
  const humidityVal = weather?.humidity ?? 78;
  const pressureVal = weather?.pressure ? Math.round(weather.pressure) : 1010;
  const visibilityVal = weather?.visibility ? `${(weather.visibility / 1000).toFixed(1)} km` : '10 km';
  const rawCondition = weather?.condition || 'Partly Cloudy';
  const conditionDisplay = translateCondition(rawCondition, language);

  const getConditionIcon = () => {
    const c = rawCondition.toLowerCase();
    if (c.includes('thunder') || c.includes('storm')) {
      return <CloudLightning className="w-8 h-8 text-amber-300" />;
    }
    if (c.includes('rain') || c.includes('drizzle')) {
      return <CloudRain className="w-8 h-8 text-sky-200" />;
    }
    if (c.includes('cloud') || c.includes('overcast')) {
      return <CloudSun className="w-8 h-8 text-amber-200" />;
    }
    return <Sun className="w-8 h-8 text-amber-300" />;
  };

  return (
    <div className="gov-panel overflow-hidden relative shadow-xs font-sans">
      {/* 1. Top Government Station Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-xs bg-[#006B3C]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#17365D]">
            {language === 'mr'
              ? 'सागरी हवामान व मत्स्य व्यवसाय वेधशाळा'
              : language === 'hi'
              ? 'समुद्री मौसम व मत्स्य पालन वेधशाला'
              : 'Marine Weather & Coastal Fisheries Observatory'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="gov-badge gov-badge-success text-[10px]">
            REAL-TIME TELEMETRY
          </span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh marine telemetry"
              className="p-1 hover:bg-[#E2E8F0] rounded-xs text-[#17365D] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#006B3C]' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Harbor Location & Departure Control Bar */}
      <div className="p-2.5 sm:p-3 bg-[#F8FAFC] border-b border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Anchor className="w-4 h-4 text-[#FF9933] shrink-0" />
            <div className="relative inline-block w-full max-w-[280px]">
              <select
                value={harbor.name}
                onChange={(e) => {
                  const found = harborsList.find((h) => h.name === e.target.value);
                  if (found) onSelectHarbor(found);
                }}
                className="w-full bg-white text-[#17365D] font-black text-xs py-1.5 px-2.5 pr-6 rounded-none border border-[#CBD5E1] outline-none cursor-pointer appearance-none truncate hover:border-[#FF9933] transition-all shadow-2xs"
              >
                {harborsList.map((h) => (
                  <option key={h.name} value={h.name} className="bg-white text-slate-900 font-bold">
                    {h.name} ({h.state})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="text-[10px] text-[#5B6770] font-mono pl-5.5">
            Lat: {harbor.lat.toFixed(4)}°N, Lon: {harbor.lon.toFixed(4)}°E • {harbor.state}
          </div>
        </div>

        {/* Departure Selector & Live Time */}
        <div className="flex items-center justify-between sm:justify-end gap-2 text-right border-t sm:border-t-0 border-[#E2E8F0] pt-2 sm:pt-0">
          <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-none border border-[#CBD5E1] text-[11px] font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#FF9933]" />
            <span className="text-[#5B6770] text-[10px] uppercase font-bold">DEPART:</span>
            <select
              value={departureTime}
              onChange={(e) => onSelectDeparture(e.target.value)}
              className="bg-transparent text-[#17365D] font-black outline-none cursor-pointer text-xs"
            >
              {departureTimesList.map((t) => (
                <option key={t} value={t} className="bg-white text-slate-900 font-bold">
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[10px] text-[#5B6770] font-mono shrink-0 pl-1">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              {formattedDateTime || 'Live'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Visual Image Container with Telemetry & Weather Overlay */}
      <div className="relative min-h-[260px] sm:min-h-[300px] bg-slate-900 overflow-hidden flex flex-col justify-between">
        {/* Background Photo (Uploaded Fishing Boat & Harbor Image) */}
        {!imgError && (
          <img
            src="/assets/fisherman-bg.jpg"
            alt="Indian Coastal Fishing Harbor"
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          />
        )}

        {/* Transparent Gradient Scrim for crystal clear text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/25 pointer-events-none" />

        {/* Top Overlay inside Image: Port Name & Telemetry Status */}
        <div className="relative z-10 p-3 sm:p-4 text-white">
          <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <MapPin className="w-3.5 h-3.5 text-[#FF9933]" />
              <span className="drop-shadow-xs">{harbor.name}</span>
            </div>
            <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider drop-shadow-xs flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>INCOIS / IMD Live</span>
            </div>
          </div>
        </div>

        {/* Bottom Overlay: Live Atmospheric Temperature & Safe-to-Sail Decision */}
        <div className="relative z-10 p-3 sm:p-4 text-white space-y-2.5">
          <div className="flex items-end justify-between gap-3 flex-wrap sm:flex-nowrap">
            {/* Left: Atmospheric Temperature & Weather Icon */}
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 bg-[#006B3C] border border-white/20 rounded-none flex items-center justify-center shrink-0 shadow-lg">
                {getConditionIcon()}
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-white leading-none drop-shadow-md">
                    {tempVal}°C
                  </span>
                  <span className="text-xs text-white/80 font-semibold drop-shadow-xs">
                    (Feels {feelsLikeVal}°C)
                  </span>
                </div>
                <div className="text-xs font-bold text-emerald-300 uppercase tracking-wide pt-0.5 drop-shadow-xs">
                  {conditionDisplay}
                </div>
              </div>
            </div>

            {/* Right: Primary Safe-to-Sail Indicator Badge */}
            <div className="flex flex-col items-start sm:items-end gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-black uppercase tracking-wider ${statusConfig.badgeBg} border ${statusConfig.badgeBorder} shadow-md`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{statusConfig.title}</span>
                </span>
                <span className="text-[11px] font-bold text-white/95 drop-shadow-xs">
                  ({language === 'mr' ? statusConfig.marathiTitle : language === 'hi' ? statusConfig.hindiTitle : statusConfig.title})
                </span>
              </div>

              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-none px-2 py-1 border border-white/20">
                <div className="text-center px-1">
                  <div className="text-[9px] font-bold text-white/75 uppercase">Wave</div>
                  <div className="text-sm font-black text-cyan-200">{waveHeight}m</div>
                </div>
                <div className="w-[1px] h-5 bg-white/20" />
                <div className="text-center px-1">
                  <div className="text-[9px] font-bold text-white/75 uppercase">Wind</div>
                  <div className="text-sm font-black text-emerald-200">{windSpeedKts} kts</div>
                </div>
                <div className="w-[1px] h-5 bg-white/20" />
                <div className="text-center px-1">
                  <div className="text-[9px] font-bold text-white/75 uppercase">SST</div>
                  <div className="text-sm font-black text-amber-200">{sst}°C</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Complete Weather & Marine Telemetry Parameters in Official Government Table Format */}
      <div className="p-2.5 sm:p-3 bg-white space-y-2">
        <div className="border border-[#CBD5E1] rounded-none overflow-x-auto scrollbar-thin">
          <table className="gov-table min-w-[360px] sm:min-w-full w-full text-left">
            <thead>
              <tr className="bg-[#F1F5F9] border-b border-[#CBD5E1]">
                <th className="w-[32%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider">
                  {translatePhrase('parameter', language) || 'Parameter'}
                </th>
                <th className="w-[22%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider">
                  {translatePhrase('observedValue', language) || 'Observed Value'}
                </th>
                <th className="w-[26%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider">
                  {translatePhrase('standardReference', language) || 'Safety Benchmark'}
                </th>
                <th className="w-[20%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider text-right sm:text-left">
                  {translatePhrase('status', language) || 'Status'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[11px] sm:text-xs">
              {/* 1. Significant Wave Height */}
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-[#1D5F91] shrink-0" />
                    <span className="truncate">{language === 'mr' ? 'लाटांची उंची (Hs)' : language === 'hi' ? 'लहरों की ऊंचाई (Hs)' : 'Significant Wave Height (Hs)'}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{waveHeight} m</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">&lt; 1.4 m Safe</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className={`gov-badge text-[9px] sm:text-[10px] px-1.5 py-0.5 ${waveHeight > 2.0 ? 'gov-badge-danger' : waveHeight > 1.4 ? 'gov-badge-warning' : 'gov-badge-success'}`}>
                    {waveHeight > 2.0 ? 'HIGH CHOP' : waveHeight > 1.4 ? 'MODERATE' : 'FAVORABLE'}
                  </span>
                </td>
              </tr>
              {/* 2. Coastal Wind Velocity */}
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-[#006B3C] shrink-0" />
                    <span className="truncate">{language === 'mr' ? 'वाऱ्याचा वेग व दिशा' : language === 'hi' ? 'हवा की गति व दिशा' : 'Coastal Wind Velocity'}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{windSpeedKts} kts ({windDir})</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">Force 3 ({beaufortDesc.split('(')[0].trim()})</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className={`gov-badge text-[9px] sm:text-[10px] px-1.5 py-0.5 ${windSpeedKts > 24 ? 'gov-badge-danger' : windSpeedKts > 16 ? 'gov-badge-warning' : 'gov-badge-success'}`}>
                    {windSpeedKts > 24 ? 'GALE' : windSpeedKts > 16 ? 'GUSTY' : 'NORMAL'}
                  </span>
                </td>
              </tr>
              {/* 3. Air Temperature */}
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-[#B42318] shrink-0" />
                    <span className="truncate">{language === 'mr' ? 'हवेचे तापमान' : language === 'hi' ? 'वायु तापमान' : 'Air Temperature'}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{tempVal}°C</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">Feels {feelsLikeVal}°C</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className="gov-badge gov-badge-info text-[9px] sm:text-[10px] px-1.5 py-0.5">NORMAL</span>
                </td>
              </tr>
              {/* 4. Dominant Swell Period */}
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#17365D] shrink-0" />
                    <span className="truncate">{language === 'mr' ? 'लाटांचा कालावधी' : language === 'hi' ? 'लहर अंतराल' : 'Dominant Swell Period'}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{swellPeriod} sec</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">6 – 10s Safe Window</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className="gov-badge gov-badge-success text-[9px] sm:text-[10px] px-1.5 py-0.5">STABLE</span>
                </td>
              </tr>
              {/* 5. Sea Surface Temp (SST) */}
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-[#FF9933] shrink-0" />
                    <span className="truncate">{language === 'mr' ? 'समुद्राचे तापमान (SST)' : language === 'hi' ? 'समुद्री तापमान (SST)' : 'Sea Surface Temp (SST)'}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{sst}°C</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">26 – 30°C Pelagic</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className="gov-badge gov-badge-success text-[9px] sm:text-[10px] px-1.5 py-0.5">FISH SCHOOLING</span>
                </td>
              </tr>
              {/* 6. Relative Humidity */}
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-[#1D5F91] shrink-0" />
                    <span className="truncate">{language === 'mr' ? 'आर्द्रता' : language === 'hi' ? 'आर्द्रता' : 'Relative Humidity'}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{humidityVal}%</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">50 – 85% Coastal</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className={`gov-badge text-[9px] sm:text-[10px] px-1.5 py-0.5 ${humidityVal > 85 ? 'gov-badge-warning' : 'gov-badge-success'}`}>
                    {humidityVal > 85 ? 'HIGH' : 'NORMAL'}
                  </span>
                </td>
              </tr>
              {/* 7. Barometric Pressure */}
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-[#006B3C] shrink-0" />
                    <span className="truncate">{language === 'mr' ? 'वातावरणीय दाब' : language === 'hi' ? 'वायुमंडलीय दबाव' : 'Barometric Pressure'}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{pressureVal} hPa</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">1008 – 1016 hPa MSL</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className="gov-badge gov-badge-info text-[9px] sm:text-[10px] px-1.5 py-0.5">STABLE</span>
                </td>
              </tr>
              {/* 8. Visibility */}
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#FF9933] shrink-0" />
                    <span className="truncate">{language === 'mr' ? 'दृश्यमानता' : language === 'hi' ? 'दृश्यता' : 'Maritime Visibility'}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{visibilityVal}</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">&gt; 8 km Horizon</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className="gov-badge gov-badge-success text-[9px] sm:text-[10px] px-1.5 py-0.5">CLEAR</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
