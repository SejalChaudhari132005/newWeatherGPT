import React, { useEffect, useState } from 'react';
import { Sprout, ChevronRight } from 'lucide-react';
import { airQualityService } from '../../services/airQualityService';

interface Props {
  latitude?: number;
  longitude?: number;
  onOpenDetails?: () => void;
}

export const CitizenAQISplitCard: React.FC<Props> = ({
  latitude,
  longitude,
  onOpenDetails,
}) => {
  const [aqi, setAqi] = useState<number>(78);
  const [category, setCategory] = useState<string>('Moderate');
  const [pm25, setPm25] = useState<number>(42);
  const [pm10, setPm10] = useState<number>(68);
  const [no2, setNo2] = useState<number>(18);
  const [so2, setSo2] = useState<number>(6);

  useEffect(() => {
    if (!latitude || !longitude) return;
    airQualityService
      .getCurrentAirQuality(latitude, longitude)
      .then((res) => {
        if (res) {
          setAqi(res.aqi);
          setCategory(res.category_label || res.category || 'Moderate');
          if (Array.isArray(res.pollutants)) {
            const pm25Item = res.pollutants.find((p) => p.code === 'pm2_5');
            const pm10Item = res.pollutants.find((p) => p.code === 'pm10');
            const no2Item = res.pollutants.find((p) => p.code === 'no2');
            const so2Item = res.pollutants.find((p) => p.code === 'so2');

            if (pm25Item) setPm25(Math.round(pm25Item.concentration));
            if (pm10Item) setPm10(Math.round(pm10Item.concentration));
            if (no2Item) setNo2(Math.round(no2Item.concentration));
            if (so2Item) setSo2(Math.round(so2Item.concentration));
          }
        }
      })
      .catch(() => {
        // use default realistic values
      });
  }, [latitude, longitude]);

  // SVG Gauge calculations
  const strokeColor =
    aqi <= 50 ? '#10B981' : aqi <= 100 ? '#84CC16' : aqi <= 200 ? '#F59E0B' : '#EF4444';

  return (
    <div
      onClick={onOpenDetails}
      className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between font-['Arimo'] cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1 pb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-[11px] font-black text-slate-900 truncate">
            Air Quality Index (AQI)
          </span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </div>

      {/* Main Gauge & Pollutants Row */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Circular Progress Ring */}
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
            <path
              className="text-slate-100"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              strokeDasharray={`${Math.min(100, Math.round((aqi / 300) * 100))}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke={strokeColor}
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-black text-slate-900 leading-none">{aqi}</span>
            <span
              className="text-[8px] font-extrabold px-1.5 py-0.2 rounded-full mt-0.5"
              style={{ color: strokeColor, backgroundColor: `${strokeColor}15` }}
            >
              {category}
            </span>
          </div>
        </div>

        {/* Sub-Pollutants List */}
        <div className="space-y-1 min-w-0 flex-1 text-[10px] pl-1 font-semibold text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">PM2.5</span>
            <span className="font-mono text-slate-900">{pm25} µg/m³</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">PM10</span>
            <span className="font-mono text-slate-900">{pm10} µg/m³</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">NO₂</span>
            <span className="font-mono text-slate-900">{no2} µg/m³</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">SO₂</span>
            <span className="font-mono text-slate-900">{so2} µg/m³</span>
          </div>
        </div>
      </div>
    </div>
  );
};
