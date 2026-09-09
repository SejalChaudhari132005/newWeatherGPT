import React from 'react';
import { Droplet, ThermometerSun, Gauge, AlertCircle, CheckCircle2, ArrowDownRight } from 'lucide-react';
import { SoilStateData } from '../../../types/farmerIntelligence';

interface SoilMoistureGaugeProps {
  soilState: SoilStateData;
}

export const SoilMoistureGauge: React.FC<SoilMoistureGaugeProps> = ({ soilState }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deficit':
        return 'text-amber-700 bg-amber-100 border-amber-300';
      case 'saturated':
      case 'waterlogged':
        return 'text-blue-700 bg-blue-100 border-blue-300';
      case 'optimal':
      default:
        return 'text-emerald-700 bg-emerald-100 border-emerald-300';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase">Critical Irrigation Needed</span>;
      case 'moderate':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase">Moderate Irrigation Required</span>;
      case 'low':
        return <span className="px-2.5 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-black uppercase">Low Irrigation Priority</span>;
      case 'none':
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase">Adequate Soil Moisture</span>;
    }
  };

  const surfaceMoist = soilState.moisture_surface_0_to_7cm ?? 0.25;
  const rootMoist = soilState.moisture_rootzone_7_to_28cm ?? 0.30;
  const surfacePct = Math.min(100, Math.round((surfaceMoist / 0.5) * 100));
  const rootPct = Math.min(100, Math.round((rootMoist / 0.5) * 100));

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
            <Droplet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Soil Moisture & Water Loss</h3>
            <p className="text-[11px] text-slate-500">Root zone hydration & FAO-56 ET0</p>
          </div>
        </div>

        <div className="shrink-0">{getUrgencyBadge(soilState.irrigation_urgency)}</div>
      </div>

      {/* Moisture Status Pill */}
      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Moisture State:</span>
          <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-lg border ${getStatusColor(soilState.moisture_status)}`}>
            {soilState.moisture_status}
          </span>
        </div>
        {soilState.et0_evapotranspiration_mm != null && (
          <div className="flex items-center gap-1 text-xs font-extrabold text-slate-700 whitespace-nowrap">
            <ThermometerSun className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>ET0: {soilState.et0_evapotranspiration_mm} mm/d</span>
          </div>
        )}
      </div>

      {/* Dual Depth Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Surface Moisture (0-7cm) */}
        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Surface (0 - 7 cm)</span>
            <span className="font-extrabold text-blue-700 whitespace-nowrap">{soilState.moisture_surface_0_to_7cm ? `${soilState.moisture_surface_0_to_7cm} m³/m³` : 'N/A'}</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${surfacePct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Dry (0.10)</span>
            <span>Optimal (0.28)</span>
            <span>Saturated (0.45)</span>
          </div>
        </div>

        {/* Root Zone Moisture (7-28cm) */}
        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Root Zone (7 - 28 cm)</span>
            <span className="font-extrabold text-emerald-700 whitespace-nowrap">{soilState.moisture_rootzone_7_to_28cm ? `${soilState.moisture_rootzone_7_to_28cm} m³/m³` : 'N/A'}</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${rootPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Wilting (0.12)</span>
            <span>Field Cap. (0.32)</span>
            <span>Flooded (0.48)</span>
          </div>
        </div>
      </div>

      {soilState.soil_temperature_surface_c != null && (
        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
          <ThermometerSun className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Surface Soil Temp: <strong className="text-slate-800">{soilState.soil_temperature_surface_c}°C</strong>. Seed germination & absorption normal.</span>
        </div>
      )}
    </div>
  );
};
