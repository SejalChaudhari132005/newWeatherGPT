import React from 'react';
import { ArrowLeft, MapPin, ChevronDown, Calendar } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';

interface FarmRouteHeaderProps {
  onBack?: () => void;
  locationName: string;
  onOpenLocationModal?: () => void;
}

export const FarmRouteHeader: React.FC<FarmRouteHeaderProps> = ({
  onBack,
  locationName,
  onOpenLocationModal,
}) => {
  const { language } = useLanguage();

  return (
    <div className="bg-[#17365D] text-white border-b-2 border-[#006B3C] px-3.5 sm:px-6 py-3">
      <div className="max-w-6xl mx-auto space-y-2">
        {/* Top Bar: Back Button + Title + Location Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-xs bg-[#0F233D] hover:bg-[#081525] text-white border border-[#2A4D7A] transition-colors cursor-pointer"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div>
              <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
                {language === 'mr' ? 'राष्ट्रीय कृषी कार्य नियोजन प्रणाली' : language === 'hi' ? 'राष्ट्रीय कृषि कार्य योजना प्रणाली' : 'NATIONAL AGROMET WORK-PLANNING SYSTEM'}
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {language === 'mr'
                  ? 'शेतकाम नियोजन (FARMROUTE)'
                  : language === 'hi'
                  ? 'खेत कार्य योजना (FARMROUTE)'
                  : 'PLAN MY FARM DAY (FARMROUTE)'}
              </h1>
            </div>
          </div>

          {/* Location Chip */}
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F233D] hover:bg-[#081525] border border-[#2A4D7A] text-white text-xs font-bold rounded-xs transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="max-w-[150px] sm:max-w-[200px] truncate">{locationName || 'Kalyan, Maharashtra'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/70 shrink-0" />
          </button>
        </div>

        {/* Tagline */}
        <div className="text-xs text-emerald-100/90 font-medium">
          {language === 'mr'
            ? 'हवामान, पीक व माती परिस्थितीवर आधारित अचूक दैनिक शेतकाम वेळापत्रक'
            : language === 'hi'
            ? 'मौसम, फसल व मृदा स्थिति पर आधारित दैनिक कृषि कार्य समय-सारणी'
            : 'Operational daily farm schedule optimized for meteorological safety and efficacy'}
        </div>
      </div>
    </div>
  );
};
