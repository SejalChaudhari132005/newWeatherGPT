import React from 'react';
import { Navigation } from 'lucide-react';
import { ZoneRisk } from '../../../types/fisherIntelligence';

interface ZoneRiskCardProps {
  zoneRisks: ZoneRisk[];
}

export const ZoneRiskCard: React.FC<ZoneRiskCardProps> = ({ zoneRisks }) => {
  return (
    <div className="gov-panel">
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-[#006B3C]" />
          <span>FISHING ZONE RISK WATCH & DISTANCE TIERS</span>
        </div>
        <span className="text-[10px] font-bold text-[#FF9933] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-xs">
          SWIPE HORIZONTALLY ➔
        </span>
      </div>

      <div className="p-3 sm:p-4">
        {/* Horizontal Scrollable Zone Cards */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 snap-x -mx-1 px-1">
          {zoneRisks.map((zone) => {
            const isLow = zone.risk_level === 'low';
            const isMod = zone.risk_level === 'moderate';

            return (
              <div
                key={zone.zone_name}
                className={`min-w-[210px] w-[210px] flex-shrink-0 snap-start p-3 rounded-xs border transition-all flex flex-col justify-between ${
                  isLow
                    ? 'bg-[#F0FDF4] border-emerald-300 text-slate-900'
                    : isMod
                    ? 'bg-[#FFFBEB] border-amber-300 text-slate-900'
                    : 'bg-[#FEF2F2] border-rose-300 text-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-xs font-black tracking-tight text-[#17365D] truncate">{zone.zone_name}</span>
                    <span className={`px-2 py-0.5 rounded-xs text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${
                      isLow
                        ? 'bg-emerald-600 text-white'
                        : isMod
                        ? 'bg-amber-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}>
                      {zone.risk_level}
                    </span>
                  </div>

                  <div className="text-base font-black text-[#17365D] mb-1.5 flex items-baseline gap-1">
                    <span className="text-[10px] font-bold uppercase text-[#5B6770]">Wave:</span>
                    <span className="text-sm font-black whitespace-nowrap">{zone.max_wave_height_m}m</span>
                  </div>

                  <p className="text-[11px] text-[#5B6770] leading-relaxed font-normal">
                    {zone.advisory}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
