import React from 'react';
import { HourlyAirQualityItem, TrendDirection } from '../../types/airQuality';
import { airQualityService } from '../../services/airQualityService';
import { useLanguage } from '../../context/LanguageContext';
import {
  translatePhrase,
  translateAQITrend,
} from '../../utils/dashboardTranslator';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

interface Props {
  hourly: HourlyAirQualityItem[];
  trend?: TrendDirection | string;
  trendSummary?: string;
}

export const HourlyAirQualityChart: React.FC<Props> = ({ hourly, trend, trendSummary }) => {
  const { language } = useLanguage();

  if (!hourly || hourly.length === 0) {
    return null;
  }

  // Display first 12 to 24 hours
  const displayItems = hourly.slice(0, 24);

  const getTrendIcon = () => {
    switch (trend?.toUpperCase()) {
      case 'IMPROVING':
        return <TrendingDown className="w-4 h-4 text-emerald-600" />;
      case 'WORSENING':
        return <TrendingUp className="w-4 h-4 text-rose-600" />;
      default:
        return <Minus className="w-4 h-4 text-amber-600" />;
    }
  };

  const localizedTrend = translateAQITrend(trend || 'STABLE', language);

  const getTrendBadge = () => {
    switch (trend?.toUpperCase()) {
      case 'IMPROVING':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200 flex items-center gap-1">
            {getTrendIcon()} {localizedTrend}
          </span>
        );
      case 'WORSENING':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-200 flex items-center gap-1">
            {getTrendIcon()} {localizedTrend}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-200 flex items-center gap-1">
            {getTrendIcon()} {localizedTrend}
          </span>
        );
    }
  };

  // Find max AQI to scale the visual bar heights
  const maxAqi = Math.max(...displayItems.map((h) => h.aqi || 0), 100);

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3 font-['Arimo']">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#004aad]" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            {translatePhrase('hourlyTrendTitle', language)}
          </h3>
        </div>
        {getTrendBadge()}
      </div>

      {trendSummary && (
        <p className="text-[11px] text-slate-600 font-medium">
          {trendSummary}
        </p>
      )}

      {/* Horizontal scrollable hourly forecast timeline */}
      <div className="pt-2 pb-1 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 flex gap-2.5 items-end min-h-[140px]">
        {displayItems.map((item, idx) => {
          const color = airQualityService.getCategoryColor(item.category);
          const heightPct = Math.min(Math.max(((item.aqi || 0) / maxAqi) * 100, 18), 100);

          return (
            <div
              key={idx}
              className="flex flex-col items-center justify-end flex-shrink-0 w-12 text-center group cursor-pointer"
            >
              {/* Value on top */}
              <span className="text-[10px] font-black text-slate-800 mb-1 group-hover:scale-110 transition-transform">
                {item.aqi ?? '--'}
              </span>

              {/* Colored Bar */}
              <div
                className="w-4 sm:w-5 rounded-t-lg transition-all group-hover:brightness-110"
                style={{
                  height: `${heightPct * 0.75}px`,
                  backgroundColor: color,
                  boxShadow: `0 2px 8px ${color}40`,
                }}
                title={`Hour: ${item.time} | AQI: ${item.aqi} | PM2.5: ${item.pm2_5 ?? '--'} μg/m³`}
              />

              {/* Hour Label */}
              <span className="text-[10px] font-bold text-slate-500 mt-2 truncate w-full">
                {item.time}
              </span>

              {/* PM2.5 footnote */}
              {item.pm2_5 != null && (
                <span className="text-[8px] text-slate-400 font-medium truncate">
                  {item.pm2_5.toFixed(0)}µg
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
