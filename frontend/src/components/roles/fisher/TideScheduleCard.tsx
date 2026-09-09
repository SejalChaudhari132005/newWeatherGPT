import React from 'react';
import { Compass, ArrowUp, ArrowDown, Waves, Info } from 'lucide-react';
import { TideExtrema } from '../../../types/fisherIntelligence';

interface TideScheduleCardProps {
  tides: TideExtrema[];
}

export const TideScheduleCard: React.FC<TideScheduleCardProps> = ({ tides }) => {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
            <Waves className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">Tide Predictions (भरती/ओहोटी)</h3>
            <p className="text-[11px] text-slate-500 font-medium truncate">Coastal tidal peaks & navigation draft</p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 shrink-0">
          Semi-Diurnal
        </span>
      </div>

      {/* Tide Cards 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {tides.map((tide, idx) => {
          const isHigh = tide.tide_type === 'high';
          return (
            <div
              key={`${tide.time}-${idx}`}
              className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                isHigh
                  ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                  : 'bg-slate-50/90 border-slate-200/80 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap ${
                  isHigh ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {isHigh ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {isHigh ? 'भरती High' : 'ओहोटी Low'}
                </span>
                <span className="text-[11px] font-extrabold text-slate-500 whitespace-nowrap">{tide.time}</span>
              </div>

              <div>
                <div className="text-xl font-black whitespace-nowrap">
                  {tide.height_m} <span className="text-xs font-bold opacity-70">m</span>
                </div>
                <div className="text-[10px] opacity-75 font-semibold mt-0.5 whitespace-nowrap">
                  {isHigh ? 'Max Depth Draft' : 'Shallow Sills'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-[11px] text-slate-600 leading-tight">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>Tidal heights referenced against MSL. Channels require min 2.0m draft.</span>
      </div>
    </div>
  );
};
