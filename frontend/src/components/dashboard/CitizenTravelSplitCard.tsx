import React from 'react';
import { Navigation, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translatePhrase } from '../../utils/dashboardTranslator';

interface Props {
  onPlanRoute?: () => void;
}

export const CitizenTravelSplitCard: React.FC<Props> = ({ onPlanRoute }) => {
  const { language } = useLanguage();

  return (
    <div
      onClick={onPlanRoute}
      className="gov-panel p-3 flex flex-col justify-between space-y-2 cursor-pointer hover:border-[#17365D] transition-colors"
    >
      <div className="flex items-center justify-between border-b border-[#D6DCE1] pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Navigation className="w-3.5 h-3.5 text-[#006B3C] shrink-0" />
          <span className="text-xs font-bold uppercase text-[#17365D] truncate">
            {translatePhrase('travelRoute', language)}
          </span>
        </div>
        <span className="gov-badge gov-badge-info text-[9px]">
          {translatePhrase('safety', language) || 'SAFETY'}
        </span>
      </div>

      <div className="p-2 bg-[#F8FAFC] border border-[#D6DCE1] text-xs space-y-1">
        <div className="text-[11px] font-semibold text-[#1F2933]">
          {translatePhrase('highwayTransitRisks', language)}
        </div>
        <div className="text-[10px] text-[#5B6770]">
          {translatePhrase('transitNotice', language)}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onPlanRoute) onPlanRoute();
        }}
        className="gov-btn-primary w-full py-1 text-[11px] font-bold uppercase flex items-center justify-center gap-1"
      >
        <span>{translatePhrase('planRoute', language)}</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};
