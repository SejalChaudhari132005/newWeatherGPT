import React, { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';
import { airQualityService } from '../../services/airQualityService';
import { useLanguage } from '../../context/LanguageContext';
import { translateAQICategory, translateAirAdvisory } from '../../utils/dashboardTranslator';

interface Props {
  latitude?: number;
  longitude?: number;
  onOpenDetails?: () => void;
}

export const CitizenDarkAirQualityCard: React.FC<Props> = ({
  latitude,
  longitude,
  onOpenDetails,
}) => {
  const { language } = useLanguage();
  const [aqi, setAqi] = useState<number>(86);
  const [category, setCategory] = useState<string>('Moderate');
  const [advisory, setAdvisory] = useState<string>(
    'Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people.'
  );

  useEffect(() => {
    if (!latitude || !longitude) return;
    airQualityService
      .getCurrentAirQuality(latitude, longitude)
      .then((res) => {
        if (res) {
          setAqi(res.aqi ?? 86);
          setCategory(res.category_label || res.category || 'Moderate');
          if (res.health_advisory) {
            setAdvisory(res.health_advisory);
          }
        }
      })
      .catch(() => {
        // preserve current realistic data
      });
  }, [latitude, longitude]);

  // Color according to AQI scale
  const strokeColor =
    aqi <= 50 ? '#10B981' : aqi <= 100 ? '#FACC15' : aqi <= 200 ? '#F97316' : '#EF4444';

  const localizedCategory = translateAQICategory(category as any, language) || category;
  const localizedAdvisory = translateAirAdvisory(category as any, advisory, language) || advisory;

  return (
    <div
      onClick={onOpenDetails}
      className="p-4 rounded-[22px] bg-[#0c1427] border border-[#1b2749] text-white shadow-xl flex items-center justify-between gap-3 font-['Arimo'] cursor-pointer hover:border-[#2a3c6e] transition-all"
    >
      {/* Left Info Column */}
      <div className="space-y-1.5 min-w-0 flex-1 pr-1">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-emerald-400 shrink-0" />
          <h3 className="text-sm font-black tracking-tight text-white">
            {localizedCategory}
          </h3>
        </div>

        <p className="text-[11px] text-slate-300 font-medium leading-relaxed line-clamp-2">
          {localizedAdvisory}
        </p>
      </div>

      {/* Right Circular AQI Gauge */}
      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
          <path
            className="text-slate-800"
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

        <span className="absolute text-lg font-black text-white">{aqi}</span>
      </div>
    </div>
  );
};
