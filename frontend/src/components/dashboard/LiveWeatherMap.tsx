import React, { useState } from 'react';
import { Map, Layers, CloudRain, Wind, Sun, Thermometer, MapPin, ArrowRight } from 'lucide-react';
import { DemoBadge } from '../common/DemoBadge';

interface Props {
  locationName: string;
  onOpenFullMap: () => void;
}

export const LiveWeatherMap: React.FC<Props> = ({ locationName, onOpenFullMap }) => {
  const [activeLayer, setActiveLayer] = useState<'rain' | 'wind' | 'cloud' | 'temp'>('rain');

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-3 font-['Arimo']">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Map className="w-4 h-4 sm:w-5 sm:h-5 text-[#004aad] shrink-0" />
          <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">IMD Doppler Radar & Live Weather Map</h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wide border border-emerald-200">
          IMD LIVE
        </span>
      </div>

      {/* Layer Toggles */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scrollbar-none">
        <button
          onClick={() => setActiveLayer('rain')}
          className={`px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
            activeLayer === 'rain' ? 'bg-[#004aad] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>IMD Radar</span>
        </button>

        <button
          onClick={() => setActiveLayer('wind')}
          className={`px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
            activeLayer === 'wind' ? 'bg-[#004aad] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Wind Vector</span>
        </button>

        <button
          onClick={() => setActiveLayer('cloud')}
          className={`px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
            activeLayer === 'cloud' ? 'bg-[#004aad] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Cloud Cover</span>
        </button>

        <button
          onClick={() => setActiveLayer('temp')}
          className={`px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
            activeLayer === 'temp' ? 'bg-[#004aad] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Thermometer className="w-3.5 h-3.5" />
          <span>Temperature</span>
        </button>
      </div>

      {/* Embedded Map Container */}
      <div
        onClick={onOpenFullMap}
        className="relative rounded-2xl overflow-hidden h-44 sm:h-52 bg-slate-950 border border-slate-200 shadow-inner flex items-center justify-center text-center p-3 sm:p-4 cursor-pointer group"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-sky-950 to-blue-900 opacity-90 group-hover:scale-105 transition-transform duration-300"></div>

        <div className="relative z-10 space-y-1.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#38b6ff]/30 flex items-center justify-center mx-auto animate-ping absolute left-1/2 -ml-4 sm:-ml-5 -mt-1"></div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#004aad] text-white flex items-center justify-center mx-auto shadow-xl relative z-10 border-2 border-white">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#fcd444]" />
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-[11px] font-black text-white max-w-full">
            <span className="truncate">📍 {locationName}</span>
          </div>

          <p className="text-[9px] sm:text-[10px] text-sky-200 font-bold uppercase tracking-wider">
            Layer: {activeLayer.toUpperCase()} • Click to open IMD Radar & Trip Planner
          </p>
        </div>
      </div>

      {/* Open Full Map Action */}
      <button
        onClick={onOpenFullMap}
        className="w-full py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#004aad] to-[#38b6ff] hover:opacity-95 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
      >
        <span>Open IMD Doppler Radar & Route Planner</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
