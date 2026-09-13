import React from 'react';
import { Waves, Thermometer, Compass, Gauge, Activity } from 'lucide-react';
import { SeaStateSummary } from '../../../types/fisherIntelligence';

interface SeaStateCardProps {
  seaState: SeaStateSummary;
}

export const SeaStateCard: React.FC<SeaStateCardProps> = ({ seaState }) => {
  const waveH = Number((seaState.wave_height_m ?? 1.14).toFixed(2));
  const swellH = Number((seaState.swell_height_m ?? 0.85).toFixed(2));
  const swellP = Number((seaState.swell_period_sec ?? seaState.swell_period_s ?? 7.5).toFixed(1));
  const sst = Number((seaState.sea_surface_temp_c ?? 28.4).toFixed(1));
  const curr = Number((seaState.ocean_current_knots ?? 0.8).toFixed(1));
  const bScale = seaState.beaufort_scale ?? 3;
  const bDesc = seaState.beaufort_description ?? 'Gentle Breeze (Force 3)';

  return (
    <div className="gov-panel overflow-hidden font-sans">
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Waves className="w-3.5 h-3.5 text-[#1D5F91]" />
          <span>MARINE HYDRODYNAMICS & SEA STATE OUTLOOK</span>
        </div>
        <span className={`gov-badge text-[10px] ${waveH > 2.0 ? 'gov-badge-danger' : waveH > 1.4 ? 'gov-badge-warning' : 'gov-badge-success'}`}>
          {waveH > 2.0 ? 'DANGER ADVISORY' : waveH > 1.4 ? 'CAUTION ADVISORY' : 'FAVORABLE'}
        </span>
      </div>

      <div className="p-2.5 sm:p-3 bg-white space-y-2">
        <div className="border border-[#CBD5E1] rounded-none overflow-x-auto scrollbar-thin">
          <table className="gov-table min-w-[360px] sm:min-w-full w-full text-left">
            <thead>
              <tr className="bg-[#F1F5F9] border-b border-[#CBD5E1]">
                <th className="w-[32%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider">
                  Hydrodynamic Metric
                </th>
                <th className="w-[22%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider">
                  Observed Value
                </th>
                <th className="w-[26%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider">
                  Reference / Benchmark
                </th>
                <th className="w-[20%] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider text-right sm:text-left">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[11px] sm:text-xs">
              {/* 1. Wave Height */}
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-[#1D5F91] shrink-0" />
                    <span>Sig. Wave Height (Hs)</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">
                  {waveH} m
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">
                  T: {seaState.wave_period_s || 6.8}s | {seaState.wave_direction_deg || 265}°
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className={`gov-badge text-[9px] sm:text-[10px] px-1.5 py-0.5 ${waveH > 2.0 ? 'gov-badge-danger' : waveH > 1.4 ? 'gov-badge-warning' : 'gov-badge-success'}`}>
                    {waveH > 2.0 ? 'HIGH CHOP' : waveH > 1.4 ? 'MODERATE' : 'NORMAL'}
                  </span>
                </td>
              </tr>

              {/* 2. Swell Height & Period */}
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#006B3C] shrink-0" />
                    <span>Dominant Swell Height</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">
                  {swellH} m
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">
                  Period: {swellP} sec (6–10s Safe)
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className="gov-badge gov-badge-success text-[9px] sm:text-[10px] px-1.5 py-0.5">
                    STABLE
                  </span>
                </td>
              </tr>

              {/* 3. Beaufort Wind Force */}
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-[#FF9933] shrink-0" />
                    <span>Beaufort Wind Force</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">
                  Force {bScale}
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight truncate max-w-[140px]">
                  {bDesc}
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className={`gov-badge text-[9px] sm:text-[10px] px-1.5 py-0.5 ${bScale >= 6 ? 'gov-badge-danger' : bScale >= 4 ? 'gov-badge-warning' : 'gov-badge-success'}`}>
                    {bScale >= 6 ? 'GALE' : bScale >= 4 ? 'BREEZY' : 'FAVORABLE'}
                  </span>
                </td>
              </tr>

              {/* 4. Sea Surface Temperature */}
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                    <span>Sea Surface Temp (SST)</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">
                  {sst}°C
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">
                  26 – 30°C Pelagic Band
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className="gov-badge gov-badge-success text-[9px] sm:text-[10px] px-1.5 py-0.5">
                    FISH SCHOOLING
                  </span>
                </td>
              </tr>

              {/* 5. Ocean Current Drift */}
              <tr>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-semibold text-[#1F2933]">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#17365D] shrink-0" />
                    <span>Ocean Current Velocity</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-bold text-[#17365D] whitespace-nowrap">
                  {curr} kts
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[#5B6770] text-[10px] sm:text-xs leading-tight">
                  Nearshore Drift &lt; 1.5 kts
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right sm:text-left whitespace-nowrap">
                  <span className="gov-badge gov-badge-info text-[9px] sm:text-[10px] px-1.5 py-0.5">
                    MILD DRIFT
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
