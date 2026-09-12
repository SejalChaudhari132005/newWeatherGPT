import React, { useEffect, useState } from 'react';
import { Activity, ArrowRight } from 'lucide-react';
import { airQualityService } from '../../services/airQualityService';
import { useLanguage } from '../../context/LanguageContext';
import { translateAQICategory, translateAirAdvisory, translatePhrase } from '../../utils/dashboardTranslator';

interface Props {
  latitude?: number;
  longitude?: number;
  onOpenDetails?: () => void;
}

export const CitizenLightAirQualityCard: React.FC<Props> = ({
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
      .catch(() => {});
  }, [latitude, longitude]);

  const localizedCategory = translateAQICategory(category as any, language) || category;
  const localizedAdvisory = translateAirAdvisory(category as any, advisory, language) || advisory;

  const getAqiBadge = (val: number) => {
    if (val <= 50) return { label: translatePhrase('good', language) || 'GOOD', class: 'gov-badge-success' };
    if (val <= 100) return { label: translatePhrase('satisfactory', language) || 'SATISFACTORY', class: 'gov-badge-success' };
    if (val <= 200) return { label: translatePhrase('moderate', language) || 'MODERATE', class: 'gov-badge-warning' };
    if (val <= 300) return { label: translatePhrase('poor', language) || 'POOR', class: 'gov-badge-warning' };
    if (val <= 400) return { label: translatePhrase('veryPoor', language) || 'VERY POOR', class: 'gov-badge-danger' };
    return { label: translatePhrase('severe', language) || 'SEVERE', class: 'gov-badge-danger' };
  };

  const badge = getAqiBadge(aqi);

  return (
    <div
      onClick={onOpenDetails}
      className="gov-panel p-3.5 space-y-2.5 cursor-pointer hover:border-[#17365D] transition-colors"
    >
      <div className="flex items-center justify-between border-b border-[#D6DCE1] pb-2">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#006B3C]" />
          <h3 className="text-xs font-bold uppercase text-[#17365D] tracking-wider">
            {translatePhrase('naqiTitle', language)}
          </h3>
        </div>

        <span className={`gov-badge ${badge.class}`}>
          {badge.label} (AQI {aqi})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
        <div className="sm:col-span-2 space-y-1">
          <div className="text-xs font-bold text-[#1F2933]">
            {translatePhrase('status', language)}: {localizedCategory} {translatePhrase('airQuality', language)}
          </div>
          <p className="text-[11px] text-[#5B6770] leading-relaxed">
            {localizedAdvisory}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 border-[#D6DCE1] pt-2 sm:pt-0">
          <div className="text-right">
            <div className="text-[10px] text-[#5B6770] uppercase">
              {translatePhrase('indexScore', language)}
            </div>
            <div className="text-xl font-black text-[#17365D]">{aqi} / 500</div>
          </div>
          <button className="gov-btn-secondary px-2.5 py-1 text-[11px] flex items-center gap-1 font-bold">
            <span>{translatePhrase('details', language)}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
