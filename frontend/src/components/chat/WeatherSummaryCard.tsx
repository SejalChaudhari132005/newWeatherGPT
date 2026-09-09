import React from 'react';
import { CloudRain, Wind, Droplets, Eye, Gauge, Sun } from 'lucide-react';
import { WeatherContextPayload } from '../../types/chat';
import { getWeatherIconInfo } from '../../utils/weatherIcons';

interface Props {
  weather: WeatherContextPayload['current_weather'];
  locationName?: string;
  compact?: boolean;
}

export const WeatherSummaryCard: React.FC<Props> = ({ weather, locationName, compact }) => {
  if (!weather || weather.temperature === undefined || weather.temperature === null) return null;

  const iconInfo = getWeatherIconInfo(undefined, weather.condition);

  return (
    <div className={`my-2.5 p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-sky-50/90 to-blue-50/50 border border-sky-200/80 shadow-2xs font-['Arimo'] ${compact ? 'max-w-xs' : ''}`}>
      <div className={`flex items-center justify-between ${!compact ? 'pb-2 border-b border-sky-100/80' : ''}`}>
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl">{iconInfo.emoji}</span>
          <div>
            <div className="text-xs font-black text-slate-900">{weather.condition}</div>
            {locationName && (
              <div className="text-[10px] font-bold text-slate-500">📍 {locationName}</div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {weather.temperature}°C
          </div>
          <div className="text-[10px] font-semibold text-slate-500">
            Feels like {weather.feels_like}°C
          </div>
        </div>
      </div>

      {/* Grid of Key Meteorological Metrics - only in full overview mode */}
      {!compact && (
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2.5 text-center">
        {weather.rain_probability !== undefined && (
          <div className="p-1.5 rounded-xl bg-white/80 border border-sky-100 flex flex-col items-center justify-center">
            <CloudRain className="w-3.5 h-3.5 text-[#004aad] mb-0.5" />
            <span className="text-[9px] font-bold text-slate-400 uppercase">Rain</span>
            <span className="text-xs font-black text-slate-800">{weather.rain_probability}%</span>
          </div>
        )}

        {weather.humidity !== undefined && (
          <div className="p-1.5 rounded-xl bg-white/80 border border-sky-100 flex flex-col items-center justify-center">
            <Droplets className="w-3.5 h-3.5 text-cyan-600 mb-0.5" />
            <span className="text-[9px] font-bold text-slate-400 uppercase">Humidity</span>
            <span className="text-xs font-black text-slate-800">{weather.humidity}%</span>
          </div>
        )}

        {weather.wind_speed !== undefined && (
          <div className="p-1.5 rounded-xl bg-white/80 border border-sky-100 flex flex-col items-center justify-center">
            <Wind className="w-3.5 h-3.5 text-teal-600 mb-0.5" />
            <span className="text-[9px] font-bold text-slate-400 uppercase">Wind</span>
            <span className="text-xs font-black text-slate-800">{weather.wind_speed} km/h</span>
          </div>
        )}

        {weather.visibility !== undefined && (
          <div className="p-1.5 rounded-xl bg-white/80 border border-sky-100 flex flex-col items-center justify-center">
            <Eye className="w-3.5 h-3.5 text-indigo-600 mb-0.5" />
            <span className="text-[9px] font-bold text-slate-400 uppercase">Visibility</span>
            <span className="text-xs font-black text-slate-800">{weather.visibility} km</span>
          </div>
        )}

        {weather.uv_index !== undefined && (
          <div className="p-1.5 rounded-xl bg-white/80 border border-sky-100 flex flex-col items-center justify-center">
            <Sun className="w-3.5 h-3.5 text-amber-500 mb-0.5" />
            <span className="text-[9px] font-bold text-slate-400 uppercase">UV Index</span>
            <span className="text-xs font-black text-slate-800">{weather.uv_index}</span>
          </div>
        )}

        {weather.pressure !== undefined && (
          <div className="p-1.5 rounded-xl bg-white/80 border border-sky-100 flex flex-col items-center justify-center">
            <Gauge className="w-3.5 h-3.5 text-purple-600 mb-0.5" />
            <span className="text-[9px] font-bold text-slate-400 uppercase">Pressure</span>
            <span className="text-xs font-black text-slate-800">{weather.pressure} hPa</span>
          </div>
        )}
      </div>
      )}
    </div>
  );
};
