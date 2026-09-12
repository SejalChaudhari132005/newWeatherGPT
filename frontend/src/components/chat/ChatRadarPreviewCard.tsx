import React from 'react';
import { Radar, MapPin, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  locationName?: string;
  onOpenMap?: () => void;
}

export const ChatRadarPreviewCard: React.FC<Props> = ({ locationName, onOpenMap }) => {
  const { language } = useLanguage();

  const liveRadarText = language === 'mr' ? 'थेट रडार' : language === 'hi' ? 'लाइव रडार' : 'Live Radar';
  const dopplerMapText = language === 'mr' ? 'डॉप्लर हवामान नकाशा' : language === 'hi' ? 'डॉपलर मौसम मानचित्र' : 'Interactive Doppler Weather Map';
  const openMapText = language === 'mr' ? 'नकाशा उघडा' : language === 'hi' ? 'मानचित्र खोलें' : 'Open Map';

  return (
    <div
      onClick={onOpenMap}
      className="my-2.5 rounded-2xl bg-slate-900 border border-slate-700/80 text-white overflow-hidden shadow-sm font-['Arimo'] cursor-pointer group transition-all hover:border-[#004aad]"
    >
      <div className="relative h-28 w-full overflow-hidden flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80"
          alt="Radar Preview"
          className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Live Pin */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg ring-2 ring-white">
            <MapPin className="w-3.5 h-3.5 fill-white" />
          </div>
          {locationName && (
            <span className="mt-1 px-2 py-0.5 rounded-md bg-slate-900/90 text-[10px] font-bold text-white border border-white/20">
              {locationName}
            </span>
          )}
        </div>

        {/* Live Badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{liveRadarText}</span>
        </div>
      </div>

      <div className="p-3 bg-slate-900/95 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-[#38b6ff]" />
          <span className="text-xs font-bold text-slate-200">{dopplerMapText}</span>
        </div>
        <span className="text-xs font-black text-[#38b6ff] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          <span>{openMapText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
