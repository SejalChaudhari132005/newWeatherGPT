import React from 'react';
import { CloudRain, Sparkles, MapPin } from 'lucide-react';
import { useWeather } from '../../context/WeatherContext';

export const TomorrowForecastCard: React.FC = () => {
  const { userLocation } = useWeather();
  const locationName = userLocation ? `${userLocation.city}, ${userLocation.country}` : 'Your Location';

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-[#D8F0A0] text-slate-900 p-6 shadow-sm border border-lime-300/80 flex flex-col justify-between min-h-[220px]">
      {/* Top Header */}
      <div className="space-y-1 z-10">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tomorrow</p>
        <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-800" />
          <span>{locationName}</span>
        </h4>
      </div>

      {/* Temp & Character/Rain Illustration */}
      <div className="relative z-10 flex items-end justify-between pt-4">
        <div>
          <div className="text-4xl font-black text-slate-900">25°C</div>
          <div className="text-xs font-bold text-emerald-900 mt-1 flex items-center gap-1">
            <CloudRain className="w-4 h-4 text-sky-700" /> Rainy
          </div>
        </div>

        {/* Rain Illustration Graphic */}
        <div className="relative p-4 rounded-3xl bg-white/70 backdrop-blur-md shadow-md border border-white/80">
          <div className="text-3xl">☔️</div>
        </div>
      </div>
    </div>
  );
};
