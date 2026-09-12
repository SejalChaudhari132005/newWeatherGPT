import React from 'react';
import { Waves, Thermometer, Compass, Gauge, Activity } from 'lucide-react';
import { SeaStateSummary } from '../../../types/fisherIntelligence';

interface SeaStateCardProps {
  seaState: SeaStateSummary;
}

export const SeaStateCard: React.FC<SeaStateCardProps> = ({ seaState }) => {
  return (
    <div className="gov-panel">
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Waves className="w-3.5 h-3.5 text-[#1D5F91]" />
          <span>HYDRODYNAMIC SEA STATE & BEAUFORT METRICS</span>
        </div>
        <span className="gov-badge gov-badge-info text-[10px]">
          INCOIS LIVE SENSOR
        </span>
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        {/* Beaufort Scale Headline */}
        <div className="p-2.5 bg-[#F8FAFC] rounded-xs border border-[#CBD5E1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#1D5F91]" />
            <span className="text-xs font-bold text-[#17365D]">
              Beaufort Wind Force: <span className="font-black text-[#006B3C]">Force {seaState.beaufort_scale}</span>
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#5B6770]">
            {seaState.beaufort_description}
          </span>
        </div>

        {/* 2x2 Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Wave Height */}
          <div className="bg-[#F8FAFC] p-3 rounded-xs border border-[#CBD5E1] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5B6770] mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider">Sig. Wave (Hs)</span>
              <Waves className="w-3.5 h-3.5 text-[#1D5F91] shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-black text-[#17365D] whitespace-nowrap">
              {seaState.wave_height_m} <span className="text-xs font-bold text-[#5B6770]">m</span>
            </div>
            <div className="text-[10px] text-[#5B6770] font-mono mt-1 whitespace-nowrap">
              T: {seaState.wave_period_s}s | {seaState.wave_direction_deg}°
            </div>
          </div>

          {/* Swell Dynamics */}
          <div className="bg-[#F8FAFC] p-3 rounded-xs border border-[#CBD5E1] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5B6770] mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider">Swell Height</span>
              <Activity className="w-3.5 h-3.5 text-[#006B3C] shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-black text-[#17365D] whitespace-nowrap">
              {seaState.swell_height_m} <span className="text-xs font-bold text-[#5B6770]">m</span>
            </div>
            <div className="text-[10px] text-[#5B6770] font-mono mt-1 whitespace-nowrap">
              Period: {seaState.swell_period_s}s
            </div>
          </div>

          {/* Sea Surface Temp */}
          <div className="bg-[#F8FAFC] p-3 rounded-xs border border-[#CBD5E1] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5B6770] mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider">Sea Surface Temp</span>
              <Thermometer className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-black text-[#17365D] whitespace-nowrap">
              {seaState.sea_surface_temp_c ?? 28.5} <span className="text-xs font-bold text-[#5B6770]">°C</span>
            </div>
            <div className="text-[10px] text-[#5B6770] font-medium mt-1 whitespace-nowrap">
              Pelagic Zone
            </div>
          </div>

          {/* Ocean Current */}
          <div className="bg-[#F8FAFC] p-3 rounded-xs border border-[#CBD5E1] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5B6770] mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider">Ocean Drift</span>
              <Compass className="w-3.5 h-3.5 text-[#17365D] shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-black text-[#17365D] whitespace-nowrap">
              {seaState.ocean_current_knots ?? 0.8} <span className="text-xs font-bold text-[#5B6770]">kts</span>
            </div>
            <div className="text-[10px] text-[#5B6770] font-medium mt-1 whitespace-nowrap">
              Mild Velocity
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
