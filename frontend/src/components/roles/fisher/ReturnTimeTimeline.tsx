import React from 'react';
import { Clock, AlertOctagon, Compass, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import { ReturnTimeAnalysis, TemporalMarineSlot } from '../../../types/fisherIntelligence';

interface ReturnTimeTimelineProps {
  returnIntel: ReturnTimeAnalysis;
  temporalCurve: TemporalMarineSlot[];
}

export const ReturnTimeTimeline: React.FC<ReturnTimeTimelineProps> = ({
  returnIntel,
  temporalCurve,
}) => {
  const isCritical = returnIntel.alert_level === 'critical';
  const isWarning = returnIntel.alert_level === 'warning';

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Return-Time Intelligence</h3>
              <p className="text-[11px] text-slate-500 font-medium">Safe harbor return deadline & deterioration curve</p>
            </div>
          </div>
        </div>

        {/* Hero Return Deadline Badge */}
        <div className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl border ${
          isCritical
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : isWarning
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div>
            <div className="text-[9px] font-extrabold uppercase tracking-wider opacity-75">Must Return By</div>
            <div className="text-base sm:text-lg font-black whitespace-nowrap">{returnIntel.recommended_return_time}</div>
          </div>
          <div className="text-right pl-3 border-l border-current/20">
            <div className="text-[9px] font-extrabold uppercase tracking-wider opacity-75">Safe Fishing Time</div>
            <div className="text-xs sm:text-sm font-black whitespace-nowrap">{returnIntel.safe_duration_hours} Hours</div>
          </div>
        </div>
      </div>

      {/* Rationale Banner */}
      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 flex items-start gap-2.5">
        <AlertOctagon className={`w-4 h-4 mt-0.5 shrink-0 ${isCritical ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-blue-500'}`} />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900">Deterioration Analysis: </span>
          {returnIntel.deterioration_reason}
        </div>
      </div>

      {/* Visual Progression Vector with Horizontal Scrolling */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Day Condition Evolution</span>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Swipe ➔</span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 snap-x -mx-1 px-1">
          {temporalCurve.map((slot) => {
            const isSlotFav = slot.status === 'favorable';
            const isSlotCaut = slot.status === 'caution';
            return (
              <div
                key={slot.time_slot}
                className={`min-w-[210px] w-[210px] flex-shrink-0 snap-start p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                  isSlotFav
                    ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                    : isSlotCaut
                    ? 'bg-amber-50/60 border-amber-200 text-slate-800'
                    : 'bg-rose-50/60 border-rose-200 text-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black tracking-tight text-slate-900">{slot.time_slot}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      isSlotFav
                        ? 'bg-emerald-600 text-white'
                        : isSlotCaut
                        ? 'bg-amber-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}>
                      {slot.status}
                    </span>
                  </div>

                  {/* Compact Metrics Strip */}
                  <div className="flex items-center justify-between gap-1 my-2 p-1.5 bg-white/80 rounded-xl border border-slate-200/70 text-xs font-bold">
                    <div className="text-center flex-1">
                      <span className="text-[8px] text-slate-400 block uppercase leading-none mb-0.5">Wave</span>
                      <span className="text-slate-900 whitespace-nowrap text-[11px] font-black">{slot.wave_height_m}m</span>
                    </div>
                    <div className="text-center flex-1 border-l border-slate-200 pl-1">
                      <span className="text-[8px] text-slate-400 block uppercase leading-none mb-0.5">Wind</span>
                      <span className="text-slate-900 whitespace-nowrap text-[11px] font-black">{slot.wind_speed_kts}kt</span>
                    </div>
                    <div className="text-center flex-1 border-l border-slate-200 pl-1">
                      <span className="text-[8px] text-slate-400 block uppercase leading-none mb-0.5">Swell</span>
                      <span className="text-slate-900 whitespace-nowrap text-[11px] font-black">{slot.swell_period_s}s</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-600 mt-1 line-clamp-2 leading-tight">
                  {slot.notes}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
