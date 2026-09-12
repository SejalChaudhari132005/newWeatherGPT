import React from 'react';
import { Sprout } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { CROP_PROFILES, CropProfile } from '../../../utils/cropProfiles';
import {
  translateCrop,
  translateGrowthStage,
  translatePhrase,
} from '../../../utils/dashboardTranslator';

interface CropGrowthTimelineCardProps {
  cropId?: string;
  currentStageId?: string;
  onSelectStage?: (stageId: string) => void;
}

export const CropGrowthTimelineCard: React.FC<CropGrowthTimelineCardProps> = ({
  cropId = 'rice',
  currentStageId = 'pod_filling',
  onSelectStage,
}) => {
  const { language } = useLanguage();

  const normalizedCrop = cropId?.toLowerCase() || 'rice';
  const profile: CropProfile =
    CROP_PROFILES[normalizedCrop] ||
    CROP_PROFILES['rice'] ||
    CROP_PROFILES['soybean'];

  const stages = profile.stages || [
    { id: 'sowing', label: 'Sowing' },
    { id: 'tillering', label: 'Tillering' },
    { id: 'panicle_initiation', label: 'Panicle Init.' },
    { id: 'pod_filling', label: 'Pod/Grain Filling' },
    { id: 'maturity', label: 'Maturity' },
  ];

  const activeIndex = stages.findIndex(
    (s) =>
      s.id === currentStageId ||
      s.id.toLowerCase() === currentStageId?.toLowerCase() ||
      currentStageId?.toLowerCase().includes(s.id.toLowerCase())
  );
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 3;

  return (
    <div className="gov-panel space-y-3">
      {/* Official Section Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sprout className="w-4 h-4 text-[#006B3C]" />
          <span>
            {language === 'mr'
              ? `पीक वाढीचे टप्पे — ${translateCrop(profile.id, language).toUpperCase()}`
              : language === 'hi'
              ? `फसल विकास चरण — ${translateCrop(profile.id, language).toUpperCase()}`
              : `PHENOLOGICAL GROWTH STAGES — ${translateCrop(profile.id, language).toUpperCase()}`}
          </span>
        </div>

        <span className="gov-badge gov-badge-success">
          {language === 'mr'
            ? `टप्पा ${safeActiveIndex + 1}/${stages.length}: ${translateGrowthStage(stages[safeActiveIndex]?.id || 'pod_filling', language)}`
            : language === 'hi'
            ? `चरण ${safeActiveIndex + 1}/${stages.length}: ${translateGrowthStage(stages[safeActiveIndex]?.id || 'pod_filling', language)}`
            : `STAGE ${safeActiveIndex + 1} OF ${stages.length}: ${translateGrowthStage(stages[safeActiveIndex]?.id || 'pod_filling', language).toUpperCase()}`}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Rectangular Stage Steps Bar */}
        <div className="grid grid-cols-5 gap-1.5">
          {stages.map((stg, idx) => {
            const isCompleted = idx < safeActiveIndex;
            const isCurrent = idx === safeActiveIndex;

            return (
              <div
                key={stg.id}
                onClick={() => onSelectStage && onSelectStage(stg.id)}
                className={`h-2 rounded-none transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#006B3C]'
                    : isCompleted
                    ? 'bg-[#287D3C]'
                    : 'bg-[#D6DCE1]'
                }`}
                title={stg.label}
              />
            );
          })}
        </div>

        {/* Stage Buttons */}
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {stages.map((stg, idx) => {
            const isCurrent = idx === safeActiveIndex;

            return (
              <button
                type="button"
                key={stg.id}
                onClick={() => onSelectStage && onSelectStage(stg.id)}
                className={`text-[11px] py-2 px-1 rounded-xs transition-colors cursor-pointer truncate font-bold border ${
                  isCurrent
                    ? 'bg-[#006B3C] text-white border-[#006B3C]'
                    : 'bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#1F2933] border-[#D6DCE1]'
                }`}
              >
                {translateGrowthStage(stg.id, language)}
              </button>
            );
          })}
        </div>

        {/* Source metadata */}
        <div className="pt-2 border-t border-[#D6DCE1] flex items-center justify-between text-[11px] text-[#5B6770]">
          <span>{language === 'mr' ? 'ICAR पीक वाढ मॅट्रिक्स' : language === 'hi' ? 'ICAR फसल विकास मैट्रिक्स' : 'ICAR Crop Phenology Reference'}</span>
          <span>{language === 'mr' ? 'बदलण्यासाठी टप्प्यावर क्लिक करा' : language === 'hi' ? 'अपडेट करने के लिए चरण पर क्लिक करें' : 'Click stage to update'}</span>
        </div>
      </div>
    </div>
  );
};
