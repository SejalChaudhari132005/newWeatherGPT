import React from 'react';
import { Sparkles, AlertTriangle, CloudLightning, Gauge, Thermometer, CloudRain, Clock, ShieldCheck, MessageSquare } from 'lucide-react';
import { AviationBriefingData, PeriodRequiringAttention } from '../../../types/aviationIntelligence';
import { MarkdownRenderer } from '../../common/MarkdownRenderer';

interface ConversationalBriefingCardProps {
  briefingData: AviationBriefingData;
  onAskChatWithPrompt?: (prompt: string) => void;
}

export const ConversationalBriefingCard: React.FC<ConversationalBriefingCardProps> = ({
  briefingData,
  onAskChatWithPrompt,
}) => {
  const {
    airport_name,
    icao,
    iata,
    conversational_briefing,
    period_requiring_attention,
    temperature_c,
    dew_point_c,
    surface_pressure_hpa,
    cloud_cover_pct,
    convective_risk,
    cape_j_kg,
    provenance,
  } = briefingData;

  const spread = Math.max(0, temperature_c - dew_point_c);

  const convectiveConfig = {
    none: { badge: 'bg-[#F0FDF4] text-[#006B3C] border-[#BBF7D0]', label: 'NONE (Stable)' },
    low: { badge: 'bg-[#F0FDF4] text-[#006B3C] border-[#BBF7D0]', label: 'LOW (Isolated)' },
    moderate: { badge: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]', label: 'MODERATE (CB Threat)' },
    high: { badge: 'bg-[#FEF2F2] text-[#B42318] border-[#FECACA]', label: 'HIGH (Severe)' },
  }[convective_risk] || { badge: 'bg-[#F0FDF4] text-[#006B3C] border-[#BBF7D0]', label: 'NONE' };

  return (
    <div className="gov-panel p-3.5 bg-white space-y-3 font-sans">
      {/* 1. Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#D6DCE1]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-none bg-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-[#17365D] uppercase tracking-wide truncate">
              3-Hour Executive Flight Briefing
            </h3>
            <p className="text-[10px] text-[#5B6770] truncate">
              Aerodrome & TAF Synthesis for {icao} ({iata || 'Hub'})
            </p>
          </div>
        </div>

        <span className="gov-badge gov-badge-info text-[9px] font-mono">
          Confidence {provenance.confidence_score}%
        </span>
      </div>

      {/* 2. Period Requiring Attention Banner */}
      {period_requiring_attention ? (
        <div
          className={`p-3 rounded-xs border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
            period_requiring_attention.severity === 'critical'
              ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#B42318]'
              : period_requiring_attention.severity === 'warning'
              ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]'
              : 'bg-[#F0F9FF] border-[#BAE6FD] text-[#0369A1]'
          }`}
        >
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wide">
                Attention: {period_requiring_attention.time_window}
              </span>
              <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-black uppercase bg-white/70 border border-current">
                {period_requiring_attention.hazard_type.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs font-medium leading-relaxed">
              {period_requiring_attention.operational_impact}
            </p>
            <p className="text-[11px] font-bold opacity-90">
              Action: {period_requiring_attention.suggested_action}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onAskChatWithPrompt &&
              onAskChatWithPrompt(
                `Tell me more about the operational hazard during ${period_requiring_attention.time_window} for ${icao} and recommend approach precautions.`
              )
            }
            className="px-3 py-1.5 rounded-xs bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer text-center flex items-center justify-center gap-1"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Copilot</span>
          </button>
        </div>
      ) : (
        <div className="p-2.5 rounded-xs bg-[#F0FDF4] border border-[#BBF7D0] text-[#006B3C] flex items-center gap-2 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-[#006B3C] shrink-0" />
          <span>No severe hazard windows detected for next 3h. Aerodrome profile remains stable.</span>
        </div>
      )}

      {/* 3. Atmospheric Telemetry Grid 4-Column */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Temp & Dewpoint Spread */}
        <div className="bg-[#F8FAFC] p-2.5 rounded-xs border border-[#D6DCE1] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5B6770]">
            <span className="text-[9px] font-bold uppercase tracking-wider">Temp / Dewpoint</span>
            <Thermometer className="w-3.5 h-3.5 text-[#B42318] shrink-0" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-bold text-[#1F2933] whitespace-nowrap">{Math.round(temperature_c)}°C</span>
            <span className="text-xs text-[#5B6770]">/ {Math.round(dew_point_c)}°C</span>
          </div>
          <div className="text-[9px] text-[#5B6770] font-mono mt-0.5">
            Spread: {spread.toFixed(1)}°C ({spread < 2.0 ? 'Fog Risk' : 'Clear'})
          </div>
        </div>

        {/* Altimeter QNH */}
        <div className="bg-[#F8FAFC] p-2.5 rounded-xs border border-[#D6DCE1] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5B6770]">
            <span className="text-[9px] font-bold uppercase tracking-wider">Altimeter QNH</span>
            <Gauge className="w-3.5 h-3.5 text-[#17365D] shrink-0" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-bold text-[#1F2933] font-mono whitespace-nowrap">{Math.round(surface_pressure_hpa)}</span>
            <span className="text-xs text-[#5B6770]">hPa</span>
          </div>
          <div className="text-[9px] text-[#5B6770] font-mono mt-0.5">
            {(surface_pressure_hpa * 0.02953).toFixed(2)} inHg
          </div>
        </div>

        {/* Convective CAPE Storm Threat */}
        <div className="bg-[#F8FAFC] p-2.5 rounded-xs border border-[#D6DCE1] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5B6770]">
            <span className="text-[9px] font-bold uppercase tracking-wider">Convective / CAPE</span>
            <CloudLightning className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-bold text-[#1F2933] font-mono whitespace-nowrap">{Math.round(cape_j_kg || 0)}</span>
            <span className="text-xs text-[#5B6770]">J/kg</span>
          </div>
          <div className="text-[9px] font-bold mt-0.5">
            <span className={`px-1 py-0.2 rounded-xs border ${convectiveConfig.badge}`}>
              {convectiveConfig.label}
            </span>
          </div>
        </div>

        {/* Cloud Cover */}
        <div className="bg-[#F8FAFC] p-2.5 rounded-xs border border-[#D6DCE1] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5B6770]">
            <span className="text-[9px] font-bold uppercase tracking-wider">Cloud Cover</span>
            <CloudRain className="w-3.5 h-3.5 text-[#1D5F91] shrink-0" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-bold text-[#1F2933] font-mono whitespace-nowrap">{cloud_cover_pct}%</span>
            <span className="text-xs text-[#5B6770]">Sky</span>
          </div>
          <div className="text-[9px] text-[#5B6770] mt-0.5">
            {cloud_cover_pct < 25 ? 'FEW Clouds' : cloud_cover_pct < 60 ? 'SCT Clouds' : 'BKN / OVC'}
          </div>
        </div>
      </div>

      {/* 4. Structured Natural Language Briefing Text */}
      <div className="p-3 bg-[#F8FAFC] rounded-xs border border-[#D6DCE1] text-xs text-[#1F2933] leading-relaxed">
        <MarkdownRenderer content={conversational_briefing} />
      </div>
    </div>
  );
};

export default ConversationalBriefingCard;
