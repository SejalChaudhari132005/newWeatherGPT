import React from 'react';
import { Wind, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';
import { airQualityService } from '../../services/airQualityService';

interface Props {
  airQuality?: {
    aqi?: number;
    category?: string;
    category_label?: string;
    primary_pollutant_name?: string;
    pm2_5?: number;
    pm10?: number;
    aqi_scale?: string;
  };
  locationName?: string;
}

export const ChatAirQualityCard: React.FC<Props> = ({ airQuality, locationName }) => {
  if (!airQuality || airQuality.aqi === undefined || airQuality.aqi === null) return null;

  const aqi = airQuality.aqi;
  const category = airQuality.category_label || airQuality.category || 'Moderate';
  const badgeStyle = airQualityService.getCategoryBadgeStyle(airQuality.category || category);
  const color = airQualityService.getCategoryColor(airQuality.category || category);

  return (
    <div className="my-2.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs font-['Arimo'] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">Air Quality Index</div>
            {locationName && (
              <div className="text-[10px] font-bold text-slate-500">{locationName}</div>
            )}
          </div>
        </div>

        <span
          className="px-2.5 py-1 rounded-full text-xs font-black tracking-wide shadow-2xs"
          style={{
            backgroundColor: badgeStyle.bg,
            color: badgeStyle.text,
            border: `1px solid ${badgeStyle.border}`,
          }}
        >
          {category}
        </span>
      </div>

      {/* Main Metric Strip */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-xl bg-white border border-slate-200/80">
          <span className="text-[9px] font-bold text-slate-400 uppercase block">AQI</span>
          <span className="text-xl sm:text-2xl font-black tracking-tight" style={{ color }}>
            {aqi}
          </span>
          <span className="text-[8px] font-bold text-slate-500 block">/ 100+</span>
        </div>

        <div className="p-2 rounded-xl bg-white border border-slate-200/80">
          <span className="text-[9px] font-bold text-slate-400 uppercase block">PM2.5</span>
          <span className="text-base sm:text-lg font-black text-slate-900 block">
            {airQuality.pm2_5 != null ? `${airQuality.pm2_5}` : '--'}
          </span>
          <span className="text-[8px] font-bold text-slate-500">μg/m³</span>
        </div>

        <div className="p-2 rounded-xl bg-white border border-slate-200/80">
          <span className="text-[9px] font-bold text-slate-400 uppercase block">PM10</span>
          <span className="text-base sm:text-lg font-black text-slate-900 block">
            {airQuality.pm10 != null ? `${airQuality.pm10}` : '--'}
          </span>
          <span className="text-[8px] font-bold text-slate-500">μg/m³</span>
        </div>
      </div>
    </div>
  );
};
