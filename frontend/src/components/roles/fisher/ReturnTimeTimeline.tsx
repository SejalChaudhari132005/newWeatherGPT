import React from 'react';
import { Clock, AlertOctagon, Radio } from 'lucide-react';
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
    <div className="gov-panel">
      {/* Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#006B3C]" />
          <span>RETURN-TIME INTELLIGENCE & SEA DETERIORATION CURVE</span>
        </div>
        <span className="gov-badge gov-badge-info text-[10px]">
          HYDRODYNAMIC MODEL
        </span>
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        {/* Hero Return Deadline Badge */}
        <div className={`p-3 rounded-xs border-l-4 ${
          isCritical
            ? 'border-rose-600 bg-rose-50/70 border-rose-200'
            : isWarning
            ? 'border-amber-500 bg-amber-50/70 border-amber-200'
            : 'border-emerald-600 bg-emerald-50/70 border-emerald-200'
        } border flex items-center justify-between gap-3`}>
          <div>
            <div className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider">Mandatory Return Deadline</div>
            <div className="text-lg sm:text-xl font-black text-[#17365D] whitespace-nowrap">{returnIntel.recommended_return_time}</div>
          </div>
          <div className="text-right pl-3 border-l border-[#CBD5E1]">
            <div className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider">Safe Operational Time</div>
            <div className="text-sm sm:text-base font-black text-[#006B3C] whitespace-nowrap">{returnIntel.safe_duration_hours} Hours</div>
          </div>
        </div>

        {/* Deterioration Analysis Banner */}
        <div className="bg-[#F8FAFC] p-2.5 rounded-xs border border-[#CBD5E1] flex items-start gap-2">
          <AlertOctagon className={`w-4 h-4 mt-0.5 shrink-0 ${isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-[#1D5F91]'}`} />
          <div className="text-xs text-[#1F2933] leading-relaxed">
            <span className="font-bold text-[#17365D]">Deterioration Analysis: </span>
            {returnIntel.deterioration_reason}
          </div>
        </div>

        {/* Temporal Evolution Sequence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6770]">Hourly Temporal Condition Sequence</span>
            <span className="text-[10px] font-bold text-[#FF9933] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-xs">
              SWIPE HORIZONTALLY ➔
            </span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 snap-x -mx-1 px-1">
            {temporalCurve.map((slot) => {
              const isSlotFav = slot.status === 'favorable';
              const isSlotCaut = slot.status === 'caution';
              return (
                <div
                  key={slot.time_slot}
                  className={`min-w-[210px] w-[210px] flex-shrink-0 snap-start p-3 rounded-xs border transition-all flex flex-col justify-between ${
                    isSlotFav
                      ? 'bg-[#F0FDF4] border-emerald-300 text-slate-900'
                      : isSlotCaut
                      ? 'bg-[#FFFBEB] border-amber-300 text-slate-900'
                      : 'bg-[#FEF2F2] border-rose-300 text-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black tracking-tight text-[#17365D]">{slot.time_slot}</span>
                      <span className={`px-2 py-0.5 rounded-xs text-[9px] font-black uppercase tracking-wider ${
                        isSlotFav
                          ? 'bg-emerald-600 text-white'
                          : isSlotCaut
                          ? 'bg-amber-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}>
                        {slot.status}
                      </span>
                    </div>

                    {/* Metrics Strip */}
                    <div className="flex items-center justify-between gap-1 my-2 p-1.5 bg-white rounded-xs border border-[#CBD5E1] text-xs font-bold">
                      <div className="text-center flex-1">
                        <span className="text-[8px] text-[#5B6770] block uppercase leading-none mb-0.5">Wave</span>
                        <span className="text-[#17365D] whitespace-nowrap text-[11px] font-black">{slot.wave_height_m}m</span>
                      </div>
                      <div className="text-center flex-1 border-l border-[#E2E8F0] pl-1">
                        <span className="text-[8px] text-[#5B6770] block uppercase leading-none mb-0.5">Wind</span>
                        <span className="text-[#17365D] whitespace-nowrap text-[11px] font-black">{slot.wind_speed_kts}kt</span>
                      </div>
                      <div className="text-center flex-1 border-l border-[#E2E8F0] pl-1">
                        <span className="text-[8px] text-[#5B6770] block uppercase leading-none mb-0.5">Swell</span>
                        <span className="text-[#17365D] whitespace-nowrap text-[11px] font-black">{slot.swell_period_s}s</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#5B6770] mt-1 line-clamp-2 leading-tight">
                    {slot.notes}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
