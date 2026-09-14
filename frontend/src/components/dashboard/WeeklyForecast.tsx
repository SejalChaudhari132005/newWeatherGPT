import React from 'react';
import { Calendar, CloudRain } from 'lucide-react';
import { getWeatherIconInfo } from '../../utils/weatherIcons';

interface Props {
  weekly: any[];
}

export const WeeklyForecast: React.FC<Props> = ({ weekly }) => {
  const getDayAndDate = (item: any, idx: number) => {
    const targetDate = new Date();
    targetDate.setHours(12, 0, 0, 0);

    if (item?.date && /^\d{4}-\d{2}-\d{2}/.test(item.date)) {
      const parts = item.date.slice(0, 10).split('-');
      targetDate.setFullYear(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      targetDate.setDate(targetDate.getDate() + idx);
    }

    const dayNum = targetDate.getDate();
    const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });
    const enDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayLabel = idx === 0 ? 'TODAY' : idx === 1 ? 'TOMORROW' : enDays[targetDate.getDay()];

    return {
      dateText: `${dayNum} ${monthName}`,
      dayBadge: dayLabel,
    };
  };

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-3 font-['Arimo']">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#004aad] shrink-0" />
          <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">7-Day Weather Outlook</h3>
        </div>
        <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase shrink-0">Open-Meteo</span>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        {weekly.map((item, idx) => {
          const { dateText, dayBadge } = getDayAndDate(item, idx);
          const iconInfo = getWeatherIconInfo(item.weather_code, item.condition);
          const displayIcon = item.icon && item.icon.length <= 4 ? item.icon : iconInfo.emoji;

          return (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800 gap-2"
            >
              <div className="flex items-center gap-1.5 w-24 sm:w-28 shrink-0">
                <span className="font-extrabold text-slate-900 text-xs">{dateText}</span>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-xs uppercase ${
                    idx === 0
                      ? 'bg-[#006B3C] text-white'
                      : idx === 1
                      ? 'bg-[#1E293B] text-white'
                      : 'bg-[#475569] text-white'
                  }`}
                >
                  {dayBadge}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 flex-1 justify-start min-w-0">
                <span className="text-sm sm:text-base shrink-0">{displayIcon}</span>
                <span className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">{item.condition}</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="flex items-center gap-0.5 text-[10px] text-sky-600 font-bold">
                  <CloudRain className="w-3 h-3" />
                  <span>{item.rainProbability ?? item.rainProb ?? 0}%</span>
                </div>
                <div className="text-right text-xs">
                  <span className="font-extrabold text-slate-900">
                    {item.high !== null && item.high !== undefined ? `${item.high}°` : '--'}
                  </span>
                  <span className="text-slate-400 font-normal ml-1">
                    {item.low !== null && item.low !== undefined ? `${item.low}°` : '--'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
