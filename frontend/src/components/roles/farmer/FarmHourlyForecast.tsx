import React from 'react';
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  CloudLightning,
  ChevronRight,
  Droplets,
  Clock,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { translatePhrase } from '../../../utils/dashboardTranslator';

export interface HourlyForecastItem {
  time: string;
  hour: number;
  temp: number;
  condition: string;
  rainProbability?: number;
  precipitation?: number;
  weatherCode?: number;
}

interface FarmHourlyForecastProps {
  items: HourlyForecastItem[];
  onViewAll?: () => void;
}

export const FarmHourlyForecast: React.FC<FarmHourlyForecastProps> = ({
  items,
  onViewAll,
}) => {
  const { language } = useLanguage();

  const getIcon = (code?: number, cond?: string) => {
    const c = (cond || '').toLowerCase();
    if ((code && code >= 95) || c.includes('thunder') || c.includes('storm')) {
      return <CloudLightning className="w-5 h-5 text-purple-700 stroke-[2]" />;
    }
    if ((code && ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))) || c.includes('heavy rain') || c.includes('shower')) {
      return <CloudRain className="w-5 h-5 text-[#1D5F91] stroke-[2]" />;
    }
    if ((code && code >= 51 && code <= 57) || c.includes('rain') || c.includes('drizzle')) {
      return <CloudRain className="w-5 h-5 text-[#1D5F91] stroke-[2]" />;
    }
    if ((code && code >= 1 && code <= 3) || c.includes('partly') || c.includes('scattered')) {
      return <CloudSun className="w-5 h-5 text-[#B7791F] stroke-[2]" />;
    }
    if ((code === 3) || c.includes('overcast') || c.includes('cloud')) {
      return <Cloud className="w-5 h-5 text-[#5B6770] stroke-[2]" />;
    }
    if ((code === 0) || c.includes('clear') || c.includes('sun')) {
      return <Sun className="w-5 h-5 text-[#B7791F] stroke-[2]" />;
    }
    return <CloudSun className="w-5 h-5 text-[#B7791F] stroke-[2]" />;
  };

  const formatTimeLabel = (timeStr: string): string => {
    if (timeStr === 'NOW' || timeStr.toLowerCase() === 'now') {
      return language === 'mr' ? 'आत्ता' : language === 'hi' ? 'अभी' : 'NOW';
    }
    return timeStr;
  };

  const displayList = items.length > 0 ? items.slice(0, 12) : [];

  return (
    <div className="gov-panel">
      {/* Official Section Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#006B3C]" />
          <span>{translatePhrase('hourlyForecast', language).toUpperCase()}</span>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-[11px] font-bold text-[#006B3C] hover:underline cursor-pointer uppercase tracking-wider"
          >
            <span>{translatePhrase('viewAll', language)}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="p-3">
        {/* Horizontal Strip of Rectangular Time Cells */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {displayList.map((item, idx) => {
            const isRainy = (item.rainProbability ?? 0) > 30 || (item.precipitation ?? 0) > 0.1;
            const isNow = idx === 0;

            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-between py-2 px-2.5 rounded-xs min-w-[72px] sm:min-w-[80px] shrink-0 border transition-all ${
                  isNow
                    ? 'bg-[#EBF5EE] border-[#006B3C] border-2 shadow-none'
                    : 'bg-[#F8FAFC] border-[#D6DCE1] hover:bg-[#F1F5F9]'
                }`}
              >
                <span className={`text-[11px] font-bold tracking-tight mb-1 ${isNow ? 'text-[#006B3C]' : 'text-[#5B6770]'}`}>
                  {formatTimeLabel(item.time)}
                </span>

                <div className="my-1">
                  {getIcon(item.weatherCode, item.condition)}
                </div>

                <span className="text-sm font-bold text-[#1F2933] mt-0.5">
                  {Math.round(item.temp)}°C
                </span>

                <div className="min-h-[16px] flex items-center mt-1">
                  {isRainy ? (
                    <div className="flex items-center gap-0.5 text-[10px] font-bold text-[#1D5F91]">
                      <Droplets className="w-2.5 h-2.5 text-[#1D5F91]" />
                      <span>{Math.round(item.rainProbability ?? 0)}%</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#5B6770] font-medium">0%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
