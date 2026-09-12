import React from 'react';
import { PollutantItem } from '../../types/airQuality';
import { airQualityService } from '../../services/airQualityService';
import { useLanguage } from '../../context/LanguageContext';
import {
  translatePhrase,
  translateAQICategory,
  translatePollutant,
} from '../../utils/dashboardTranslator';
import { Activity, CloudFog, Sparkles, Flame, Zap, Droplets, Wind } from 'lucide-react';

interface Props {
  pollutants: PollutantItem[];
  primaryCode?: string;
}

export const PollutantBreakdown: React.FC<Props> = ({ pollutants, primaryCode }) => {
  const { language } = useLanguage();

  if (!pollutants || pollutants.length === 0) {
    return null;
  }

  const getPollutantIcon = (code: string = '') => {
    const c = code.toLowerCase();
    if (c.includes('pm2') || c.includes('pm10') || c.includes('dust')) {
      return <CloudFog className="w-3.5 h-3.5 text-[#1D5F91]" />;
    }
    if (c.includes('o3') || c.includes('ozone')) {
      return <Sparkles className="w-3.5 h-3.5 text-[#006B3C]" />;
    }
    if (c.includes('no2') || c.includes('nitrogen')) {
      return <Flame className="w-3.5 h-3.5 text-[#B7791F]" />;
    }
    if (c.includes('so2') || c.includes('sulfur')) {
      return <Zap className="w-3.5 h-3.5 text-[#B42318]" />;
    }
    if (c.includes('co')) {
      return <Droplets className="w-3.5 h-3.5 text-[#17365D]" />;
    }
    return <Wind className="w-3.5 h-3.5 text-[#006B3C]" />;
  };

  const getBadgeClass = (category?: string) => {
    switch ((category || '').toUpperCase()) {
      case 'GOOD':
      case 'FAIR':
        return 'gov-badge-success';
      case 'MODERATE':
        return 'gov-badge-warning';
      case 'POOR':
      case 'UNHEALTHY':
      case 'VERY_POOR':
      case 'HAZARDOUS':
        return 'gov-badge-danger';
      default:
        return 'gov-badge-info';
    }
  };

  return (
    <div className="gov-panel font-sans">
      {/* Panel Header */}
      <div className="gov-panel-header">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#17365D]" />
          <span>{translatePhrase('keyPollutantBreakdown', language).toUpperCase()}</span>
        </div>
        <span className="text-[10px] font-bold text-[#5B6770]">
          CPCB / CAMS Standards
        </span>
      </div>

      {/* Grid of Pollutant Telemetry Cards */}
      <div className="p-3 bg-white">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {pollutants.map((pollutant) => {
            const isPrimary = pollutant.code === primaryCode || pollutant.is_primary;
            const localizedName = translatePollutant(pollutant.code || pollutant.name, language);
            const localizedCategory = translateAQICategory(pollutant.category, language);
            const badgeClass = getBadgeClass(pollutant.category);

            return (
              <div
                key={pollutant.code}
                className={`p-2.5 bg-[#F8FAFC] border rounded-xs transition-all relative flex flex-col justify-between ${
                  isPrimary
                    ? 'border-[#17365D] bg-slate-50 border-l-3 border-l-[#17365D]'
                    : 'border-[#D6DCE1]'
                }`}
              >
                {isPrimary && (
                  <div className="absolute top-1.5 right-1.5">
                    <span className="px-1 py-0.2 bg-[#17365D] text-white text-[8px] font-black uppercase rounded-xs">
                      {translatePhrase('primaryPollutant', language)}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded-xs bg-white border border-[#D6DCE1]">
                      {getPollutantIcon(pollutant.code)}
                    </div>
                    <span className="text-xs font-bold text-[#17365D] truncate">
                      {localizedName}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#5B6770] font-medium mt-1 line-clamp-1">
                    {pollutant.description || localizedName}
                  </p>
                </div>

                <div className="mt-2.5 pt-1.5 border-t border-[#D6DCE1] flex items-baseline justify-between">
                  <div>
                    <span className="text-base font-bold text-[#1F2933]">
                      {pollutant.concentration != null ? pollutant.concentration.toFixed(1) : '--'}
                    </span>
                    <span className="text-[10px] font-bold text-[#5B6770] ml-1">
                      {pollutant.unit}
                    </span>
                  </div>

                  <span className={`gov-badge ${badgeClass} text-[9px]`}>
                    {localizedCategory}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
