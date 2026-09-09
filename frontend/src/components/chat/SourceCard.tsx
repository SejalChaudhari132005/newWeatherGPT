import React from 'react';
import { Database, Clock, MapPin } from 'lucide-react';
import { WeatherSourceInfo, WeatherLocationInfo } from '../../types/chat';

interface Props {
  sources?: WeatherSourceInfo[];
  location?: WeatherLocationInfo;
  retrievedAt?: string;
  latencyMs?: number;
}

export const SourceCard: React.FC<Props> = ({
  sources,
  location,
  retrievedAt,
  latencyMs,
}) => {
  const getFreshness = (iso?: string) => {
    if (!iso) return 'Just now';
    try {
      const diffMins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
      if (diffMins <= 0) return 'Just now';
      if (diffMins === 1) return 'Updated 1 min ago';
      return `Updated ${diffMins} min ago`;
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="pt-2.5 mt-2 border-t border-slate-100/90 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-['Arimo']">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-extrabold text-slate-600 flex items-center gap-1">
          <Database className="w-3 h-3 text-[#004aad]" />
          <span>Sources:</span>
        </span>

        {sources && sources.length > 0 ? (
          sources.map((s, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200/60"
            >
              {s.provider || (s as any).name || 'Open-Meteo'}
            </span>
          ))
        ) : (
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
            Open-Meteo + IMD
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {location?.city && (
          <span className="flex items-center gap-0.5 text-slate-600 font-bold">
            <MapPin className="w-3 h-3 text-rose-500" />
            <span>{location.city}</span>
          </span>
        )}

        <span className="flex items-center gap-0.5 text-slate-400 font-medium">
          <Clock className="w-3 h-3" />
          <span>{getFreshness(retrievedAt)}</span>
        </span>
      </div>
    </div>
  );
};
