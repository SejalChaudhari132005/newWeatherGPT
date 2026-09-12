import React from 'react';
import { Settings2, MapPin, Building2, PlusCircle, ChevronRight, Sprout } from 'lucide-react';
import { FarmProfile } from '../../../../types/farm';
import { useLanguage } from '../../../../context/LanguageContext';
import { translateCrop, translatePhrase } from '../../../../utils/dashboardTranslator';

interface FarmRouteSummaryCardProps {
  farm: FarmProfile | null;
  onOpenManageFarm: () => void;
}

export const FarmRouteSummaryCard: React.FC<FarmRouteSummaryCardProps> = ({
  farm,
  onOpenManageFarm,
}) => {
  const { language } = useLanguage();

  if (!farm) {
    return (
      <div className="gov-panel p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xs bg-[#EBF5EE] border border-[#006B3C] text-[#006B3C] flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-[#17365D] uppercase">
              {language === 'mr' ? 'शेती माहिती सेट करा' : language === 'hi' ? 'खेत प्रोफ़ाइल जोड़ें' : 'FARM RECORD NOT INITIALIZED'}
            </h3>
            <p className="text-[11px] text-[#5B6770] font-normal truncate">
              {language === 'mr'
                ? 'वैयक्तिकृत नियोजन मिळवण्यासाठी पीक व क्षेत्रफळ निवडा.'
                : language === 'hi'
                ? 'सटीक योजना के लिए फसल व आकार जोड़ें।'
                : 'Select crop and holding size to calculate personalized schedule.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenManageFarm}
          className="shrink-0 px-3 py-1.5 rounded-xs bg-[#006B3C] hover:bg-[#00522E] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 uppercase tracking-wider"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{language === 'mr' ? 'नोंदणी' : language === 'hi' ? 'शुरू करें' : 'REGISTER FARM'}</span>
        </button>
      </div>
    );
  }

  const cropTitle = translateCrop(farm.primary_crop, language);
  const varietyText = farm.crop_variety || 'Regular Variety';
  const sizeText = `${farm.farm_size || 2.5} ${farm.farm_size_unit || 'Acres'}`;
  const locationText = [farm.village, farm.district, farm.state].filter(Boolean).join(', ') || 'Maharashtra';

  return (
    <div className="gov-panel p-3 flex flex-wrap items-center justify-between gap-3">
      {/* Farm Details Row */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xs bg-[#F8FAFC] border border-[#D6DCE1] text-[#006B3C] flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-[#006B3C]" />
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#17365D] uppercase tracking-wide">
              {farm.farm_name || 'MY REGISTERED FARM'}
            </span>
            <span className="gov-badge gov-badge-success">
              PRIMARY PLOT
            </span>
          </div>

          <div className="text-xs font-semibold text-[#1F2933] truncate">
            Crop: <span className="font-bold text-[#006B3C]">{cropTitle}</span> ({varietyText}) • Area: {sizeText}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-[#5B6770] truncate">
            <MapPin className="w-3 h-3 text-[#5B6770] shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>
        </div>
      </div>

      {/* Right Manage Farm Button */}
      <button
        type="button"
        onClick={onOpenManageFarm}
        className="shrink-0 px-3 py-1.5 rounded-xs bg-white hover:bg-[#F1F5F9] border border-[#D6DCE1] text-[#17365D] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 uppercase tracking-wider"
      >
        <Settings2 className="w-3.5 h-3.5 text-[#006B3C]" />
        <span>{translatePhrase('manageFarm', language)}</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#5B6770]" />
      </button>
    </div>
  );
};
