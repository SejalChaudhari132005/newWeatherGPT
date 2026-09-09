import React from 'react';
import { PhoneCall, Radio, AlertOctagon, ShieldAlert, LifeBuoy, ExternalLink } from 'lucide-react';

interface MarineEmergencyCardProps {
  officialBulletin?: string | null;
  sosContact: string;
}

export const MarineEmergencyCard: React.FC<MarineEmergencyCardProps> = ({
  officialBulletin,
  sosContact,
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-4 sm:p-5 text-white shadow-lg space-y-3.5 border border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-white truncate">Emergency Broadcast & SOS</h3>
            <p className="text-[11px] text-blue-200/70 font-medium truncate">Indian Coast Guard & Coastal Police</p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-black uppercase tracking-wider animate-pulse shrink-0">
          24/7 SOS
        </span>
      </div>

      {/* Official Bulletin Banner */}
      {officialBulletin && (
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-blue-100 flex items-start gap-2.5 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">IMD / INCOIS Bulletin: </span>
            {officialBulletin}
          </div>
        </div>
      )}

      {/* Emergency Hotlines Stack */}
      <div className="space-y-2">
        {/* Coast Guard SOS */}
        <a
          href="tel:1554"
          className="p-3 rounded-2xl bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/40 flex items-center justify-between transition-all group cursor-pointer"
        >
          <div>
            <div className="text-[9px] font-extrabold uppercase tracking-wider text-rose-300">Indian Coast Guard</div>
            <div className="text-sm sm:text-base font-black text-white">Toll-Free: 1554</div>
          </div>
          <div className="p-2 rounded-xl bg-rose-500 text-white group-hover:scale-105 transition-transform">
            <PhoneCall className="w-4 h-4" />
          </div>
        </a>

        {/* Marine Police */}
        <a
          href="tel:1093"
          className="p-3 rounded-2xl bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 flex items-center justify-between transition-all group cursor-pointer"
        >
          <div>
            <div className="text-[9px] font-extrabold uppercase tracking-wider text-blue-300">Coastal Marine Police</div>
            <div className="text-sm sm:text-base font-black text-white">Emergency: 1093</div>
          </div>
          <div className="p-2 rounded-xl bg-blue-500 text-white group-hover:scale-105 transition-transform">
            <PhoneCall className="w-4 h-4" />
          </div>
        </a>

        {/* VHF Channel 16 */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">VHF Distress Radio</div>
            <div className="text-sm sm:text-base font-black text-white">Channel 16 (156.8 MHz)</div>
          </div>
          <Radio className="w-5 h-5 text-cyan-400 mr-1" />
        </div>
      </div>
    </div>
  );
};
