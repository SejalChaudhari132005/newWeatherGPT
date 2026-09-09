import React from 'react';
import { CalendarClock, CheckCircle2, AlertTriangle, XCircle, Droplets, SprayCan, Scissors, Sparkles } from 'lucide-react';
import { FarmingWindowSlot } from '../../../types/farmerIntelligence';

interface FarmingWindowsTimelineProps {
  windows: FarmingWindowSlot[];
}

export const FarmingWindowsTimeline: React.FC<FarmingWindowsTimelineProps> = ({ windows }) => {
  const getActivityIcon = (activity: string) => {
    switch (activity.toLowerCase()) {
      case 'spraying':
        return <SprayCan className="w-4 h-4" />;
      case 'irrigation':
        return <Droplets className="w-4 h-4" />;
      case 'harvesting':
      case 'field_work':
        return <Scissors className="w-4 h-4" />;
      default:
        return <CalendarClock className="w-4 h-4" />;
    }
  };

  const getSuitabilityStyle = (suitability: string) => {
    switch (suitability.toLowerCase()) {
      case 'optimal':
        return {
          bg: 'bg-emerald-50/80 border-emerald-200',
          badge: 'bg-emerald-600 text-white',
          text: 'text-emerald-950',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          progress: 'bg-emerald-500',
        };
      case 'moderate':
        return {
          bg: 'bg-amber-50/80 border-amber-200',
          badge: 'bg-amber-500 text-white',
          text: 'text-amber-950',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          progress: 'bg-amber-500',
        };
      case 'unfavorable':
      default:
        return {
          bg: 'bg-rose-50/80 border-rose-200',
          badge: 'bg-rose-600 text-white',
          text: 'text-rose-950',
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
          progress: 'bg-rose-500',
        };
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Best Farming Windows</h3>
            <p className="text-[11px] text-slate-500">Hourly suitability for field activities</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1 shrink-0 whitespace-nowrap">
          <Sparkles className="w-3 h-3 text-emerald-500" /> Next 24h
        </span>
      </div>

      {/* Windows list */}
      <div className="space-y-2.5">
        {windows.map((w, idx) => {
          const style = getSuitabilityStyle(w.suitability);
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border transition-all ${style.bg}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 bg-white rounded-lg shadow-2xs text-slate-800 shrink-0">
                    {getActivityIcon(w.activity)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 capitalize truncate">
                        {w.activity.replace('_', ' ')}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${style.badge} shrink-0`}>
                        {w.suitability}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-slate-800 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs shrink-0 whitespace-nowrap">
                  ⏰ {w.start_time} - {w.end_time}
                </div>
              </div>

              {/* Rationale and limiting factor */}
              <p className="text-xs text-slate-700 font-medium leading-relaxed mb-2">
                {w.rationale}
              </p>

              {w.limiting_factor && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md w-fit mb-2">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Limiting: {w.limiting_factor}</span>
                </div>
              )}

              {/* Score bar */}
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Score:</span>
                <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${style.progress}`}
                    style={{ width: `${w.score}%` }}
                  />
                </div>
                <span className="text-xs font-black text-slate-900 shrink-0">{w.score}/100</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
