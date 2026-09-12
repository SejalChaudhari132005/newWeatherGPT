import React from 'react';
import { Sprout, Radar, Plane, AlertTriangle } from 'lucide-react';

interface Props {
  aqiCategory?: string;
  onNavigateTab: (tab: string) => void;
}

export const CitizenQuickActions: React.FC<Props> = ({ aqiCategory = 'Moderate', onNavigateTab }) => {
  return (
    <div className="grid grid-cols-4 gap-2 font-['Arimo']">
      {/* 1. Air Quality */}
      <button
        onClick={() => onNavigateTab('advisories')}
        className="p-3 rounded-2xl bg-[#EAF8EE] hover:bg-[#DEF4E4] border border-emerald-100/80 flex flex-col items-center justify-between text-center transition-all cursor-pointer group shadow-2xs"
      >
        <div className="p-1.5 rounded-full bg-emerald-100/70 text-emerald-700 group-hover:scale-110 transition-transform">
          <Sprout className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-black text-slate-800 tracking-tight mt-1 truncate w-full">
          Air Quality
        </span>
        <span className="text-[9px] font-black text-emerald-700 mt-0.5 truncate w-full flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {aqiCategory}
        </span>
      </button>

      {/* 2. Radar & Satellite */}
      <button
        onClick={() => onNavigateTab('radar')}
        className="p-3 rounded-2xl bg-[#E8F4FA] hover:bg-[#DCEDF8] border border-sky-100/80 flex flex-col items-center justify-between text-center transition-all cursor-pointer group shadow-2xs"
      >
        <div className="p-1.5 rounded-full bg-sky-100/70 text-sky-700 group-hover:scale-110 transition-transform">
          <Radar className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-black text-slate-800 tracking-tight mt-1 truncate w-full">
          Radar & Satellite
        </span>
        <span className="text-[9px] font-black text-sky-600 mt-0.5 truncate w-full">
          View Map
        </span>
      </button>

      {/* 3. Travel & Route */}
      <button
        onClick={() => onNavigateTab('travel')}
        className="p-3 rounded-2xl bg-[#F2EDFB] hover:bg-[#E8DEF8] border border-purple-100/80 flex flex-col items-center justify-between text-center transition-all cursor-pointer group shadow-2xs"
      >
        <div className="p-1.5 rounded-full bg-purple-100/70 text-purple-700 group-hover:scale-110 transition-transform">
          <Plane className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-black text-slate-800 tracking-tight mt-1 truncate w-full">
          Travel & Route
        </span>
        <span className="text-[9px] font-black text-purple-700 mt-0.5 truncate w-full">
          Plan Route
        </span>
      </button>

      {/* 4. Disaster Alerts */}
      <button
        onClick={() => onNavigateTab('alerts')}
        className="p-3 rounded-2xl bg-[#FDEEEF] hover:bg-[#FAD9DC] border border-rose-100/80 flex flex-col items-center justify-between text-center transition-all cursor-pointer group shadow-2xs"
      >
        <div className="p-1.5 rounded-full bg-rose-100/70 text-rose-700 group-hover:scale-110 transition-transform">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-black text-slate-800 tracking-tight mt-1 truncate w-full">
          Disaster Alerts
        </span>
        <span className="text-[9px] font-black text-rose-600 mt-0.5 truncate w-full">
          View Alerts
        </span>
      </button>
    </div>
  );
};
