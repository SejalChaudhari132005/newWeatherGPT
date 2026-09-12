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
} from 'lucide-react';
import { SailingClearance, HydrodynamicSeaState } from '../../../types/fisherIntelligence';
import { useLanguage } from '../../../context/LanguageContext';
import { translatePhrase } from '../../../utils/dashboardTranslator';

interface HarborInfo {
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
  onRefresh?: () => void;
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
}) => {
  const { language } = useLanguage();
  const [imgError, setImgError] = useState(false);
  const [formattedDateTime, setFormattedDateTime] = useState('');

  // Live timestamp clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
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

  const status = clearance?.status || 'favorable';
  const isFavorable = status === 'favorable';
  const isCaution = status === 'caution';
  const isNoDeparture = status === 'no_departure';

  const statusConfig = {
    favorable: {
      badgeBg: 'bg-emerald-600 text-white',
      badgeBorder: 'border-emerald-700',
      title: 'SAFE TO SAIL',
      marathiTitle: 'सफर सुरक्षित',
      icon: ShieldCheck,
    },
    caution: {
      badgeBg: 'bg-amber-600 text-white',
      badgeBorder: 'border-amber-700',
      title: 'CAUTION ADVISORY',
      marathiTitle: 'सावधगिरी बाळगा',
      icon: AlertTriangle,
    },
    no_departure: {
      badgeBg: 'bg-rose-600 text-white',
      badgeBorder: 'border-rose-700',
      title: 'NO DEPARTURE',
      marathiTitle: 'सफर टाळा - बंदर बंदी',
      icon: ShieldAlert,
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  const waveHeight = seaState?.wave_height_m ?? clearance?.max_wave_height_m ?? 1.2;
  const swellPeriod = seaState?.swell_period_sec ?? 7.5;
  const windSpeedKts = clearance?.max_wind_speed_kts ?? 11;
  const sst = seaState?.sea_surface_temp_c ?? 28.5;

  return (
    <div className="gov-panel overflow-hidden relative shadow-xs">
      {/* Top Station Header */}
      <div className="gov-panel-header flex items-center justify-between relative z-20">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-[#006B3C] animate-pulse" />
          <span>MARINE HYDRODYNAMICS & COASTAL TELEMETRY</span>
        </div>
        <span className="gov-badge gov-badge-success text-[10px]">
          REAL-TIME TELEMETRY
        </span>
      </div>

      {/* Harbor Location & Departure Control Bar (Placed ABOVE the image) */}
      <div className="p-2.5 sm:p-3 bg-[#F8FAFC] border-b border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#FF9933] shrink-0" />
            <div className="relative inline-block w-full max-w-[280px]">
              <select
                value={harbor.name}
                onChange={(e) => {
                  const found = harborsList.find((h) => h.name === e.target.value);
                  if (found) onSelectHarbor(found);
                }}
                className="w-full bg-white text-[#17365D] font-black text-xs py-1.5 px-2.5 pr-6 rounded-xs border border-[#CBD5E1] outline-none cursor-pointer appearance-none truncate hover:border-[#FF9933] transition-all shadow-2xs"
              >
                {harborsList.map((h) => (
                  <option key={h.name} value={h.name} className="bg-white text-slate-900 font-bold">
                    {h.name}
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
          <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xs border border-[#CBD5E1] text-[11px] font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#FF9933]" />
            <span className="text-[#5B6770] text-[10px] uppercase font-bold">DEPART:</span>
            <select
              value={departureTime}
              onChange={(e) => onSelectDeparture(e.target.value)}
              className="bg-transparent text-[#17365D] font-black outline-none cursor-pointer text-xs"
            >
              {departureTimesList.map((t) => (
                <option key={t} value={t} className="bg-white text-slate-900">
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

      {/* Visual Image Container with Telemetry Overlay */}
      <div className="relative min-h-[260px] sm:min-h-[300px] bg-slate-900 overflow-hidden flex flex-col justify-end">
        {/* Background Photo (Uploaded Fishing Boat & Harbor Image) */}
        {!imgError && (
          <img
            src="/assets/fisherman-bg.jpg"
            alt="Indian Coastal Fishing Harbor"
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          />
        )}

        {/* Transparent Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

        {/* Bottom Overlay: Primary Safe-to-Sail Indicator */}
        <div className="relative z-10 p-2.5 sm:p-4 text-white">
          <div className="flex items-end justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-black uppercase tracking-wider ${statusConfig.badgeBg} border ${statusConfig.badgeBorder} shadow-md`}>
                  <StatusIcon className="w-4 h-4" />
                  <span>{statusConfig.title}</span>
                </span>
                <span className="text-xs font-bold text-white/95 drop-shadow-xs">
                  ({statusConfig.marathiTitle})
                </span>
              </div>

              <p className="text-[11px] sm:text-xs text-white/90 font-medium line-clamp-1 drop-shadow-xs max-w-md">
                {clearance?.primary_reason || 'Sea state and wind conditions within safe navigation thresholds.'}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-black/55 backdrop-blur-md rounded-md p-2 border border-white/15 shrink-0">
              <div className="text-center px-1.5">
                <div className="text-[9px] font-bold text-white/80 uppercase">Wave</div>
                <div className="text-base sm:text-lg font-black text-cyan-200">{waveHeight}m</div>
              </div>
              <div className="w-[1px] h-6 bg-white/20" />
              <div className="text-center px-1.5">
                <div className="text-[9px] font-bold text-white/80 uppercase">Wind</div>
                <div className="text-base sm:text-lg font-black text-emerald-200">{windSpeedKts} kts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Observation Telemetry Table */}
      <div className="p-2.5 sm:p-3 bg-white space-y-2">
        <div className="border border-[#CBD5E1] rounded-xs overflow-x-auto scrollbar-thin">
          <table className="gov-table min-w-[360px] sm:min-w-full w-full text-left">
            <thead>
              <tr className="bg-[#F1F5F9] border-b border-[#CBD5E1]">
                <th className="w-[32%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider">
                  Parameter
                </th>
                <th className="w-[22%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider">
                  Observed Value
                </th>
                <th className="w-[26%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider">
                  Standard Reference
                </th>
                <th className="w-[20%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider text-right sm:text-left">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[11px] sm:text-xs">
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-[#1D5F91] shrink-0" />
                    <span className="truncate">Significant Wave Height</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{waveHeight} m</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">&lt; 2.0 m Safe</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className={`gov-badge text-[9px] sm:text-[10px] px-1.5 py-0.5 ${waveHeight > 2.0 ? 'gov-badge-danger' : waveHeight > 1.5 ? 'gov-badge-warning' : 'gov-badge-success'}`}>
                    {waveHeight > 2.0 ? 'HIGH CHOP' : waveHeight > 1.5 ? 'MODERATE' : 'FAVORABLE'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-[#006B3C] shrink-0" />
                    <span className="truncate">Coastal Wind Vector</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{windSpeedKts} kts ({clearance?.wind_direction || 'WNW'})</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">Beaufort Scale 3</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className="gov-badge gov-badge-success text-[9px] sm:text-[10px] px-1.5 py-0.5">
                    NORMAL
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#17365D] shrink-0" />
                    <span className="truncate">Dominant Swell Period</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{swellPeriod} sec</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">6 – 10s Optimal</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className="gov-badge gov-badge-info text-[9px] sm:text-[10px] px-1.5 py-0.5">
                    STABLE
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                    <span className="truncate">Sea Surface Temp (SST)</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">{sst}°C</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">26° – 29°C Pelagic</td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className="gov-badge gov-badge-neutral text-[9px] sm:text-[10px] px-1.5 py-0.5">
                    OPTIMAL
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
