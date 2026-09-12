import React from 'react';
import { CloudRain, Wind, Droplets, Eye, Gauge, Sun, CloudSun, MapPin } from 'lucide-react';
import { WeatherContextPayload } from '../../types/chat';
import { useLanguage } from '../../context/LanguageContext';
import { translateCondition } from '../../utils/dashboardTranslator';

interface Props {
  weather: WeatherContextPayload['current_weather'];
  locationName?: string;
  compact?: boolean;
}

export const WeatherSummaryCard: React.FC<Props> = ({ weather, locationName, compact }) => {
  const { language } = useLanguage();

  if (!weather || weather.temperature === undefined || weather.temperature === null) return null;

  const conditionText = translateCondition(weather.condition || 'Clear Sky', language);
  const feelsLikeText = language === 'mr' ? 'जाणवणारे तापमान' : language === 'hi' ? 'महसूस हो रहा है' : 'Feels like';
  const rainLabel = language === 'mr' ? 'पाऊस' : language === 'hi' ? 'बारिश' : 'Rain';
  const humidityLabel = language === 'mr' ? 'आर्द्रता' : language === 'hi' ? 'आर्द्रता' : 'Humidity';
  const windLabel = language === 'mr' ? 'वारा' : language === 'hi' ? 'हवा' : 'Wind';
  const visibilityLabel = language === 'mr' ? 'दृश्यता' : language === 'hi' ? 'दृश्यता' : 'Visibility';
  const uvLabel = language === 'mr' ? 'यूव्ही' : language === 'hi' ? 'यूवी' : 'UV Index';
  const pressureLabel = language === 'mr' ? 'दाब' : language === 'hi' ? 'दबाव' : 'Pressure';

  return (
    <div className={`my-2 gov-panel p-3 space-y-2.5 ${compact ? 'max-w-xs' : ''}`}>
      <div className={`flex items-center justify-between ${!compact ? 'pb-2 border-b border-[#D6DCE1]' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F8FAFC] text-[#006B3C] border border-[#D6DCE1] flex items-center justify-center shrink-0">
            <CloudSun className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#17365D] uppercase tracking-wide">{conditionText}</div>
            {locationName && (
              <div className="text-[10px] text-[#5B6770] flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-[#006B3C]" />
                <span>{locationName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-black text-[#17365D]">
            {weather.temperature}°C
          </div>
          <div className="text-[10px] text-[#5B6770]">
            {feelsLikeText} {weather.feels_like}°C
          </div>
        </div>
      </div>

      {/* Grid of Key Meteorological Metrics */}
      {!compact && (
        <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-[#D6DCE1] border border-[#D6DCE1] bg-[#F8FAFC] text-center">
          {weather.rain_probability !== undefined && (
            <div className="p-1.5 flex flex-col items-center justify-center">
              <CloudRain className="w-3.5 h-3.5 text-[#1D5F91] mb-0.5" />
              <span className="text-[9px] font-bold text-[#5B6770] uppercase">{rainLabel}</span>
              <span className="text-xs font-bold text-[#1F2933]">{weather.rain_probability}%</span>
            </div>
          )}

          {weather.humidity !== undefined && (
            <div className="p-1.5 flex flex-col items-center justify-center">
              <Droplets className="w-3.5 h-3.5 text-[#006B3C] mb-0.5" />
              <span className="text-[9px] font-bold text-[#5B6770] uppercase">{humidityLabel}</span>
              <span className="text-xs font-bold text-[#1F2933]">{weather.humidity}%</span>
            </div>
          )}

          {weather.wind_speed !== undefined && (
            <div className="p-1.5 flex flex-col items-center justify-center">
              <Wind className="w-3.5 h-3.5 text-[#17365D] mb-0.5" />
              <span className="text-[9px] font-bold text-[#5B6770] uppercase">{windLabel}</span>
              <span className="text-xs font-bold text-[#1F2933]">{weather.wind_speed} km/h</span>
            </div>
          )}

          {weather.visibility !== undefined && (
            <div className="p-1.5 flex flex-col items-center justify-center">
              <Eye className="w-3.5 h-3.5 text-[#17365D] mb-0.5" />
              <span className="text-[9px] font-bold text-[#5B6770] uppercase">{visibilityLabel}</span>
              <span className="text-xs font-bold text-[#1F2933]">{weather.visibility} km</span>
            </div>
          )}

          {weather.uv_index !== undefined && (
            <div className="p-1.5 flex flex-col items-center justify-center">
              <Sun className="w-3.5 h-3.5 text-[#B7791F] mb-0.5" />
              <span className="text-[9px] font-bold text-[#5B6770] uppercase">{uvLabel}</span>
              <span className="text-xs font-bold text-[#1F2933]">{weather.uv_index}</span>
            </div>
          )}

          {weather.pressure !== undefined && (
            <div className="p-1.5 flex flex-col items-center justify-center">
              <Gauge className="w-3.5 h-3.5 text-[#1D5F91] mb-0.5" />
              <span className="text-[9px] font-bold text-[#5B6770] uppercase">{pressureLabel}</span>
              <span className="text-xs font-bold text-[#1F2933]">{weather.pressure} hPa</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
