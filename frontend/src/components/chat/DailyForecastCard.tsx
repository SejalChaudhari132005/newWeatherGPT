import React from 'react';
import { CloudRain } from 'lucide-react';
import { WeatherContextPayload } from '../../types/chat';
import { getWeatherIconInfo } from '../../utils/weatherIcons';

interface Props {
  forecast?: WeatherContextPayload['forecast'];
}

export const DailyForecastCard: React.FC<Props> = ({ forecast }) => {
  if (!forecast?.daily || forecast.daily.length === 0) return null;

  return (
    <div className="my-2.5 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs font-['Arimo']">
      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
        Multi-Day Outlook
      </div>

      <div className="space-y-2">
        {forecast.daily.map((day, idx) => {
          const iconInfo = getWeatherIconInfo(undefined, day.condition);
          return (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100/80 text-xs font-bold text-slate-800"
            >
              <div className="w-20 font-black text-slate-900">
                {day.day} <span className="text-[10px] font-semibold text-slate-400">({day.date})</span>
              </div>

              <div className="flex items-center gap-1.5 flex-1 px-2">
                <span className="text-base">{iconInfo.emoji}</span>
                <span className="text-[11px] text-slate-600 truncate">{day.condition}</span>
              </div>

              {day.rain_probability > 0 && (
                <div className="flex items-center gap-1 text-[11px] font-black text-[#004aad] px-2">
                  <CloudRain className="w-3 h-3 text-[#38b6ff]" />
                  <span>{day.rain_probability}%</span>
                </div>
              )}

              <div className="text-right font-black text-slate-900 w-16">
                <span>{day.high}°</span> <span className="text-slate-400 font-semibold">{day.low}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
