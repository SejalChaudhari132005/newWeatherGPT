import React from 'react';
import {
  Building2,
  CloudRain,
  Waves,
  Clock,
  Radio,
  RefreshCw,
  Flame,
  ShieldCheck,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import { UrbanWeatherIntelligenceData } from '../../../types/urbanIntelligence';

interface UrbanWeatherHeroCardProps {
  data: UrbanWeatherIntelligenceData;
  loading?: boolean;
  onRefresh?: () => void;
  onOpenChatWithPrompt?: (prompt: string) => void;
}

export const UrbanWeatherHeroCard: React.FC<UrbanWeatherHeroCardProps> = ({
  data,
  loading = false,
  onRefresh,
  onOpenChatWithPrompt,
}) => {
  const isHighRisk = data.urban_flood_risk === 'HIGH' || data.urban_flood_risk === 'CRITICAL';
  const isModerateRisk = data.urban_flood_risk === 'MODERATE';

  const getRiskBadgeStyles = () => {
    if (data.urban_flood_risk === 'CRITICAL') return 'bg-[#B42318] text-white border-[#912018]';
    if (data.urban_flood_risk === 'HIGH') return 'bg-[#DC2626] text-white border-[#B91C1C]';
    if (data.urban_flood_risk === 'MODERATE') return 'bg-[#D97706] text-white border-[#B45309]';
    return 'bg-[#006B3C] text-white border-[#005530]';
  };

  const getRiskBannerBackground = () => {
    if (isHighRisk) return 'bg-[#FEF2F2] border-[#FCA5A5] text-[#7F1D1D]';
    if (isModerateRisk) return 'bg-[#FFFBEB] border-[#FDE68A] text-[#78350F]';
    return 'bg-[#F0FDF4] border-[#BBF7D0] text-[#14532D]';
  };

  return (
    <div className="gov-panel bg-white border border-[#D6DCE1] rounded-xs shadow-xs text-[#1F2933] overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="gov-panel-header flex items-center justify-between gap-2 px-3 py-2 bg-[#F8FAFC] border-b border-[#D6DCE1]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-xs bg-[#006B3C] shrink-0" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#17365D] truncate">
            🌆 Urban Weather Intelligence
          </h2>
          <span className="text-[9px] font-bold bg-[#17365D] text-white px-1.5 py-0.5 rounded-xs shrink-0">
            URBAN PLANNER
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-white border border-[#D6DCE1] text-[10px] text-[#5B6770]">
            <Radio className="w-2.5 h-2.5 text-[#006B3C] animate-pulse" />
            <span>Updated: {data.updated_at}</span>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-1 rounded-xs bg-white hover:bg-[#F1F5F9] border border-[#D6DCE1] text-[#17365D] transition-colors cursor-pointer"
              title="Refresh Live Urban Telemetry"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-3 space-y-3">
        {/* Core Headline Banner */}
        <div className={`p-3 rounded-xs border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${getRiskBannerBackground()}`}>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#17365D]">
              <Building2 className="w-3.5 h-3.5 shrink-0 text-[#17365D]" />
              <span>Municipal Catchment Assessment</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-[#1F2933] mt-0.5 leading-snug">
              Urban Drainage & Heat Resilience Matrix
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-[#5B6770] mt-1 truncate">
              <MapPin className="w-3 h-3 text-[#17365D] shrink-0" />
              <span>Municipal Area: <strong className="text-[#1F2933] font-semibold">{data.location_name}</strong></span>
            </div>
          </div>

          <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-black/10">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#5B6770]">
              Urban Flood Risk
            </span>
            <span className={`px-2.5 py-0.5 rounded-xs border text-[11px] font-black uppercase tracking-wider shadow-2xs ${getRiskBadgeStyles()}`}>
              {data.urban_flood_risk}
            </span>
          </div>
        </div>

        {/* 4-Metric Grid adhering strictly to Hero Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1. Rainfall Forecast */}
          <div className="p-2.5 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5B6770]">
              <span className="text-[9px] font-bold uppercase tracking-wider">Rainfall</span>
              <CloudRain className="w-3 h-3 text-[#17365D]" />
            </div>
            <div className="mt-1">
              <div className="text-sm sm:text-base font-black text-[#1F2933] leading-tight">
                {data.rainfall_24h_mm} <span className="text-[10px] font-normal text-[#5B6770]">mm</span>
              </div>
              <div className="text-[10px] text-[#5B6770] mt-0.5 truncate">
                Rate: <span className="text-[#1F2933] font-bold">{data.peak_intensity_mmh} mm/h</span>
              </div>
            </div>
          </div>

          {/* 2. Peak Rainfall Window */}
          <div className="p-2.5 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5B6770]">
              <span className="text-[9px] font-bold uppercase tracking-wider">Peak Window</span>
              <Clock className="w-3 h-3 text-[#D97706]" />
            </div>
            <div className="mt-1">
              <div className="text-xs sm:text-sm font-black text-[#B42318] leading-tight truncate">
                {data.peak_rainfall_window}
              </div>
              <div className="text-[10px] text-[#5B6770] mt-0.5 truncate">
                Inundation Window
              </div>
            </div>
          </div>

          {/* 3. Critical Infrastructure at Risk */}
          <div className="p-2.5 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5B6770]">
              <span className="text-[9px] font-bold uppercase tracking-wider">Infra at Risk</span>
              <Building2 className="w-3 h-3 text-[#B42318]" />
            </div>
            <div className="mt-1">
              <div className="text-sm sm:text-base font-black text-[#B42318] leading-tight">
                {data.critical_infrastructure_risk_count} <span className="text-[10px] font-normal text-[#5B6770]">zones</span>
              </div>
              <div className="text-[10px] text-[#5B6770] mt-0.5 truncate">
                Metros & Underpasses
              </div>
            </div>
          </div>

          {/* 4. Urban Heat Island (UHI) Delta */}
          <div className="p-2.5 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5B6770]">
              <span className="text-[9px] font-bold uppercase tracking-wider">UHI Delta</span>
              <Flame className="w-3 h-3 text-[#D97706]" />
            </div>
            <div className="mt-1">
              <div className="text-sm sm:text-base font-black text-[#D97706] leading-tight">
                +{data.urban_heat_island_delta_c}°C
              </div>
              <div className="text-[10px] text-[#5B6770] mt-0.5 truncate">
                Surface: <span className="text-[#1F2933] font-bold">{data.surface_temperature_c}°C</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drainage Capacity Utilization Progress Bar */}
        <div className="p-2.5 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1F2933] flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-[#17365D]" />
              Stormwater Drainage Surcharge Load
            </span>
            <span className={`text-xs font-black ${data.drainage_capacity_utilization_pct > 75 ? 'text-[#B42318]' : 'text-[#17365D]'}`}>
              {data.drainage_capacity_utilization_pct}% Capacity
            </span>
          </div>
          <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                data.drainage_capacity_utilization_pct > 80
                  ? 'bg-[#B42318]'
                  : data.drainage_capacity_utilization_pct > 60
                  ? 'bg-[#D97706]'
                  : 'bg-[#006B3C]'
              }`}
              style={{ width: `${Math.min(100, data.drainage_capacity_utilization_pct)}%` }}
            />
          </div>
          <div className="flex justify-between text-[8.5px] text-[#5B6770]">
            <span>Rational Runoff C = {data.surface_runoff_coefficient}</span>
            <span>Ventilation: <strong className="text-[#1F2933]">{data.air_ventilation_index}</strong></span>
          </div>
        </div>

        {/* Civil Directive Action Callout */}
        <div className="p-2.5 rounded-xs bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#006B3C] shrink-0" />
            <span className="text-[11px] font-bold text-[#14532D] leading-tight">
              Municipal Engineering SOP: Clear culvert grates and stage auxiliary dewatering sumps prior to {data.peak_rainfall_window}.
            </span>
          </div>
          {onOpenChatWithPrompt && (
            <button
              type="button"
              onClick={() =>
                onOpenChatWithPrompt(
                  `What are the urban drainage and infrastructure resilience actions recommended for ${data.location_name} during the ${data.peak_rainfall_window} rainfall window?`
                )
              }
              className="px-2 py-1 text-[10px] font-extrabold text-white bg-[#006B3C] hover:bg-[#005530] rounded-xs shrink-0 transition-colors shadow-2xs cursor-pointer"
            >
              Get Directives
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
