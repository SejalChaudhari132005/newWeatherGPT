import React from 'react';
import {
  X,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Thermometer,
  Waves,
  Wind,
  Compass,
  Radio,
  CheckCircle2,
  Navigation,
  Info,
} from 'lucide-react';
import { FishingZoneProperties } from '../../../../types/fishFinder';

interface Props {
  zone: FishingZoneProperties | null;
  onClose: () => void;
  onAskGpt?: (prompt: string) => void;
}

export const FishFinderZoneDetailPanel: React.FC<Props> = ({
  zone,
  onClose,
  onAskGpt,
}) => {
  if (!zone) return null;

  const getPotentialBadge = (potential: string, score: number) => {
    switch (potential) {
      case 'high':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] rounded-xs font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span>HIGH FISHING POTENTIAL ({score}/100)</span>
          </div>
        );
      case 'moderate':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] rounded-xs font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
            <span>MODERATE POTENTIAL ({score}/100)</span>
          </div>
        );
      case 'avoid':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] rounded-xs font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
            <span>LOW / AVOID ZONE ({score}/100)</span>
          </div>
        );
    }
  };

  const getSafetyBadge = (safetyCode: string) => {
    switch (safetyCode) {
      case 'favorable':
        return (
          <div className="flex items-center gap-1 text-[#065F46] font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span>Favorable (Safe to Sail)</span>
          </div>
        );
      case 'caution':
        return (
          <div className="flex items-center gap-1 text-[#92400E] font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            <span>Caution (Mechanized Craft Only)</span>
          </div>
        );
      case 'harbor_bound':
      default:
        return (
          <div className="flex items-center gap-1 text-[#991B1B] font-bold text-xs">
            <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
            <span>Harbor Bound (High Risk)</span>
          </div>
        );
    }
  };

  return (
    <div className="gov-panel bg-white border border-[#D6DCE1] shadow-md p-3.5 space-y-3 select-none">
      {/* 1. Header & Close Button */}
      <div className="flex items-start justify-between border-b border-[#D6DCE1] pb-2.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold bg-[#E2E8F0] text-[#17365D] px-1.5 py-0.5 rounded-xs uppercase">
              {zone.distance_km} km offshore ({zone.distance_nm} NM)
            </span>
            <span className="text-[10px] font-medium text-[#5B6770]">Depth: {zone.depth_range}</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#17365D] mt-1">{zone.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[#5B6770] hover:text-[#17365D] hover:bg-[#F1F5F9] rounded-xs transition-colors cursor-pointer"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Primary Status: Potential vs Safety Dual Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-[#F8FAFC] border border-[#E2E8F0]">
        <div>
          <div className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider mb-1">
            {zone.score_title}
          </div>
          {getPotentialBadge(zone.fishing_potential, zone.score)}
        </div>
        <div>
          <div className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider mb-1">
            Marine Safety Rating
          </div>
          <div className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded-xs">
            {getSafetyBadge(zone.marine_safety_code)}
          </div>
        </div>
      </div>

      {/* 3. Official Hydrodynamic & Oceanographic Telemetry Table */}
      <div className="border border-[#D6DCE1] overflow-hidden">
        <div className="bg-[#17365D] text-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
          <span>Oceanographic & Weather Telemetry</span>
          <span className="text-[9px] text-[#93C5FD] font-normal">Updated {zone.updated_at}</span>
        </div>
        <table className="w-full text-xs text-left">
          <tbody>
            <tr className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
              <td className="px-2.5 py-1.5 font-bold text-[#17365D] w-1/3 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Sea Surface Temp</span>
              </td>
              <td className="px-2.5 py-1.5 text-[#1F2933]">
                <span className="font-bold">{zone.sst_c}°C</span>
                <span className="text-[11px] text-[#5B6770] ml-2">({zone.factor_evaluations.sst || 'Favorable'})</span>
              </td>
            </tr>
            <tr className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
              <td className="px-2.5 py-1.5 font-bold text-[#17365D] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#059669]" />
                <span>Chlorophyll-a</span>
              </td>
              <td className="px-2.5 py-1.5 text-[#1F2933]">
                <span className="font-bold">{zone.chlorophyll_mg_m3} mg/m³</span>
                <span className="text-[11px] text-[#5B6770] ml-2">({zone.factor_evaluations.chlorophyll || 'Bloom active'})</span>
              </td>
            </tr>
            <tr className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
              <td className="px-2.5 py-1.5 font-bold text-[#17365D] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Ocean Current</span>
              </td>
              <td className="px-2.5 py-1.5 text-[#1F2933]">
                <span className="font-bold">{zone.current_knots} knots</span>
                <span className="text-[11px] text-[#5B6770] ml-2">{zone.current_direction}</span>
              </td>
            </tr>
            <tr className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
              <td className="px-2.5 py-1.5 font-bold text-[#17365D] flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Wind Speed</span>
              </td>
              <td className="px-2.5 py-1.5 text-[#1F2933]">
                <span className="font-bold">{zone.wind_kmh} km/h</span>
                <span className="text-[11px] text-[#5B6770] ml-2">({zone.wind_knots} kts • WSW)</span>
              </td>
            </tr>
            <tr className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
              <td className="px-2.5 py-1.5 font-bold text-[#17365D] flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-[#0891B2]" />
                <span>Significant Waves</span>
              </td>
              <td className="px-2.5 py-1.5 text-[#1F2933]">
                <span className="font-bold">{zone.wave_height_m} m</span>
                <span className="text-[11px] text-[#5B6770] ml-2">({zone.rain_level} rain)</span>
              </td>
            </tr>
            <tr className="hover:bg-[#F8FAFC]">
              <td className="px-2.5 py-1.5 font-bold text-[#17365D] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#006B3C]" />
                <span>INCOIS PFZ Line</span>
              </td>
              <td className="px-2.5 py-1.5 text-[#1F2933]">
                <span className="font-bold">{zone.pfz_status}</span>
                <span className="text-[10px] text-[#5B6770] block">Source: INCOIS Official Ocean Satellite Bulletin</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Target Pelagic Species */}
      <div className="p-2 bg-[#F1F5F9] border border-[#CBD5E1] text-xs">
        <div className="font-bold text-[#17365D] text-[11px] uppercase">Probable Target Species:</div>
        <div className="text-[#334155] font-medium mt-0.5">{zone.target_species}</div>
      </div>

      {/* 5. Provenance & AI Explanation CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
        <div className="text-[10px] text-[#5B6770] flex items-center gap-1">
          <Info className="w-3 h-3 text-[#17365D] shrink-0" />
          <span>{zone.source_provenance}</span>
        </div>

        {onAskGpt && (
          <button
            onClick={() =>
              onAskGpt(
                `Explain fishing suitability and safety advice for ${zone.name}. SST is ${zone.sst_c}°C, Chlorophyll is ${zone.chlorophyll_mg_m3} mg/m³, wave height is ${zone.wave_height_m}m, and wind is ${zone.wind_kmh} km/h.`
              )
            }
            className="w-full sm:w-auto px-3 py-1.5 bg-[#006B3C] hover:bg-[#00522E] text-white text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Consult WeatherGPT</span>
          </button>
        )}
      </div>
    </div>
  );
};
