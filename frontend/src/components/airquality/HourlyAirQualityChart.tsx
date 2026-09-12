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
        return <TrendingDown className="w-3.5 h-3.5 text-[#006B3C]" />;
      case 'WORSENING':
        return <TrendingUp className="w-3.5 h-3.5 text-[#B42318]" />;
      default:
        return <Minus className="w-3.5 h-3.5 text-[#B7791F]" />;
    }
  };

  const localizedTrend = translateAQITrend(trend || 'STABLE', language);

  const getTrendBadge = () => {
    switch (trend?.toUpperCase()) {
      case 'IMPROVING':
        return (
          <span className="gov-badge gov-badge-success flex items-center gap-1">
            {getTrendIcon()} {localizedTrend}
          </span>
        );
      case 'WORSENING':
        return (
          <span className="gov-badge gov-badge-danger flex items-center gap-1">
            {getTrendIcon()} {localizedTrend}
          </span>
        );
      default:
        return (
          <span className="gov-badge gov-badge-warning flex items-center gap-1">
            {getTrendIcon()} {localizedTrend}
          </span>
        );
    }
  };

  // Find max AQI to scale the visual bar heights
  const maxAqi = Math.max(...displayItems.map((h) => h.aqi || 0), 100);

  return (
    <div className="gov-panel font-sans">
      {/* Panel Header */}
      <div className="gov-panel-header">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#17365D]" />
          <span>{translatePhrase('hourlyTrendTitle', language).toUpperCase()}</span>
        </div>
        {getTrendBadge()}
      </div>

      <div className="p-3 bg-white space-y-2">
        {trendSummary && (
          <p className="text-[11px] text-[#5B6770] font-semibold">
            {trendSummary}
          </p>
        )}

        {/* Horizontal scrollable hourly forecast timeline with sharp bars */}
        <div className="pt-2 pb-1 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 flex gap-2 items-end min-h-[130px] border-b border-[#D6DCE1]">
          {displayItems.map((item, idx) => {
            const color = airQualityService.getCategoryColor(item.category);
            const heightPct = Math.min(Math.max(((item.aqi || 0) / maxAqi) * 100, 18), 100);

            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-end flex-shrink-0 w-11 text-center group cursor-pointer"
              >
                {/* Value on top */}
                <span className="text-[10px] font-bold text-[#1F2933] mb-1">
                  {item.aqi ?? '--'}
                </span>

                {/* Solid Colored Bar */}
                <div
                  className="w-3.5 rounded-none transition-all group-hover:brightness-90"
                  style={{
                    height: `${heightPct * 0.7}px`,
                    backgroundColor: color,
                  }}
                  title={`Hour: ${item.time} | AQI: ${item.aqi} | PM2.5: ${item.pm2_5 ?? '--'} μg/m³`}
                />

                {/* Hour Label */}
                <span className="text-[10px] font-bold text-[#5B6770] mt-1.5 truncate w-full">
                  {item.time}
                </span>

                {/* PM2.5 footnote */}
                {item.pm2_5 != null && (
                  <span className="text-[8px] text-[#8C9BA5] font-semibold truncate">
                    {item.pm2_5.toFixed(0)}µg
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
