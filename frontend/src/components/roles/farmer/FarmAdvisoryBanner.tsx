import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { translatePhrase } from '../../../utils/dashboardTranslator';

interface FarmAdvisoryBannerProps {
  advisoryText?: string | null;
  regionalText?: string | null;
  cropName?: string;
  rainProbability?: number;
  onClick?: () => void;
}

export const FarmAdvisoryBanner: React.FC<FarmAdvisoryBannerProps> = ({
  advisoryText,
  regionalText,
  cropName = 'पिकासाठी',
  rainProbability = 0,
  onClick,
}) => {
  const { language } = useLanguage();

  const defaultFallback =
    rainProbability > 60
      ? language === 'mr'
        ? 'आज दुपारी आणि संध्याकाळी हलका ते मध्यम पाऊस अपेक्षित आहे. शेतीतील फवारणी व सिंचन नियोजनपूर्वक करा.'
        : language === 'hi'
        ? 'आज दोपहर और शाम को हल्की से मध्यम बारिश की संभावना है। छिड़काव और सिंचाई सावधानीपूर्वक करें।'
        : 'Light to moderate rain expected today. Plan spraying and irrigation carefully.'
      : language === 'mr'
      ? 'सध्या हवामान शेतीतील कामांसाठी अनुकूल आहे. पिकाची नियमित पाहणी करा.'
      : language === 'hi'
      ? 'वर्तमान मौसम कृषि कार्यों के लिए अनुकूल है। फसल का नियमित निरीक्षण करें।'
      : 'Current weather is favorable for field operations. Monitor crops regularly.';

  const displayText =
    (language === 'mr' || language === 'hi' ? regionalText : advisoryText) ||
    advisoryText ||
    regionalText ||
    defaultFallback;

  return (
    <div
      onClick={onClick}
      className="w-full bg-white border border-[#D6DCE1] border-l-4 border-l-[#B7791F] rounded-xs p-3 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FFFBEB] transition-colors"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <AlertTriangle className="w-4 h-4 text-[#B7791F] shrink-0 mt-0.5" />

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold text-[#78350F] uppercase tracking-wider">
              {translatePhrase('farmAdvisoryTitle', language)}
            </h3>
            <span className="text-[9px] font-bold bg-[#FEF3C7] text-[#78350F] px-1.5 py-0.2 rounded-xs border border-[#FDE68A] uppercase">
              Agromet Bulletin
            </span>
          </div>

          <p className="text-xs text-[#1F2933] font-medium leading-relaxed">
            {displayText}
          </p>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-[#78350F] shrink-0" />
    </div>
  );
};
