import React from 'react';
import { Waves, Wind, Thermometer, Compass, Gauge, Activity } from 'lucide-react';
import { SeaStateSummary } from '../../../types/fisherIntelligence';

interface SeaStateCardProps {
  seaState: SeaStateSummary;
}

export const SeaStateCard: React.FC<SeaStateCardProps> = ({ seaState }) => {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 shrink-0">
            <Waves className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">Hydrodynamic Sea State</h3>
            <p className="text-[11px] text-slate-500 font-medium truncate">Wave height, swell & Beaufort scale</p>
          </div>
        </div>

        {/* Beaufort Badge */}
        <div className="px-2.5 py-1 rounded-xl bg-cyan-50 border border-cyan-200/80 text-cyan-900 text-[11px] font-extrabold flex items-center gap-1.5 shrink-0">
          <Gauge className="w-3.5 h-3.5 text-cyan-600" />
          <span>Force {seaState.beaufort_scale}</span>
        </div>
      </div>

      {/* Primary Metrics 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Wave Height */}
        <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Sig. Wave (Hs)</span>
            <Waves className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          </div>
          <div className="text-xl font-black text-slate-900 whitespace-nowrap">
            {seaState.wave_height_m} <span className="text-xs font-bold text-slate-500">m</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1 whitespace-nowrap">
            T: {seaState.wave_period_s}s | {seaState.wave_direction_deg}°
          </div>
        </div>

        {/* Swell Dynamics */}
        <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Swell Height</span>
            <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          </div>
          <div className="text-xl font-black text-slate-900 whitespace-nowrap">
            {seaState.swell_height_m} <span className="text-xs font-bold text-slate-500">m</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1 whitespace-nowrap">
            Period: {seaState.swell_period_s}s
          </div>
        </div>

        {/* Sea Surface Temp */}
        <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Sea Surface Temp</span>
            <Thermometer className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          </div>
          <div className="text-xl font-black text-slate-900 whitespace-nowrap">
            {seaState.sea_surface_temp_c ?? 28.5} <span className="text-xs font-bold text-slate-500">°C</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1 whitespace-nowrap">
            Pelagic Range
          </div>
        </div>

        {/* Ocean Current */}
        <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Ocean Drift</span>
            <Compass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          </div>
          <div className="text-xl font-black text-slate-900 whitespace-nowrap">
            {seaState.ocean_current_knots ?? 0.8} <span className="text-xs font-bold text-slate-500">kts</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1 whitespace-nowrap">
            Mild Velocity
          </div>
        </div>
      </div>

      {/* Description Strip */}
      <div className="p-2.5 bg-cyan-50/80 rounded-2xl border border-cyan-200/70 flex items-center justify-between text-xs text-cyan-950">
        <span className="font-semibold truncate">Sea State: <span className="font-black">{seaState.beaufort_description}</span></span>
        <span className="text-[10px] font-black uppercase text-cyan-700 shrink-0 ml-2">IMD Model</span>
      </div>
    </div>
  );
};
