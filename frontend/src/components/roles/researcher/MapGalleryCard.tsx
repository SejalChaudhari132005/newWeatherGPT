import React from 'react';
import { Layers, Eye } from 'lucide-react';

interface MapGalleryItem {
  id: string;
  name: string;
  category: string;
  gradient: string;
  patternType: string;
}

const GALLERY_ITEMS: MapGalleryItem[] = [
  {
    id: 'temperature',
    name: 'Temperature',
    category: 'Thermal',
    gradient: 'from-amber-500 via-orange-500 to-red-600',
    patternType: 'heat',
  },
  {
    id: 'rainfall',
    name: 'Rainfall',
    category: 'Precipitation',
    gradient: 'from-blue-600 via-cyan-400 to-emerald-500',
    patternType: 'radar',
  },
  {
    id: 'wind_speed',
    name: 'Wind Speed',
    category: 'Kinetic',
    gradient: 'from-indigo-600 via-sky-500 to-teal-400',
    patternType: 'wind',
  },
  {
    id: 'soil_moisture',
    name: 'Soil Moisture',
    category: 'Hydrology',
    gradient: 'from-emerald-700 via-lime-600 to-amber-700',
    patternType: 'soil',
  },
  {
    id: 'ndvi',
    name: 'Vegetation Index (NDVI)',
    category: 'Biosphere',
    gradient: 'from-green-800 via-emerald-500 to-yellow-500',
    patternType: 'ndvi',
  },
  {
    id: 'cyclone_track',
    name: 'Cyclone Track',
    category: 'Dynamic Track',
    gradient: 'from-violet-900 via-purple-600 to-pink-500',
    patternType: 'vortex',
  },
];

interface MapGalleryCardProps {
  onSelectMapLayer?: (layerId: string) => void;
}

export const MapGalleryCard: React.FC<MapGalleryCardProps> = ({ onSelectMapLayer }) => {
  return (
    <div className="bg-white rounded-md border border-slate-200 p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
          Map Gallery
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">6 Layers</span>
      </div>

      <div className="grid grid-cols-3 gap-2 flex-1">
        {GALLERY_ITEMS.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectMapLayer && onSelectMapLayer(item.id)}
            className="group relative rounded overflow-hidden border border-slate-200 cursor-pointer aspect-4/3 flex flex-col justify-end p-2 transition-all hover:shadow-md hover:border-blue-400"
          >
            {/* Synthetic Scientific Visual Texture */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-90 group-hover:scale-105 transition-transform duration-300`}
            />

            {/* Subtle scientific grid / contour pattern overlay */}
            <div
              className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none"
              style={{
                backgroundImage:
                  item.patternType === 'vortex'
                    ? 'radial-gradient(circle at center, transparent 20%, rgba(255,255,255,0.4) 40%, transparent 60%)'
                    : 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px)',
              }}
            />

            {/* Hover Action Badge */}
            <div className="absolute top-1.5 right-1.5 bg-black/40 backdrop-blur-xs text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-3 h-3" />
            </div>

            {/* Label */}
            <div className="relative z-10 text-left drop-shadow-xs">
              <span className="text-[10px] font-bold text-white leading-tight block truncate drop-shadow-md">
                {item.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
