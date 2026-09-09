import React from 'react';
import { Sparkles, AlertTriangle, CloudLightning, Gauge, Thermometer, CloudRain, Clock, ShieldCheck } from 'lucide-react';
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
    none: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'NONE (Stable)' },
    low: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'LOW (Isolated Cumulus)' },
    moderate: { badge: 'bg-amber-100 text-amber-800 border-amber-200', label: 'MODERATE (CB Threat)' },
    high: { badge: 'bg-rose-100 text-rose-800 border-rose-200', label: 'HIGH (Severe Thunderstorm)' },
  }[convective_risk];

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
              3-Hour Executive Briefing
            </h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              Aerodrome & TAF Synthesis
            </p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0 whitespace-nowrap">
          Confidence {provenance.confidence_score}%
        </span>
      </div>

      {/* Period Requiring Attention Banner */}
      {period_requiring_attention ? (
        <div
          className={`p-3.5 rounded-2xl border flex flex-col gap-2.5 ${
            period_requiring_attention.severity === 'critical'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : period_requiring_attention.severity === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1 rounded-lg bg-current/10">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider">
                Attention: {period_requiring_attention.time_window}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-current/15">
                {period_requiring_attention.hazard_type.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs font-medium leading-relaxed mt-1">
              {period_requiring_attention.operational_impact}
            </p>
            <p className="text-[11px] font-bold opacity-85 mt-0.5">
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
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-black shadow-2xs hover:bg-slate-50 transition-colors border border-current/20 shrink-0 cursor-pointer text-center"
          >
            Ask WeatherGPT
          </button>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>No severe hazard windows detected for next 3h. Profile remains stable.</span>
        </div>
      )}

      {/* Atmospheric Telemetry Grid 2x2 */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Temp & Dewpoint Spread */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Temp / Dewpoint</span>
            <Thermometer className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black text-slate-900 whitespace-nowrap">{Math.round(temperature_c)}°C</span>
            <span className="text-xs text-slate-400">/ {Math.round(dew_point_c)}°C</span>
          </div>
          <div className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
            Spread: {spread.toFixed(1)}°C ({spread < 2.0 ? 'Fog Risk' : 'Clear'})
          </div>
        </div>

        {/* Altimeter QNH */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Altimeter QNH</span>
            <Gauge className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black text-slate-900 whitespace-nowrap">{Math.round(surface_pressure_hpa)}</span>
            <span className="text-xs text-slate-400">hPa</span>
          </div>
          <div className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
            {(surface_pressure_hpa * 0.02953).toFixed(2)} inHg
          </div>
        </div>

        {/* Convective CAPE Storm Threat */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Convective / CAPE</span>
            <CloudLightning className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black text-slate-900 whitespace-nowrap">{Math.round(cape_j_kg || 0)}</span>
            <span className="text-xs text-slate-400">J/kg</span>
          </div>
          <div className="text-[9px] font-bold mt-0.5">
            <span className={`px-1.5 py-0.5 rounded border ${convectiveConfig.badge}`}>
              {convectiveConfig.label}
            </span>
          </div>
        </div>

        {/* Cloud Cover */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Cloud Cover</span>
            <CloudRain className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black text-slate-900 whitespace-nowrap">{cloud_cover_pct}%</span>
            <span className="text-xs text-slate-400">Sky</span>
          </div>
          <div className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
            {cloud_cover_pct < 25 ? 'FEW Clouds' : cloud_cover_pct < 60 ? 'SCT Clouds' : 'BKN / OVC'}
          </div>
        </div>
      </div>

      {/* Structured Natural Language Briefing Text with Markdown Rendering */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-800 leading-relaxed font-sans">
        <MarkdownRenderer content={conversational_briefing} />
      </div>
    </div>
  );
};
