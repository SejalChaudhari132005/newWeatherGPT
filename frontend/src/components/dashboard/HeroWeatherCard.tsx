import React from 'react';
import { CloudSun, Wind, Activity, Eye, Gauge, MapPin } from 'lucide-react';
import { useWeather } from '../../context/WeatherContext';

export const HeroWeatherCard: React.FC = () => {
  const { currentWeather, userLocation } = useWeather();

  const cityUppercase = (userLocation?.city || 'Detecting Location...').toUpperCase();

  return (
    <div className="space-y-4">
      {/* Primary Vibrant Weather Card */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 text-white p-6 shadow-xl shadow-sky-600/20 border border-sky-400/30 flex flex-col justify-between min-h-[260px]">
        {/* Top Location */}
        <div className="flex items-center justify-between z-10">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-sky-100 block">
              {cityUppercase}
            </span>
            <span className="text-[11px] font-medium text-sky-200 block">
              Current conditions
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <CloudSun className="w-8 h-8 text-sky-100 animate-float" />
          </div>
        </div>

        {/* Temperature & Condition */}
        <div className="my-4 z-10">
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black tracking-tight">{currentWeather.temperature}°</span>
            <span className="text-2xl font-bold text-sky-100">C</span>
          </div>
          <p className="text-sm font-bold text-white mt-1">{currentWeather.condition}</p>
          <p className="text-xs text-sky-200 font-medium">Feels like {currentWeather.feelsLike}°</p>
        </div>

        {/* Rain Probability Bar */}
        <div className="z-10 pt-3 border-t border-white/20 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-sky-100">Rain probability</span>
            <span className="text-white font-extrabold">{currentWeather.rainProbability}%</span>
          </div>

          <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-500"
              style={{ width: `${currentWeather.rainProbability}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Wind Speed */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Wind className="w-4 h-4 text-sky-600" />
            <span>Wind Speed</span>
          </div>
          <p className="text-lg font-black text-slate-900">{currentWeather.windSpeed} <span className="text-xs font-bold text-slate-500">km/h</span></p>
          <p className="text-[11px] font-semibold text-emerald-600">Gentle breeze</p>
        </div>

        {/* Air Quality */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Air Quality</span>
          </div>
          <p className="text-lg font-black text-emerald-600">{currentWeather.airQualityLabel}</p>
          <p className="text-[11px] font-semibold text-emerald-600">Good for outdoors</p>
        </div>

        {/* Visibility */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-sky-600" />
            <span>Visibility</span>
          </div>
          <p className="text-lg font-black text-slate-900">{currentWeather.visibility} <span className="text-xs font-bold text-slate-500">km</span></p>
          <p className="text-[11px] font-semibold text-slate-500">Clear roadway</p>
        </div>

        {/* Pressure */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Gauge className="w-4 h-4 text-indigo-600" />
            <span>Pressure</span>
          </div>
          <p className="text-lg font-black text-slate-900">{currentWeather.pressure} <span className="text-xs font-bold text-slate-500">hPa</span></p>
          <p className="text-[11px] font-semibold text-slate-500">Normal range</p>
        </div>
      </div>
    </div>
  );
};
