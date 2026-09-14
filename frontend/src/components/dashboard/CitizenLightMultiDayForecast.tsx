import React from 'react';
import {
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
  Sun,
  Droplets,
  Calendar,
} from 'lucide-react';
import { WeatherDailyItem } from '../../types/weather';
import { useLanguage } from '../../context/LanguageContext';
import { translateCondition, translatePhrase } from '../../utils/dashboardTranslator';

interface Props {
  daily?: WeatherDailyItem[];
  onViewDetails?: () => void;
}

export const CitizenLightMultiDayForecast: React.FC<Props> = ({
  daily = [],
  onViewDetails,
}) => {
  const { language } = useLanguage();

  const getLocalizedDay = (idx: number, dateObj: Date): string => {
    if (idx === 0) {
      return language === 'mr' ? 'आज' : language === 'hi' ? 'आज' : 'TODAY';
    }
    if (idx === 1) {
      return language === 'mr' ? 'उद्या' : language === 'hi' ? 'कल' : 'TOMORROW';
    }

    const dayIndex = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const enDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const mrDays = ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
    const hiDays = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

    if (language === 'mr') return mrDays[dayIndex];
    if (language === 'hi') return hiDays[dayIndex];
    return enDays[dayIndex];
  };

  const formatDayLabel = (item?: WeatherDailyItem, idx: number = 0): { dateStr: string; dayTag: string } => {
    // Current real-time local date
    const targetDate = new Date();
    targetDate.setHours(12, 0, 0, 0); // Midday prevents UTC boundary shift

    if (item?.date && /^\d{4}-\d{2}-\d{2}/.test(item.date)) {
      const parts = item.date.slice(0, 10).split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      targetDate.setFullYear(y, m, d);
    } else {
      targetDate.setDate(targetDate.getDate() + idx);
    }

    const dayNum = targetDate.getDate();
    const monthName = targetDate.toLocaleDateString(
      language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-US',
      { month: 'short' }
    );
    const dayTag = getLocalizedDay(idx, targetDate);

    return {
      dateStr: `${dayNum} ${monthName}`,
      dayTag,
    };
  };

  const renderWeatherIcon = (conditionStr: string = '') => {
    const c = conditionStr.toLowerCase();
    if (c.includes('thunder') || c.includes('lightning') || c.includes('storm')) {
      return <CloudLightning className="w-4 h-4 text-purple-700 shrink-0" />;
    }
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) {
      return <CloudRain className="w-4 h-4 text-[#1D5F91] shrink-0" />;
    }
    if (c.includes('partly') || c.includes('scattered')) {
      return <CloudSun className="w-4 h-4 text-[#B7791F] shrink-0" />;
    }
    if (c.includes('cloud') || c.includes('overcast')) {
      return <Cloud className="w-4 h-4 text-[#5B6770] shrink-0" />;
    }
    return <Sun className="w-4 h-4 text-[#B7791F] shrink-0" />;
  };

  const displayList = daily && daily.length > 0 ? daily.slice(0, 7) : [];

  return (
    <div className="gov-panel">
      {/* Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#006B3C]" />
          <span>
            {translatePhrase('multiDayOutlook', language)}
          </span>
        </div>
      </div>

      {/* Structured Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="gov-table min-w-[340px] sm:min-w-full w-full text-left">
          <thead>
            <tr className="bg-[#F1F5F9] border-b border-[#CBD5E1]">
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider">{translatePhrase('dayDate', language)}</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider">{translatePhrase('weatherCondition', language)}</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider text-center">{translatePhrase('rainChance', language)}</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-bold text-[#17365D] uppercase tracking-wider text-right">{translatePhrase('tempRange', language)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-[11px] sm:text-xs">
            {displayList.map((item, idx) => {
              const { dateStr, dayTag } = formatDayLabel(item, idx);
              const lowTemp = item.low !== null && item.low !== undefined ? Math.round(item.low) : 25;
              const highTemp = item.high !== null && item.high !== undefined ? Math.round(item.high) : 30;
              const rainChance = item.rainProbability ?? 0;

              return (
                <tr key={idx} className={idx === 0 ? 'bg-[#F0FDF4]/50' : ''}>
                  {/* Day Label */}
                  <td className="px-2 py-2 sm:px-3 sm:py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="font-bold text-[#1F2933]">{dateStr}</span>
                      <span
                        className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-xs tracking-wider uppercase shadow-2xs ${
                          idx === 0
                            ? 'bg-[#006B3C] text-white'
                            : idx === 1
                            ? 'bg-[#1E293B] text-white'
                            : 'bg-[#334155] text-white'
                        }`}
                      >
                        {dayTag}
                      </span>
                    </div>
                  </td>

                  {/* Condition with Icon */}
                  <td className="px-2 py-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {renderWeatherIcon(item.condition)}
                      <span className="text-[11px] sm:text-xs text-[#1F2933] font-medium capitalize truncate max-w-[120px] sm:max-w-none">
                        {translateCondition(item.condition || 'Partly Cloudy', language)}
                      </span>
                    </div>
                  </td>

                  {/* Rain Probability */}
                  <td className="px-2 py-2 sm:px-3 sm:py-2.5 text-center whitespace-nowrap">
                    {rainChance > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-[11px] sm:text-xs font-black text-[#1D5F91]">
                        <Droplets className="w-3.5 h-3.5 text-[#1D5F91] shrink-0" />
                        {Math.round(rainChance)}%
                      </span>
                    ) : (
                      <span className="text-[11px] sm:text-xs text-[#5B6770]">—</span>
                    )}
                  </td>

                  {/* Temperature */}
                  <td className="px-2 py-2 sm:px-3 sm:py-2.5 text-right font-bold text-[#1F2933] whitespace-nowrap">
                    <span className="text-[#5B6770] font-medium">{lowTemp}°</span> / <span className="font-black text-[#1F2933]">{highTemp}°C</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Outlook footer */}
      <div className="p-2.5 bg-[#F8FAFC] border-t border-[#D6DCE1] flex items-center justify-between text-[11px] text-[#5B6770]">
        <span>{translatePhrase('synopticPrediction', language)}</span>
        <span>{translatePhrase('leadTime7Days', language)}</span>
      </div>
    </div>
  );
};
