import React, { useState } from 'react';
import { MapPin, Sun, CloudRain, Wind, Droplets, Umbrella, ChevronDown, Bell } from 'lucide-react';
import { useWeather } from '../../context/WeatherContext';
import { useUI } from '../../context/UIContext';
import { useLocationContext } from '../../context/LocationContext';

export const MobileHeroWeatherCard: React.FC = () => {
  const { currentWeather } = useWeather();
  const { location } = useLocationContext();
  const { setLocationModalOpen } = useUI();
  const [selectedHour, setSelectedHour] = useState('09:00');

  const locationName = location?.city
    ? `${location.city}${location.state ? `, ${location.state}` : ''}`
    : location?.latitude != null
    ? 'Location detected'
    : 'Select Location';

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const timelineTicks = [
    { time: '05:00', icon: '☁️', temp: 22 },
    { time: '07:00', icon: '🌤️', temp: 24 },
    { time: '09:00', icon: '☀️', temp: 25, active: true },
    { time: '11:00', icon: '⛈️', temp: 28 },
    { time: '13:00', icon: '🌧️', temp: 26 },
  ];

  return (
    <div className="space-y-4 p-4">
      {/* Top Location Header Bar */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setLocationModalOpen(true)}
          className="text-left flex items-center gap-1.5 cursor-pointer group"
        >
          <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
          <div>
            <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1">
              {locationName}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">{dateStr}</div>
          </div>
        </button>

        <button type="button" className="p-2.5 rounded-full bg-white text-slate-600 shadow-2xs border border-slate-200/80 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
        </button>
      </div>

      {/* Main Soft Blue Gradient Card */}
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-b from-[#38b6ff] via-[#005bb5] to-[#004aad] text-white p-6 shadow-xl shadow-blue-900/30 flex flex-col justify-between min-h-[340px] text-center">
        {/* Top 3D-style Sun/Cloud Graphic */}
        <div className="my-2 flex justify-center">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute top-1 right-2 p-3 bg-[#fcd444] rounded-full blur-2xs animate-pulse">
              <Sun className="w-8 h-8 text-amber-900" />
            </div>
            <div className="relative z-10 p-4 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg animate-float">
              <CloudRain className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>

        {/* Temperature & Condition */}
        <div className="my-2">
          <h2 className="text-6xl font-black tracking-tight">{currentWeather.temperature}°<span className="text-3xl font-bold">c</span></h2>
          <p className="text-sm font-extrabold text-sky-100 mt-1">{currentWeather.condition}</p>
        </div>

        {/* Floating Glassmorphism Metric Bar */}
        <div className="mt-4 p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="flex justify-center text-sky-200 mb-0.5"><Wind className="w-4 h-4" /></div>
            <div className="font-extrabold">{currentWeather.windSpeed} km/h</div>
            <div className="text-[9px] text-sky-200 font-semibold">Wind</div>
          </div>

          <div className="border-x border-white/20">
            <div className="flex justify-center text-sky-200 mb-0.5"><Droplets className="w-4 h-4" /></div>
            <div className="font-extrabold">{currentWeather.humidity}%</div>
            <div className="text-[9px] text-sky-200 font-semibold">Humidity</div>
          </div>

          <div>
            <div className="flex justify-center text-sky-200 mb-0.5"><Umbrella className="w-4 h-4" /></div>
            <div className="font-extrabold">{currentWeather.rainProbability}%</div>
            <div className="text-[9px] text-sky-200 font-semibold">Precipitation</div>
          </div>
        </div>
      </div>

      {/* Hourly Timeline Scrubber Bar */}
      <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-lg space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
          <span>Hourly Forecast</span>
          <span className="text-sky-400">Scrubber Timeline</span>
        </div>

        <div className="flex items-center justify-around">
          {timelineTicks.map((tick, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedHour(tick.time)}
              className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all cursor-pointer ${
                selectedHour === tick.time
                  ? 'bg-sky-600 text-white shadow-md font-bold scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xs mb-1">{tick.icon}</span>
              <span className="text-[11px] font-extrabold">{tick.time}</span>
              <span className="text-[9px] opacity-75 mt-0.5">{tick.temp}°</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
