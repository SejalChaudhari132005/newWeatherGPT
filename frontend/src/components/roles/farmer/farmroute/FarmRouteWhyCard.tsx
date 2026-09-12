import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, CheckSquare } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';
import { FarmProfile } from '../../../../types/farm';
import { translateCrop } from '../../../../utils/dashboardTranslator';

interface FarmRouteWhyCardProps {
  farm: FarmProfile | null;
}

export const FarmRouteWhyCard: React.FC<FarmRouteWhyCardProps> = ({ farm }) => {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const cropName = translateCrop(farm?.primary_crop || 'rice', language);

  return (
    <div className="gov-panel">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="gov-panel-header flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#006B3C]" />
          <span>
            {language === 'mr'
              ? 'हे नियोजन कसे तयार केले जाते? (DECISION LOGIC)'
              : language === 'hi'
              ? 'यह योजना कैसे बनाई जाती है? (DECISION LOGIC)'
              : 'DECISION LOGIC & METEOROLOGICAL BASIS'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-[#006B3C]">
          <span>{isExpanded ? 'COLLAPSE' : 'VIEW FACTORS'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-2.5 text-xs text-[#1F2933]">
          <p className="font-semibold text-[#17365D]">
            {language === 'mr'
              ? 'हे नियोजन खालील सर्व अधिकृत निकषांचा विचार करून स्वयंचलितरित्या तयार केले जाते:'
              : language === 'hi'
              ? 'यह योजना निम्नलिखित सभी आधिकारिक कारकों को ध्यान में रखकर तैयार की जाती है:'
              : 'This operational farm plan is generated deterministically by evaluating the following datasets:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#D6DCE1]">
            <div className="flex items-center gap-2 font-medium p-1.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <CheckSquare className="w-4 h-4 text-[#006B3C] shrink-0" />
              <span>{language === 'mr' ? `नोंदणीकृत पीक: ${cropName}` : language === 'hi' ? `फसल प्रकार: ${cropName}` : `Crop Profile: ${cropName}`}</span>
            </div>
            <div className="flex items-center gap-2 font-medium p-1.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <CheckSquare className="w-4 h-4 text-[#006B3C] shrink-0" />
              <span>{language === 'mr' ? 'अचूक जिओ-निर्देशांक स्थान' : language === 'hi' ? 'सटीक भू-स्थान निर्देशांक' : 'Micro-Location GPS Coordinates'}</span>
            </div>
            <div className="flex items-center gap-2 font-medium p-1.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <CheckSquare className="w-4 h-4 text-[#006B3C] shrink-0" />
              <span>{language === 'mr' ? 'मातीचा प्रकार व सिंचन पद्धत' : language === 'hi' ? 'मिट्टी का प्रकार एवं सिंचाई' : 'Soil Classification & Irrigation Type'}</span>
            </div>
            <div className="flex items-center gap-2 font-medium p-1.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <CheckSquare className="w-4 h-4 text-[#006B3C] shrink-0" />
              <span>{language === 'mr' ? 'तासानुसार पाऊस व वाऱ्याचा वेग' : language === 'hi' ? 'प्रति घंटा बारिश व हवा गति' : 'Hourly Rainfall Probability & Wind Vector'}</span>
            </div>
            <div className="flex items-center gap-2 font-medium p-1.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <CheckSquare className="w-4 h-4 text-[#006B3C] shrink-0" />
              <span>{language === 'mr' ? 'दुपारची उष्णता व बाष्पीभवन (ET0)' : language === 'hi' ? 'दोपहर की गर्मी एवं वाष्पीकरण (ET0)' : 'Thermal Heat Index & ET0 Evapotranspiration'}</span>
            </div>
            <div className="flex items-center gap-2 font-medium p-1.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
              <CheckSquare className="w-4 h-4 text-[#006B3C] shrink-0" />
              <span>{language === 'mr' ? 'अधिकृत IMD हवामान इशारे' : language === 'hi' ? 'आधिकारिक IMD मौसम चेतावनियां' : 'IMD Extreme Weather Warning Bulletins'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
