import React from 'react';
import { PollutantItem } from '../../types/airQuality';
import { airQualityService } from '../../services/airQualityService';
import { useLanguage } from '../../context/LanguageContext';
import {
  translatePhrase,
  translateAQICategory,
  translatePollutant,
} from '../../utils/dashboardTranslator';
import { Activity } from 'lucide-react';

interface Props {
  pollutants: PollutantItem[];
  primaryCode?: string;
}

export const PollutantBreakdown: React.FC<Props> = ({ pollutants, primaryCode }) => {
  const { language } = useLanguage();

  if (!pollutants || pollutants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 font-['Arimo']">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-[#004aad]" />
          {translatePhrase('keyPollutantBreakdown', language)}
        </h3>
        <span className="text-[10px] font-bold text-slate-400">
          European CAMS Standards
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {pollutants.map((pollutant) => {
          const badgeStyle = airQualityService.getCategoryBadgeStyle(pollutant.category);
          const isPrimary = pollutant.code === primaryCode || pollutant.is_primary;
          const localizedName = translatePollutant(pollutant.code || pollutant.name, language);
          const localizedCategory = translateAQICategory(pollutant.category, language);

          return (
            <div
              key={pollutant.code}
              className={`p-3 rounded-2xl bg-white border transition-all shadow-xs relative overflow-hidden flex flex-col justify-between ${
                isPrimary ? 'border-[#38b6ff] ring-1 ring-[#38b6ff]/30' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {isPrimary && (
                <span className="absolute top-0 right-0 px-2 py-0.5 rounded-bl-xl bg-[#004aad] text-white text-[8px] font-black uppercase tracking-wider">
                  {translatePhrase('primaryPollutant', language)}
                </span>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between pr-2">
                  <span className="text-xs font-extrabold text-slate-900">
                    {localizedName}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1">
                  {pollutant.description || `${localizedName}`}
                </p>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-base sm:text-lg font-black text-slate-900">
                    {pollutant.concentration != null ? pollutant.concentration.toFixed(1) : '--'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 ml-1">
                    {pollutant.unit}
                  </span>
                </div>

                <span
                  className="px-2 py-0.5 rounded-lg text-[10px] font-black"
                  style={{
                    backgroundColor: badgeStyle.bg,
                    color: badgeStyle.text,
                    border: `1px solid ${badgeStyle.border}`,
                  }}
                >
                  {localizedCategory}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
