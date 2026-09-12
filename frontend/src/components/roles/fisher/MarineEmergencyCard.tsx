import React from 'react';
import { PhoneCall, Radio, ShieldAlert, LifeBuoy } from 'lucide-react';

interface MarineEmergencyCardProps {
  officialBulletin?: string | null;
  sosContact: string;
}

export const MarineEmergencyCard: React.FC<MarineEmergencyCardProps> = ({
  officialBulletin,
  sosContact,
}) => {
  return (
    <div className="gov-panel">
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <LifeBuoy className="w-3.5 h-3.5 text-[#D97706]" />
          <span>COASTAL EMERGENCY BROADCAST & SOS HOTLINES</span>
        </div>
        <span className="gov-badge gov-badge-danger text-[10px] animate-pulse">
          24/7 MARITIME SOS
        </span>
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        {/* Official Bulletin Banner */}
        {officialBulletin && (
          <div className="p-3 rounded-xs bg-[#FEF2F2] border border-rose-300 text-xs text-[#991B1B] flex items-start gap-2 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-900">IMD / INCOIS Official Bulletin: </span>
              {officialBulletin}
            </div>
          </div>
        )}

        {/* Emergency Hotlines Stack */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Coast Guard SOS */}
          <a
            href="tel:1554"
            className="p-3 rounded-xs bg-[#FF9933] hover:bg-[#F97316] text-slate-950 flex items-center justify-between transition-all group cursor-pointer shadow-xs"
          >
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-900">Indian Coast Guard MRCC</div>
              <div className="text-base sm:text-lg font-black text-slate-950">TOLL-FREE: 1554</div>
            </div>
            <div className="p-2 rounded-xs bg-slate-950 text-[#FF9933] group-hover:scale-105 transition-transform">
              <PhoneCall className="w-4 h-4" />
            </div>
          </a>

          {/* Marine Police */}
          <a
            href="tel:1093"
            className="p-3 rounded-xs bg-[#17365D] hover:bg-[#0F233D] text-white flex items-center justify-between transition-all group cursor-pointer shadow-xs border border-[#2A4D7A]"
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Coastal Marine Police</div>
              <div className="text-base sm:text-lg font-black text-white">EMERGENCY: 1093</div>
            </div>
            <div className="p-2 rounded-xs bg-[#006B3C] text-white group-hover:scale-105 transition-transform">
              <PhoneCall className="w-4 h-4" />
            </div>
          </a>
        </div>

        {/* VHF Channel 16 */}
        <div className="p-2.5 rounded-xs bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6770]">VHF Maritime Distress Radio</div>
            <div className="text-xs sm:text-sm font-black text-[#17365D]">Channel 16 (156.8 MHz) • International Distress</div>
          </div>
          <Radio className="w-5 h-5 text-[#1D5F91] mr-1" />
        </div>
      </div>
    </div>
  );
};
