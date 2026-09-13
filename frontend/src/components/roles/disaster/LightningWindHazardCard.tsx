import React from 'react';
import { Zap, Wind } from 'lucide-react';

interface LightningWindHazardCardProps {
  lightningDensity: number;
  capeIndex: number;
  windSpeedKmh: number;
  windGustKmh: number;
}

export const LightningWindHazardCard: React.FC<LightningWindHazardCardProps> = ({
  lightningDensity,
  capeIndex,
  windSpeedKmh,
  windGustKmh,
}) => {
  const isLightningSevere = lightningDensity > 15;
  const isWindSevere = windGustKmh > 55;

  return (
    <div className="gov-panel bg-white border border-[#D6DCE1] rounded-xs shadow-xs text-[#1F2933]">
      <div className="gov-panel-header bg-white border-b border-[#D6DCE1] px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#D97706]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#17365D]">
            Convective Storm & Wind Hazard
          </h3>
        </div>
        <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-widest">
          Doppler Radar / CAPE
        </span>
      </div>

      <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Lightning Card */}
        <div className="p-3 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1F2933] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#D97706]" />
              Lightning Density
            </span>
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-xs border ${
                isLightningSevere
                  ? 'bg-[#FEF2F2] text-[#B42318] border-[#FCA5A5]'
                  : 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
              }`}
            >
              {lightningDensity > 10 ? 'Active Convection' : 'Low Activity'}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-[#1F2933]">{lightningDensity}</span>
            <span className="text-[11px] text-[#5B6770]">strikes / 10km radius</span>
          </div>

          <div className="mt-1.5 text-[10px] text-[#5B6770]">
            Convective CAPE: <span className="text-[#1F2933] font-bold">{capeIndex} J/kg</span>
            {capeIndex > 1500 ? ' (Severe Updraft)' : ' (Stable)'}
          </div>
        </div>

        {/* Squall Wind Card */}
        <div className="p-3 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1F2933] flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-[#006B3C]" />
              Sustained Wind & Gusts
            </span>
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-xs border ${
                isWindSevere
                  ? 'bg-[#FEF2F2] text-[#B42318] border-[#FCA5A5]'
                  : 'bg-[#F0FDF4] text-[#006B3C] border-[#BBF7D0]'
              }`}
            >
              {windGustKmh > 50 ? 'Gale / Squall' : 'Moderate'}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-[#1F2933]">{windSpeedKmh}</span>
            <span className="text-[11px] text-[#5B6770]">km/h sustained</span>
          </div>

          <div className="mt-1.5 text-[10px] text-[#5B6770]">
            Peak Gust Speed: <span className="text-[#B42318] font-bold">{windGustKmh} km/h</span>
          </div>
        </div>
      </div>
    </div>
  );
};
