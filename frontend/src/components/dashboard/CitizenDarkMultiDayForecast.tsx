import React from 'react';
import {
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
  Sun,
} from 'lucide-react';
import { WeatherDailyItem } from '../../types/weather';

interface Props {
  daily?: WeatherDailyItem[];
  onViewDetails?: () => void;
}

export const CitizenDarkMultiDayForecast: React.FC<Props> = ({
  daily = [],
  onViewDetails,
}) => {
  // Format day label: "10 Sept Today", "11 Sept Tomorrow", "12 Sept Sat"
  const formatDayLabel = (item: WeatherDailyItem, idx: number): string => {
    let dateObj: Date;

    if (item.date) {
      dateObj = new Date(item.date);
    } else {
      dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + idx);
    }

    const dayNum = dateObj.getDate();
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

    if (idx === 0) {
      return `${dayNum} ${monthName} Today`;
    }
    if (idx === 1) {
      return `${dayNum} ${monthName} Tomorrow`;
    }
    return `${dayNum} ${monthName} ${weekday}`;
  };

  const renderWeatherIcon = (conditionStr: string = '') => {
    const c = conditionStr.toLowerCase();
    if (c.includes('thunder') || c.includes('lightning') || c.includes('storm')) {
      return <CloudLightning className="w-5 h-5 text-amber-400" />;
    }
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) {
      return <CloudRain className="w-5 h-5 text-sky-400" />;
    }
    if (c.includes('partly') || c.includes('scattered')) {
      return <CloudSun className="w-5 h-5 text-amber-300" />;
    }
    if (c.includes('cloud') || c.includes('overcast')) {
      return <Cloud className="w-5 h-5 text-slate-300" />;
    }
    return <Sun className="w-5 h-5 text-amber-400" />;
  };

  // Fallback 7-day forecast if API is syncing
  const defaultDaily: WeatherDailyItem[] = [
    { day: 'Today', date: '', high: 33, low: 26, condition: 'Cloudy', icon: 'cloudy', rainProbability: 20, humidity: 75 },
    { day: 'Tomorrow', date: '', high: 33, low: 26, condition: 'Partly Cloudy', icon: 'partly-cloudy', rainProbability: 15, humidity: 70 },
    { day: 'Sat', date: '', high: 31, low: 26, condition: 'Light Rain', icon: 'rain', rainProbability: 60, humidity: 85 },
    { day: 'Sun', date: '', high: 28, low: 25, condition: 'Moderate Rain', icon: 'rain', rainProbability: 75, humidity: 90 },
    { day: 'Mon', date: '', high: 29, low: 25, condition: 'Showers', icon: 'rain', rainProbability: 65, humidity: 88 },
    { day: 'Tue', date: '', high: 30, low: 26, condition: 'Showers', icon: 'rain', rainProbability: 55, humidity: 82 },
    { day: 'Wed', date: '', high: 31, low: 26, condition: 'Light Rain', icon: 'rain', rainProbability: 40, humidity: 80 },
  ];

  const displayList = daily && daily.length > 0 ? daily.slice(0, 7) : defaultDaily;

  return (
    <div className="p-4 rounded-[22px] bg-[#0c1427] border border-[#1b2749] text-white shadow-xl space-y-3 font-['Arimo']">
      <h3 className="text-xs font-bold text-slate-300">
        Multi-day forecast
      </h3>

      <div className="space-y-3.5 pt-1">
        {displayList.map((item, idx) => {
          const dayLabel = formatDayLabel(item, idx);
          const lowTemp = item.low !== null && item.low !== undefined ? Math.round(item.low) : 26;
          const highTemp = item.high !== null && item.high !== undefined ? Math.round(item.high) : 33;

          return (
            <div
              key={idx}
              className="flex items-center justify-between text-xs font-semibold text-slate-200"
            >
              {/* Day Label */}
              <span className="w-36 font-bold truncate text-white/90">
                {dayLabel}
              </span>

              {/* Weather Icon */}
              <div className="flex-1 flex justify-center">
                {renderWeatherIcon(item.condition)}
              </div>

              {/* Low / High Range */}
              <span className="w-20 text-right font-extrabold text-white">
                {lowTemp}° / {highTemp}°
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom View Details Action */}
      <button
        onClick={onViewDetails}
        className="w-full mt-2 py-2.5 rounded-xl bg-[#172547] hover:bg-[#20325d] text-white text-xs font-black transition-colors cursor-pointer shadow-xs"
      >
        View details
      </button>
    </div>
  );
};
