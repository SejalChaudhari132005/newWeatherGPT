import React from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudLightning,
  Clock,
} from 'lucide-react';
import { WeatherHourlyItem } from '../../types/weather';
import { useLanguage } from '../../context/LanguageContext';
import { translateCondition, translatePhrase } from '../../utils/dashboardTranslator';

interface Props {
  hourly?: WeatherHourlyItem[];
  currentTemp?: number;
}

export const CitizenLightHourlyStrip: React.FC<Props> = ({ hourly = [], currentTemp = 25 }) => {
  const { language } = useLanguage();
  const currentHour = new Date().getHours();

  const getHourLabel = (hour24: number, isNow: boolean): string => {
    if (isNow) return translatePhrase('now', language) || 'NOW';
    const h = hour24 % 24;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:00 ${period}`;
  };

  const isNightHour = (h24: number): boolean => {
    const h = h24 % 24;
    return h < 6 || h >= 19;
  };

  const renderWeatherIcon = (conditionStr: string = '', h24: number) => {
    const c = conditionStr.toLowerCase();
    const isNight = isNightHour(h24);

    if (c.includes('thunder') || c.includes('lightning') || c.includes('storm')) {
      return <CloudLightning className="w-5 h-5 text-[#B7791F]" />;
    }
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) {
      return <CloudRain className="w-5 h-5 text-[#1D5F91]" />;
    }
    if (c.includes('partly') || c.includes('scattered')) {
      return isNight ? (
        <CloudMoon className="w-5 h-5 text-[#17365D]" />
      ) : (
        <CloudSun className="w-5 h-5 text-[#B7791F]" />
      );
    }
    if (c.includes('cloud') || c.includes('overcast') || c.includes('fog') || c.includes('mist')) {
      return isNight ? (
        <CloudMoon className="w-5 h-5 text-[#17365D]" />
      ) : (
        <CloudSun className="w-5 h-5 text-[#B7791F]" />
      );
    }
    return isNight ? (
      <Moon className="w-5 h-5 text-[#17365D]" />
    ) : (
      <Sun className="w-5 h-5 text-[#B7791F]" />
    );
  };

  const timelineSlots = Array.from({ length: 8 }).map((_, idx) => {
    const targetHour = (currentHour + idx) % 24;
    const isNow = idx === 0;
    const timeLabel = getHourLabel(targetHour, isNow);

    let matchedItem: WeatherHourlyItem | undefined;
    if (hourly && hourly.length > 0) {
      if (idx < hourly.length) {
        matchedItem = hourly[idx];
      }
    }

    const temp =
      isNow && currentTemp != null
        ? currentTemp
        : matchedItem?.temp !== null && matchedItem?.temp !== undefined
        ? matchedItem.temp
        : Math.round(currentTemp - idx * 0.3);

    const condition = matchedItem?.condition || (isNow ? 'Partly Cloudy' : 'Cloudy');

    return {
      targetHour,
      timeLabel,
      temp: Math.round(temp),
      condition,
    };
  });

  return (
    <div className="gov-panel">
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#006B3C]" />
          <span>{translatePhrase('diurnalHourlyForecast', language)}</span>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <div className="grid grid-cols-8 divide-x divide-[#D6DCE1] min-w-[560px] bg-white text-center">
          {timelineSlots.map((slot, idx) => {
            const isNow = idx === 0;
            return (
              <div
                key={idx}
                className={`p-2.5 flex flex-col items-center justify-between space-y-1.5 ${
                  isNow ? 'bg-[#F0FDF4]' : 'hover:bg-[#F8FAFC]'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isNow ? 'text-[#006B3C] font-black' : 'text-[#5B6770]'
                  }`}
                >
                  {slot.timeLabel}
                </span>

                <div className="my-1 flex items-center justify-center">
                  {renderWeatherIcon(slot.condition, slot.targetHour)}
                </div>

                <span className={`text-xs font-bold ${isNow ? 'text-[#17365D]' : 'text-[#1F2933]'}`}>
                  {slot.temp}°C
                </span>

                <span className="text-[9px] text-[#5B6770] truncate max-w-[60px]" title={translateCondition(slot.condition, language)}>
                  {translateCondition(slot.condition, language)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
