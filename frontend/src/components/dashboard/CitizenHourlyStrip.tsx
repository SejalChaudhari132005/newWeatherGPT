import React from 'react';
import {
  Clock,
  ChevronRight,
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudLightning,
  Droplets,
  Wind,
} from 'lucide-react';

interface HourlyItem {
  time: string;
  temp?: number;
  temperature?: number;
  condition?: string;
  weather_code?: number;
  rainProb?: number;
  rain_probability?: number;
  windSpeed?: number;
  wind_speed?: number;
}

interface Props {
  hourly?: HourlyItem[];
}

export const CitizenHourlyStrip: React.FC<Props> = ({ hourly = [] }) => {
  // Render clean vector icon for each hourly block (time-aware)
  const renderWeatherIcon = (conditionStr: string = '', timeStr: string = '') => {
    const c = conditionStr.toLowerCase();
    const t = timeStr.toLowerCase();
    const isNight = t.includes('pm') && !t.includes('12 pm') || t.includes('am') && !t.includes('11 am') && !t.includes('10 am') && !t.includes('9 am') && !t.includes('8 am') && !t.includes('7 am') && !t.includes('6 am');

    if (c.includes('thunder') || c.includes('lightning') || c.includes('storm')) {
      return <CloudLightning className="w-6 h-6 text-amber-500" />;
    }
    if (c.includes('rain') || c.includes('drizzle')) {
      return <CloudRain className="w-6 h-6 text-sky-500" />;
    }
    if (c.includes('cloud') || c.includes('overcast')) {
      return isNight ? (
        <CloudMoon className="w-6 h-6 text-indigo-400" />
      ) : (
        <CloudSun className="w-6 h-6 text-amber-500" />
      );
    }
    return isNight ? (
      <Moon className="w-6 h-6 text-indigo-400" />
    ) : (
      <Sun className="w-6 h-6 text-amber-500" />
    );
  };

  // Fallback realistic timeline if hourly is empty
  const defaultTimeline: HourlyItem[] = [
    { time: 'Now\n09 AM', temp: 32, condition: 'Partly Cloudy', rainProb: 0, windSpeed: 12 },
    { time: '10 AM', temp: 33, condition: 'Sunny', rainProb: 0, windSpeed: 11 },
    { time: '11 AM', temp: 34, condition: 'Sunny', rainProb: 0, windSpeed: 10 },
    { time: '12 PM', temp: 35, condition: 'Sunny', rainProb: 0, windSpeed: 10 },
    { time: '1 PM', temp: 36, condition: 'Sunny', rainProb: 0, windSpeed: 9 },
    { time: '2 PM', temp: 36, condition: 'Sunny', rainProb: 0, windSpeed: 8 },
  ];

  const displayList = hourly.length > 0 ? hourly.slice(0, 8) : defaultTimeline;

  return (
    <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5 font-['Arimo']">
      {/* Header */}
      <div className="flex items-center justify-between gap-1 pb-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="text-xs font-black text-slate-900 tracking-tight">
            Hourly Forecast
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </div>

      {/* Horizontal Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-none">
        {displayList.map((item, idx) => {
          const temp = item.temp ?? item.temperature ?? 32;
          const rain = item.rainProb ?? item.rain_probability ?? 0;
          const wind = item.windSpeed ?? item.wind_speed ?? 10;
          const timeText = item.time.includes('\n') ? item.time : idx === 0 ? `Now\n${item.time}` : item.time;

          return (
            <div
              key={idx}
              className="min-w-[62px] p-2 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center justify-between text-center shrink-0 space-y-1"
            >
              {/* Time */}
              <span className="text-[9px] font-black text-slate-600 uppercase whitespace-pre-line leading-tight">
                {timeText}
              </span>

              {/* Weather Icon */}
              <div className="my-0.5">{renderWeatherIcon(item.condition, timeText)}</div>

              {/* Temp */}
              <span className="text-xs font-black text-slate-900 leading-none">
                {Math.round(temp)}°
              </span>

              {/* Rain prob */}
              <div className="flex items-center gap-0.5 text-[8.5px] font-bold text-sky-600">
                <Droplets className="w-2.5 h-2.5" />
                <span>{rain}%</span>
              </div>

              {/* Wind */}
              <div className="flex items-center gap-0.5 text-[8px] font-semibold text-slate-500">
                <Wind className="w-2.5 h-2.5" />
                <span>{Math.round(wind)} km/h</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
