import React from 'react';
import { Compass, ShieldCheck, AlertTriangle, ShieldAlert, Navigation } from 'lucide-react';
import { ZoneRisk } from '../../../types/fisherIntelligence';

interface ZoneRiskCardProps {
  zoneRisks: ZoneRisk[];
}

export const ZoneRiskCard: React.FC<ZoneRiskCardProps> = ({ zoneRisks }) => {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">Fishing Zone Risk Watch</h3>
            <p className="text-[11px] text-slate-500 font-medium truncate">Safe operational limits across marine tiers</p>
          </div>
        </div>

        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
          Swipe ➔
        </span>
      </div>

      {/* Horizontal Scrollable Zone Cards */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 snap-x -mx-1 px-1">
        {zoneRisks.map((zone) => {
          const isLow = zone.risk_level === 'low';
          const isMod = zone.risk_level === 'moderate';

          return (
            <div
              key={zone.zone_name}
              className={`min-w-[210px] w-[210px] flex-shrink-0 snap-start p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                isLow
                  ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
                  : isMod
                  ? 'bg-amber-50/60 border-amber-300 text-slate-900'
                  : 'bg-rose-50/60 border-rose-300 text-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-xs font-black tracking-tight text-slate-900 truncate">{zone.zone_name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${
                    isLow
                      ? 'bg-emerald-600 text-white'
                      : isMod
                      ? 'bg-amber-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}>
                    {zone.risk_level}
                  </span>
                </div>

                <div className="text-base font-black text-slate-900 mb-1.5 flex items-baseline gap-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500">Wave:</span>
                  <span className="text-sm font-black whitespace-nowrap">{zone.max_wave_height_m}m</span>
                </div>

                <p className="text-[11px] text-slate-700 leading-relaxed font-normal">
                  {zone.advisory}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
