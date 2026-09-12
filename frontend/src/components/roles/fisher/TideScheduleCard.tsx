import React from 'react';
import { ArrowUp, ArrowDown, Waves, Info } from 'lucide-react';
import { TideExtrema } from '../../../types/fisherIntelligence';

interface TideScheduleCardProps {
  tides: TideExtrema[];
}

export const TideScheduleCard: React.FC<TideScheduleCardProps> = ({ tides }) => {
  return (
    <div className="gov-panel">
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Waves className="w-3.5 h-3.5 text-[#17365D]" />
          <span>TIDE PREDICTIONS & HARBOR DRAFT (भरती आणि ओहोटी)</span>
        </div>
        <span className="gov-badge gov-badge-neutral text-[10px]">
          SEMI-DIURNAL TIDES
        </span>
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        {/* Tide Cards 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {tides.map((tide, idx) => {
            const isHigh = tide.tide_type === 'high';
            return (
              <div
                key={`${tide.time}-${idx}`}
                className={`p-3 rounded-xs border transition-all flex flex-col justify-between ${
                  isHigh
                    ? 'bg-[#EBF3FA] border-[#B9D5F3] text-[#0F2942]'
                    : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#1F2933]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xs whitespace-nowrap ${
                    isHigh ? 'bg-[#1D5F91] text-white' : 'bg-[#64748B] text-white'
                  }`}>
                    {isHigh ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {isHigh ? 'भरती High' : 'ओहोटी Low'}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#17365D] whitespace-nowrap">{tide.time}</span>
                </div>

                <div>
                  <div className="text-lg sm:text-xl font-black whitespace-nowrap text-[#17365D]">
                    {tide.height_m} <span className="text-xs font-bold text-[#5B6770]">m</span>
                  </div>
                  <div className="text-[10px] text-[#5B6770] font-semibold mt-0.5 whitespace-nowrap">
                    {isHigh ? 'Max Depth Draft' : 'Shallow Sill Alert'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 p-2.5 bg-[#F8FAFC] rounded-xs border border-[#CBD5E1] text-[11px] text-[#5B6770] leading-tight">
          <Info className="w-4 h-4 text-[#1D5F91] shrink-0" />
          <span>Tidal heights referenced against Mean Sea Level (MSL). Harbor approach channels require minimum 2.0m draft.</span>
        </div>
      </div>
    </div>
  );
};
