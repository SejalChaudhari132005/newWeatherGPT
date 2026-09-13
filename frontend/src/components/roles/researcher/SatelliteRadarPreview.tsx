import React, { useState } from 'react';
import { Radio, Eye, Cloud, Sparkles, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

export const SatelliteRadarPreview: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'Infrared' | 'Visible' | 'Radar'>('Infrared');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const images = {
    Infrared: {
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      label: 'INSAT-3D Thermal IR (10.8 µm)',
      time: '13 Sep 2025 14:00 IST',
      channel: 'Channel 4 · Brightness Temp: -72°C to +30°C',
    },
    Visible: {
      url: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=800&auto=format&fit=crop&q=80',
      label: 'INSAT-3D Visible (0.65 µm)',
      time: '13 Sep 2025 14:00 IST',
      channel: 'Channel 1 · 1km High-Resolution Optical',
    },
    Radar: {
      url: 'https://images.unsplash.com/photo-1590055531615-f16d36ffe8ec?w=800&auto=format&fit=crop&q=80',
      label: 'IMD Doppler Weather Radar (DWR)',
      time: '13 Sep 2025 14:05 IST',
      channel: 'Composite Max-Z Reflectivity (52 dBZ Peak)',
    },
  };

  const current = images[activeMode];

  return (
    <div className="bg-white border border-[#D6DCE1] rounded-xs p-3.5 shadow-xs flex flex-col font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-[#D6DCE1] mb-2.5">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-[#17365D]" />
          <h3 className="text-xs font-bold text-[#17365D] uppercase tracking-wide">
            Satellite & Radar View
          </h3>
        </div>

        {/* Mode Toggles */}
        <div className="flex items-center gap-1 bg-[#F1F5F9] p-0.5 rounded-xs border border-[#E2E8F0]">
          {(['Infrared', 'Visible', 'Radar'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setActiveMode(m)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors cursor-pointer ${
                activeMode === m
                  ? 'bg-[#0284C7] text-white shadow-2xs'
                  : 'text-[#5B6770] hover:text-[#1F2933]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Satellite Imagery Canvas */}
      <div className="relative w-full h-[180px] sm:h-[200px] bg-[#0A192F] rounded-xs overflow-hidden border border-[#D6DCE1] flex items-center justify-center group">
        <img
          src={current.url}
          alt={current.label}
          style={{ transform: `scale(${zoomLevel})` }}
          className="w-full h-full object-cover transition-transform duration-300 opacity-90 filter contrast-125 saturate-110"
        />

        {/* Grid & Crosshair Overlay for Scientific Aesthetic */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, transparent 30%, rgba(255,255,255,0.2) 60%), repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 21px)',
          }}
        />

        {/* Top-Right Zoom Controls */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 bg-black/60 backdrop-blur-xs p-1 rounded-xs border border-white/20">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2))}
            className="text-white hover:text-sky-300 p-0.5 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 1))}
            className="text-white hover:text-sky-300 p-0.5 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top-Left Live Status Indicator */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded-xs border border-white/20 text-white text-[9.5px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE GEO-SCAN</span>
        </div>

        {/* Bottom Banner with Metadata */}
        <div className="absolute bottom-0 left-0 right-0 bg-slate-950/85 backdrop-blur-xs px-2.5 py-1.5 text-[10px] text-white flex items-center justify-between border-t border-white/10 font-mono">
          <div className="truncate">
            <span className="font-bold text-sky-300">{current.label}</span>
          </div>
          <span className="text-gray-300 shrink-0 ml-2">{current.time}</span>
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#5B6770] font-mono">
        <span>{current.channel}</span>
        <span className="text-[#006B3C] font-semibold">MOSDAC / ISRO Calibrated</span>
      </div>
    </div>
  );
};
