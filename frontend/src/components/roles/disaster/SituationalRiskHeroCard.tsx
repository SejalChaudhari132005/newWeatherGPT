import React from 'react';
import { ShieldAlert, AlertTriangle, CloudRain, Waves, Wind, Zap, MapPin, Clock, Radio, RefreshCw } from 'lucide-react';
import { SituationalRiskData } from '../../../types/disasterIntelligence';

interface SituationalRiskHeroCardProps {
  data: SituationalRiskData;
  loading?: boolean;
  onRefresh?: () => void;
  onOpenChatWithPrompt?: (prompt: string) => void;
}

export const SituationalRiskHeroCard: React.FC<SituationalRiskHeroCardProps> = ({
  data,
  loading = false,
  onRefresh,
  onOpenChatWithPrompt,
}) => {
  const isCritical = data.risk_level === 'CRITICAL';
  const isHigh = data.risk_level === 'HIGH';
  const isModerate = data.risk_level === 'MODERATE';

  // Badge colors matching gov design system
  const getRiskBadgeStyles = () => {
    if (isCritical) return 'bg-[#B42318] text-white border-[#912018]';
    if (isHigh) return 'bg-[#DC2626] text-white border-[#B91C1C]';
    if (isModerate) return 'bg-[#D97706] text-white border-[#B45309]';
    return 'bg-[#006B3C] text-white border-[#005530]';
  };

  const getRiskBannerBackground = () => {
    if (isCritical || isHigh) return 'bg-[#FEF2F2] border-[#FCA5A5] text-[#7F1D1D]';
    if (isModerate) return 'bg-[#FFFBEB] border-[#FDE68A] text-[#78350F]';
    return 'bg-[#F0FDF4] border-[#BBF7D0] text-[#14532D]';
  };

  const getFloodRiskText = () => {
    if (data.flood_risk_level === 'CRITICAL' || data.flood_risk_level === 'SEVERE') {
      return 'text-[#B42318] font-black';
    }
    if (data.flood_risk_level === 'HIGH') return 'text-[#DC2626] font-black';
    if (data.flood_risk_level === 'MODERATE') return 'text-[#D97706] font-bold';
    return 'text-[#006B3C] font-bold';
  };

  return (
    <div className="gov-panel bg-white border border-[#D6DCE1] rounded-xs shadow-xs text-[#1F2933] overflow-hidden font-sans">
      {/* Panel Top Header Bar */}
      <div className="gov-panel-header flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#F8FAFC] border-b border-[#D6DCE1]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-xs bg-[#B42318] shrink-0" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#17365D] whitespace-nowrap">
            🚨 Situational Intelligence
          </h2>
          <span className="text-[9px] font-bold bg-[#17365D] text-white px-1.5 py-0.5 rounded-xs shrink-0">
            DISASTER MANAGER
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-white border border-[#D6DCE1] text-[10px] text-[#5B6770]">
            <Radio className="w-2.5 h-2.5 text-[#006B3C] animate-pulse" />
            <span>Updated: {data.updated_at.includes('IST') || data.updated_at.includes('ago') ? data.updated_at : `${data.updated_at} IST`}</span>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-1 rounded-xs bg-white hover:bg-[#F1F5F9] border border-[#D6DCE1] text-[#17365D] transition-colors cursor-pointer"
              title="Refresh Live Telemetry"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-3 space-y-3">
        {/* Regional Risk Assessment Headline Banner */}
        <div className={`p-3 rounded-xs border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${getRiskBannerBackground()}`}>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#B42318]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Regional Risk Assessment</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-[#1F2933] mt-0.5 leading-snug break-words">
              {data.risk_headline}
            </h3>
            <div className="flex items-start gap-1.5 text-[11px] text-[#5B6770] mt-1 break-words">
              <MapPin className="w-3.5 h-3.5 text-[#17365D] shrink-0 mt-0.5" />
              <span className="leading-snug">Affected Area: <strong className="text-[#1F2933] font-semibold">{data.affected_area_summary}</strong></span>
            </div>
          </div>

          <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-black/10">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#5B6770]">
              Risk Level
            </span>
            <span className={`px-2.5 py-0.5 rounded-xs border text-[11px] font-black uppercase tracking-wider shadow-2xs ${getRiskBadgeStyles()}`}>
              {data.risk_level}
            </span>
          </div>
        </div>

        {/* 4-Metric Clean Grid with proper spacing */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Metric 1: Rainfall Rate */}
          <div className="p-2 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5B6770]">
              <span className="text-[9px] font-bold uppercase tracking-wider">Rainfall Rate</span>
              <CloudRain className="w-3 h-3 text-[#17365D]" />
            </div>
            <div className="mt-1">
              <div className="text-sm sm:text-base font-black text-[#1F2933] leading-tight">
                {data.rainfall_intensity_mmh} <span className="text-[10px] font-normal text-[#5B6770]">mm/h</span>
              </div>
              <div className="text-[10px] text-[#5B6770] mt-0.5 truncate">
                24h: <span className="text-[#1F2933] font-bold">{data.rainfall_24h_mm} mm</span>
              </div>
            </div>
          </div>

          {/* Metric 2: Flood Risk */}
          <div className="p-2 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5B6770]">
              <span className="text-[9px] font-bold uppercase tracking-wider">Flood Risk</span>
              <Waves className="w-3 h-3 text-[#D97706]" />
            </div>
            <div className="mt-1">
              <div className={`text-sm sm:text-base uppercase leading-tight ${getFloodRiskText()}`}>
                {data.flood_risk_level}
              </div>
              <div className="text-[10px] text-[#5B6770] mt-0.5 truncate">
                Index: <span className="text-[#1F2933] font-bold">{data.flood_risk_score}/100</span>
              </div>
            </div>
          </div>

          {/* Metric 3: Wind & Gusts */}
          <div className="p-2 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5B6770]">
              <span className="text-[9px] font-bold uppercase tracking-wider">Wind & Gusts</span>
              <Wind className="w-3 h-3 text-[#006B3C]" />
            </div>
            <div className="mt-1">
              <div className="text-sm sm:text-base font-black text-[#1F2933] leading-tight">
                {data.wind_speed_kmh} <span className="text-[10px] font-normal text-[#5B6770]">km/h</span>
              </div>
              <div className="text-[10px] text-[#5B6770] mt-0.5 truncate">
                Gusts: <span className="text-[#B42318] font-bold">{data.wind_gust_kmh} km/h</span>
              </div>
            </div>
          </div>

          {/* Metric 4: Lightning Strikes */}
          <div className="p-2 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5B6770]">
              <span className="text-[9px] font-bold uppercase tracking-wider">Lightning</span>
              <Zap className="w-3 h-3 text-[#D97706]" />
            </div>
            <div className="mt-1">
              <div className="text-sm sm:text-base font-black text-[#1F2933] leading-tight">
                {data.lightning_strike_density}{' '}
                <span className="text-[10px] font-normal text-[#5B6770]">/10km</span>
              </div>
              <div className="text-[10px] text-[#5B6770] mt-0.5 truncate">
                CAPE: <span className="text-[#1F2933] font-bold">{data.convective_cape_index} J/kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Action Directive Callout */}
        {data.is_emergency_active && (
          <div className="p-2.5 rounded-xs bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 text-[#B42318] shrink-0" />
              <span className="text-[11px] font-bold text-[#7F1D1D] leading-tight">
                Active Hazard Protocol: High runoff in river catchment. Evacuate low-lying riverbank settlements.
              </span>
            </div>
            {onOpenChatWithPrompt && (
              <button
                type="button"
                onClick={() =>
                  onOpenChatWithPrompt(
                    `What are the urgent disaster management SOPs and evacuation guidelines for ${data.location_name} under ${data.risk_headline}?`
                  )
                }
                className="px-2 py-1 text-[10px] font-extrabold text-white bg-[#B42318] hover:bg-[#912018] rounded-xs shrink-0 transition-colors shadow-2xs cursor-pointer"
              >
                Get SOPs
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
