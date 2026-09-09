import React from 'react';
import { Clock } from 'lucide-react';
import { getWeatherIconInfo } from '../../utils/weatherIcons';

interface Props {
  hourly: any[];
}

export const HourlyForecast: React.FC<Props> = ({ hourly }) => {
  const highRiskItem = hourly.find(item => (item.rainProb || 0) >= 60);

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-slate-900 text-white shadow-xl space-y-2.5 sm:space-y-3 font-['Arimo']">
      <div className="flex items-center justify-between text-xs font-extrabold px-1 gap-2">
        <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
          <Clock className="w-4 h-4 text-[#38b6ff] shrink-0" />
          <span className="truncate">24-Hour Forecast</span>
        </div>
        <span className="text-[9px] sm:text-[10px] text-[#38b6ff] uppercase tracking-wider font-bold shrink-0">
          {highRiskItem ? `Rain Expected around ${highRiskItem.time}` : 'Live 24h Timeline'}
        </span>
      </div>

      <div className="flex gap-2 sm:gap-2.5 overflow-x-auto snap-x snap-mandatory py-1 no-scrollbar scrollbar-none">
        {hourly.map((item, idx) => {
          const iconInfo = getWeatherIconInfo(item.weather_code, item.condition);
          const displayIcon = item.icon && item.icon.length <= 4 ? item.icon : iconInfo.emoji;

          return (
            <div
              key={idx}
              className={`min-w-[70px] sm:min-w-[76px] snap-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col items-center justify-between text-center transition-all shrink-0 border ${
                item.highlight
                  ? 'bg-[#004aad] text-white border-[#38b6ff] shadow-lg scale-105'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
              }`}
            >
              <span className="text-[10px] font-extrabold uppercase">{item.time}</span>
              <span className="text-lg sm:text-xl my-1">{displayIcon}</span>
              <span className="text-xs sm:text-sm font-black">
                {item.temp !== null && item.temp !== undefined ? `${item.temp}°C` : '--'}
              </span>
              <span
                className={`text-[8px] sm:text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded-full ${
                  item.highlight ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-sky-200'
                }`}
              >
                {item.rainProb ?? 0}% rain
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
