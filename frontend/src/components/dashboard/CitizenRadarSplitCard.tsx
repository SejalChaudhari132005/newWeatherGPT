import React from 'react';
import { Radar, ChevronRight, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translatePhrase } from '../../utils/dashboardTranslator';

interface Props {
  locationName?: string;
  onOpenRadar?: () => void;
}

export const CitizenRadarSplitCard: React.FC<Props> = ({
  locationName = 'New Delhi',
  onOpenRadar,
}) => {
  const { language } = useLanguage();

  return (
    <div
      onClick={onOpenRadar}
      className="gov-panel p-3 flex flex-col justify-between space-y-2 cursor-pointer hover:border-[#17365D] transition-colors"
    >
      <div className="flex items-center justify-between border-b border-[#D6DCE1] pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Radar className="w-3.5 h-3.5 text-[#006B3C] shrink-0" />
          <span className="text-xs font-bold uppercase text-[#17365D] truncate">
            {translatePhrase('dopplerRadar', language)}
          </span>
        </div>
        <span className="gov-badge gov-badge-danger text-[9px]">
          {translatePhrase('live', language) || 'LIVE'}
        </span>
      </div>

      <div className="p-2 bg-[#F8FAFC] border border-[#D6DCE1] text-xs space-y-1">
        <div className="flex items-center gap-1 text-[11px] text-[#1F2933]">
          <MapPin className="w-3 h-3 text-[#006B3C]" />
          <span className="font-semibold truncate">
            {locationName.split(',')[0]} {translatePhrase('sector', language)}
          </span>
        </div>
        <div className="text-[10px] text-[#5B6770]">
          {translatePhrase('radarReflectivity', language)}
        </div>
      </div>

      <button
        onClick={onOpenRadar}
        className="gov-btn-secondary w-full py-1 text-[11px] font-bold uppercase flex items-center justify-center gap-1"
      >
        <span>{translatePhrase('openRadar', language)}</span>
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
};
