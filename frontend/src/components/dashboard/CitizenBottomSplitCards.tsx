import React from 'react';
import { Plane, ShieldAlert, ChevronRight, ArrowRight } from 'lucide-react';

interface Props {
  onPlanRoute?: () => void;
  onViewAlerts?: () => void;
}

export const CitizenBottomSplitCards: React.FC<Props> = ({
  onPlanRoute,
  onViewAlerts,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2.5 font-['Arimo']">
      {/* Left Card: Travel & Route */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <Plane className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="text-[11px] font-black text-slate-900 truncate">
              Travel & Route
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>

        {/* Route Preview Graphic */}
        <div className="relative rounded-xl overflow-hidden h-16 bg-slate-100 border border-slate-200 flex items-center justify-center p-2">
          <img
            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=400&q=80"
            alt="Route Map"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="relative z-10 w-full flex items-center justify-between px-2">
            <div className="w-3 h-3 rounded-full bg-rose-500 border border-white shadow-xs"></div>
            <div className="flex-1 border-t-2 border-dashed border-sky-600 mx-1"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-xs"></div>
          </div>
        </div>

        <p className="text-[9.5px] text-slate-600 font-medium leading-tight line-clamp-2">
          Get weather-aware routes for safer travel
        </p>

        <button
          onClick={onPlanRoute}
          className="w-full py-1.5 px-2 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-black transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>Plan Your Route</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Right Card: Disaster Management */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="text-[11px] font-black text-slate-900 truncate">
              Disaster Management
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>

        {/* Storm Lightning Graphic */}
        <div className="relative rounded-xl overflow-hidden h-16 bg-slate-900 border border-slate-200 flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=400&q=80"
            alt="Storm Lightning"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        </div>

        <div className="space-y-0.5 min-w-0">
          <h5 className="text-[10px] font-black text-rose-600 truncate">
            Severe Thunderstorm Warning
          </h5>
          <p className="text-[8.5px] text-slate-500 font-medium truncate">
            Valid from 12 Apr, 02:00 PM to 12 Apr, 08:00 PM
          </p>
        </div>

        <button
          onClick={onViewAlerts}
          className="w-full py-1.5 px-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>View All Alerts</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
