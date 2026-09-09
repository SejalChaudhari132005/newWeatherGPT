import React from 'react';
import { WeatherContextPayload } from '../../types/chat';
import { getWeatherIconInfo } from '../../utils/weatherIcons';

interface Props {
  forecast?: WeatherContextPayload['forecast'];
}

export const HourlyForecastCard: React.FC<Props> = ({ forecast }) => {
  if (!forecast?.hourly || forecast.hourly.length === 0) return null;

  return (
    <div className="my-2.5 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs font-['Arimo']">
      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
        Upcoming Hours (Open-Meteo)
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {forecast.hourly.map((h, idx) => {
          const iconInfo = getWeatherIconInfo(undefined, h.condition);
          return (
            <div
              key={idx}
              className="px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-between min-w-[58px] text-center shrink-0"
            >
              <span className="text-[10px] font-bold text-slate-500">{h.time}</span>
              <span className="text-base my-0.5">{iconInfo.emoji}</span>
              <span className="text-xs font-black text-slate-800">{h.temp}°</span>
              {h.rain_probability > 0 && (
                <span className="text-[9px] font-extrabold text-[#004aad]">
                  {h.rain_probability}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
