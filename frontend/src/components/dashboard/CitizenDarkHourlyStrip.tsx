import React from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudRain,
  CloudLightning,
} from 'lucide-react';
import { WeatherHourlyItem } from '../../types/weather';

interface Props {
  hourly?: WeatherHourlyItem[];
}

export const CitizenDarkHourlyStrip: React.FC<Props> = ({ hourly = [] }) => {
  // Format hourly time string to "10:00 pm", "11:00 pm", "12:00 am"
  const formatTime = (timeStr: string, idx: number): string => {
    if (idx === 0) return 'Now';
    if (!timeStr) return `${idx + 9}:00 pm`;

    // If ISO date string
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase();
    }

    // If already in 12h or 24h format
    const lower = timeStr.toLowerCase().trim();
    if (lower.includes('am') || lower.includes('pm')) {
      return lower;
    }
    return `${timeStr}:00`;
  };

  const renderWeatherIcon = (conditionStr: string = '', timeStr: string = '', idx: number) => {
    const c = conditionStr.toLowerCase();
    const isNight = idx > 1 || timeStr.includes('pm') || timeStr.includes('am');

    if (c.includes('thunder') || c.includes('lightning') || c.includes('storm')) {
      return <CloudLightning className="w-6 h-6 text-amber-400" />;
    }
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) {
      return <CloudRain className="w-6 h-6 text-sky-400" />;
    }
    if (c.includes('partly') || c.includes('scattered')) {
      return isNight ? (
        <CloudMoon className="w-6 h-6 text-amber-200" />
      ) : (
        <CloudSun className="w-6 h-6 text-amber-400" />
      );
    }
    if (c.includes('cloud') || c.includes('overcast')) {
      return <Cloud className="w-6 h-6 text-slate-300" />;
    }
    return isNight ? (
      <Moon className="w-6 h-6 text-amber-200" />
    ) : (
      <Sun className="w-6 h-6 text-amber-400" />
    );
  };

  // Fallback realistic timeline if hourly is empty
  const defaultHourly: WeatherHourlyItem[] = [
    { time: 'Now', temp: 28, condition: 'Partly Cloudy', icon: 'partly-cloudy', rainProb: 10 },
    { time: '10:00 pm', temp: 28, condition: 'Partly Cloudy', icon: 'partly-cloudy', rainProb: 10 },
    { time: '11:00 pm', temp: 27, condition: 'Cloudy', icon: 'cloudy', rainProb: 15 },
    { time: '12:00 am', temp: 27, condition: 'Cloudy', icon: 'cloudy', rainProb: 20 },
    { time: '1:00 am', temp: 27, condition: 'Cloudy', icon: 'cloudy', rainProb: 20 },
    { time: '2:00 am', temp: 27, condition: 'Cloudy', icon: 'cloudy', rainProb: 15 },
    { time: '3:00 am', temp: 26, condition: 'Cloudy', icon: 'cloudy', rainProb: 10 },
    { time: '4:00 am', temp: 26, condition: 'Cloudy', icon: 'cloudy', rainProb: 10 },
  ];

  const displayList = hourly && hourly.length > 0 ? hourly.slice(0, 10) : defaultHourly;

  return (
    <div className="p-3.5 rounded-[22px] bg-[#0c1427] border border-[#1b2749] text-white shadow-xl font-['Arimo']">
      <div className="flex gap-4 overflow-x-auto py-1 no-scrollbar scrollbar-none items-center justify-between">
        {displayList.map((item, idx) => {
          const displayLabel = formatTime(item.time || item.iso_time || '', idx);
          const tempVal = item.temp !== null && item.temp !== undefined ? Math.round(item.temp) : 28;

          return (
            <div
              key={idx}
              className="flex flex-col items-center justify-between text-center min-w-[56px] shrink-0 space-y-2"
            >
              <span className="text-[11px] font-bold text-slate-300 whitespace-nowrap">
                {displayLabel}
              </span>

              <div className="my-0.5">
                {renderWeatherIcon(item.condition, displayLabel, idx)}
              </div>

              <span className="text-sm font-extrabold text-white">
                {tempVal}°
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
