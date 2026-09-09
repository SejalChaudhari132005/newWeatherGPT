import React from 'react';
import { Compass, Wind, ArrowUp, AlertTriangle, CheckCircle2, ShieldAlert, ArrowDown } from 'lucide-react';
import { RunwayWindComponent } from '../../../types/aviationIntelligence';

interface RunwayCrosswindDialProps {
  activeRunway: RunwayWindComponent;
  alternateRunways?: RunwayWindComponent[];
  onSelectRunway?: (runwayId: string) => void;
}

export const RunwayCrosswindDial: React.FC<RunwayCrosswindDialProps> = ({
  activeRunway,
  alternateRunways = [],
  onSelectRunway,
}) => {
  const {
    runway_id,
    runway_heading_deg,
    wind_speed_kts,
    wind_direction_deg,
    wind_gusts_kts,
    headwind_kts,
    crosswind_kts,
    crosswind_direction,
    is_crosswind_exceeded,
    operational_status,
    max_demonstrated_crosswind_kts,
  } = activeRunway;

  const isCaution = operational_status === 'caution';
  const isExceeded = operational_status === 'exceeded' || is_crosswind_exceeded;

  const statusConfig = {
    normal: {
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      badge: 'bg-emerald-600 text-white',
      label: 'NORMAL (Within Limits)',
      icon: CheckCircle2,
    },
    caution: {
      color: 'text-amber-800 bg-amber-50 border-amber-200',
      badge: 'bg-amber-600 text-white',
      label: 'CAUTION (>15 kts Crosswind)',
      icon: AlertTriangle,
    },
    exceeded: {
      color: 'text-rose-800 bg-rose-50 border-rose-200',
      badge: 'bg-rose-600 text-white',
      label: 'EXCEEDED (>25 kts Operational Limit)',
      icon: ShieldAlert,
    },
  }[operational_status] || {
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-600 text-white',
    label: 'NORMAL',
    icon: CheckCircle2,
  };

  const StatusIcon = statusConfig.icon;

  // Visual Compass Calculations:
  // We align the runway vertically in the diagram: Rotate the dial so Runway Heading points North (Up).
  // Relative wind angle = (wind_direction_deg - runway_heading_deg)
  const relativeWindAngle = (wind_direction_deg - runway_heading_deg) % 360;

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
              Wind Vector Resolver
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${statusConfig.badge}`}>
              {statusConfig.label}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
            Active Runway {runway_id} ({runway_heading_deg}°) Vectors
          </h3>
        </div>

        <div className="text-left sm:text-right text-[11px] text-slate-500 font-medium">
          Crosswind Limit:{' '}
          <span className="font-black text-slate-800">{max_demonstrated_crosswind_kts} kts</span>
        </div>
      </div>

      {/* Main Grid: Visual Dial + Metric Cards */}
      <div className="space-y-4">
        {/* Visual Dial (SVG/CSS Visualization) */}
        <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden shadow-inner">
          {/* Compass Rose Ring */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            {/* Outer Circular Scale */}
            <div className="absolute inset-0 rounded-full border-2 border-slate-800 border-dashed animate-spin-slow opacity-60" />
            <div className="absolute inset-2 rounded-full border border-slate-800/80" />

            {/* Compass Cardinal Points */}
            <span className="absolute top-1 text-[9px] font-black font-mono text-slate-400">N (000°)</span>
            <span className="absolute bottom-1 text-[9px] font-black font-mono text-slate-400">S (180°)</span>
            <span className="absolute left-2 text-[9px] font-black font-mono text-slate-400">W (270°)</span>
            <span className="absolute right-2 text-[9px] font-black font-mono text-slate-400">E (090°)</span>

            {/* Runway Centerline Graphic */}
            <div
              className="absolute w-5 sm:w-6 h-36 sm:h-44 bg-slate-800/90 rounded-md border border-slate-600 flex flex-col items-center justify-between py-1.5 shadow-2xl transition-transform duration-700"
              style={{ transform: `rotate(${runway_heading_deg}deg)` }}
            >
              {/* Top threshold (Landing Heading) */}
              <span className="text-[8px] sm:text-[9px] font-mono font-black text-amber-400 tracking-tighter">
                {runway_id}
              </span>

              {/* Dashed Centerline */}
              <div className="w-0.5 h-20 border-l border-dashed border-white/60" />

              {/* Bottom threshold */}
              <span className="text-[8px] font-mono font-bold text-slate-400">THR</span>
            </div>

            {/* Wind Direction Arrow Vector */}
            <div
              className="absolute w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-700"
              style={{ transform: `rotate(${wind_direction_deg}deg)` }}
            >
              <div className="relative h-full flex flex-col items-center justify-start pt-1.5">
                <div className="flex flex-col items-center">
                  <div className="px-1.5 py-0.5 rounded-md bg-cyan-500 text-slate-950 font-mono font-black text-[8px] sm:text-[9px] shadow-lg animate-pulse whitespace-nowrap">
                    WIND {wind_direction_deg}° @ {wind_speed_kts}kt
                  </div>
                  <ArrowDown className="w-5 h-5 text-cyan-400 mt-0.5 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                </div>
              </div>
            </div>

            {/* Center Aircraft Symbol */}
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg z-20 transition-transform duration-700"
              style={{ transform: `rotate(${runway_heading_deg}deg)` }}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          <div className="mt-2 text-center">
            <div className="text-[11px] font-mono font-black text-slate-300">
              Surface Wind: <span className="text-cyan-400">{wind_direction_deg}° at {wind_speed_kts} kts</span>
              {wind_gusts_kts && <span className="text-amber-400"> (Gusts: {wind_gusts_kts} kt)</span>}
            </div>
            <div className="text-[9px] text-slate-500 font-medium">
              Runway Azimuth: {runway_heading_deg}° Magnetic
            </div>
          </div>
        </div>

        {/* Resolved Wind Components */}
        <div className="space-y-3">
          {/* Crosswind Metric */}
          <div className={`p-3.5 rounded-2xl border transition-all ${statusConfig.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Crosswind Component</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white/90 border border-current">
                From {crosswind_direction.toUpperCase()}
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black whitespace-nowrap">{crosswind_kts}</span>
              <span className="text-xs font-bold">knots</span>
              <span className="text-[11px] font-semibold opacity-85 ml-auto truncate">
                {isExceeded
                  ? 'Exceeds limitation (>25 kts)'
                  : isCaution
                  ? 'Caution threshold (>15 kts)'
                  : 'Within operating limits (≤15 kts)'}
              </span>
            </div>

            {/* Crosswind Meter Bar */}
            <div className="w-full bg-slate-200/70 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isExceeded ? 'bg-rose-600' : isCaution ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (crosswind_kts / 30) * 100)}%` }}
              />
            </div>
          </div>

          {/* Headwind / Tailwind Metric */}
          <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">
                {headwind_kts >= 0 ? 'Headwind Component' : 'Tailwind Component'}
              </span>
              <span className="text-[10px] font-bold text-slate-600">
                {headwind_kts >= 0 ? 'Optimal for Landing' : 'Tailwind Penalty'}
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-black whitespace-nowrap ${headwind_kts >= 0 ? 'text-slate-900' : 'text-amber-700'}`}>
                {Math.abs(headwind_kts)}
              </span>
              <span className="text-xs font-bold text-slate-500">knots</span>
              <span className="text-[11px] font-semibold text-slate-500 ml-auto truncate">
                {headwind_kts >= 0 ? '🟢 Favorable headwind' : '⚠️ Tailwind landing penalty'}
              </span>
            </div>
          </div>

          {/* Alternate Runways Quick Comparison */}
          {alternateRunways.length > 0 && (
            <div className="pt-1">
              <div className="text-[11px] font-extrabold text-slate-500 mb-1.5">Alternate Runways Vector Comparison:</div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x pb-1">
                {alternateRunways.map((alt) => (
                  <button
                    key={alt.runway_id}
                    onClick={() => onSelectRunway && onSelectRunway(alt.runway_id)}
                    className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-left transition-all cursor-pointer flex items-center justify-between gap-3 min-w-[200px] shrink-0 snap-center shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-black text-slate-800">RWY {alt.runway_id} ({alt.runway_heading_deg}°)</div>
                      <div className="text-[10px] text-slate-500 whitespace-nowrap">
                        HW: {alt.headwind_kts} kt | XW: {alt.crosswind_kts} kt
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${
                        alt.operational_status === 'exceeded'
                          ? 'bg-rose-100 text-rose-700'
                          : alt.operational_status === 'caution'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {alt.operational_status.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
