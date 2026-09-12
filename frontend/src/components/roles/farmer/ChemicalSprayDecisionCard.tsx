import React from 'react';
import { ShieldAlert, Droplets, Wind, Clock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { translatePhrase } from '../../../utils/dashboardTranslator';

interface ChemicalSprayDecisionCardProps {
  windSpeed?: number;
  rainProbability?: number;
  humidity?: number;
  temperature?: number;
}

export const ChemicalSprayDecisionCard: React.FC<ChemicalSprayDecisionCardProps> = ({
  windSpeed = 6.2,
  rainProbability = 15,
  humidity = 68,
  temperature = 27.4,
}) => {
  const { language } = useLanguage();

  const isWindSafe = windSpeed < 15;
  const isRainSafe = rainProbability < 35;
  const isTempSafe = temperature < 35;

  const isSafeToSpray = isWindSafe && isRainSafe && isTempSafe;

  return (
    <div className="gov-panel space-y-3">
      {/* Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#006B3C]" />
          <span>
            {language === 'mr'
              ? 'पीक संरक्षण आणि रासायनिक फवारणी अनुकूलता'
              : language === 'hi'
              ? 'पादप संरक्षण एवं रासायनिक छिड़काव उपयुक्तता'
              : 'PLANT PROTECTION & CHEMICAL SPRAY SUITABILITY'}
          </span>
        </div>

        <span className={`gov-badge ${isSafeToSpray ? 'gov-badge-success' : 'gov-badge-warning'}`}>
          {isSafeToSpray
            ? (language === 'mr' ? 'फवारणीस अनुकूल' : language === 'hi' ? 'छिड़काव के लिए सुरक्षित' : 'SUITABLE FOR SPRAYING')
            : (language === 'mr' ? 'प्रतीक्षा करा' : language === 'hi' ? 'प्रतीक्षा करें' : 'DELAY SPRAYING')}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* 3 Rectangular Parameter Columns */}
        <div className="grid grid-cols-3 gap-2 text-left">
          {/* Optimal Window */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs flex flex-col justify-between">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#17365D] uppercase">
              <Clock className="w-3.5 h-3.5 text-[#006B3C]" />
              <span>{language === 'mr' ? 'योग्य वेळ' : language === 'hi' ? 'उचित समय' : 'Safe Window'}</span>
            </div>
            <div className="text-xs font-bold text-[#1F2933] mt-1">
              07:00 – 10:00 IST
            </div>
            <span className="gov-badge gov-badge-info mt-1.5 self-start">
              {language === 'mr' ? 'शांत वारा' : language === 'hi' ? 'शांत हवा' : 'Calm Wind'}
            </span>
          </div>

          {/* Wash-off Risk */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs flex flex-col justify-between">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#17365D] uppercase">
              <Droplets className="w-3.5 h-3.5 text-[#1D5F91]" />
              <span>{language === 'mr' ? 'धुवून जाणे' : language === 'hi' ? 'धुलना' : 'Wash-off Risk'}</span>
            </div>
            <div className="text-xs font-bold text-[#1F2933] mt-1">
              {rainProbability}%
            </div>
            <span className={`gov-badge ${isRainSafe ? 'gov-badge-success' : 'gov-badge-danger'} mt-1.5 self-start`}>
              {isRainSafe ? translatePhrase('low', language) : translatePhrase('high', language)}
            </span>
          </div>

          {/* Wind Drift */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs flex flex-col justify-between">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#17365D] uppercase">
              <Wind className="w-3.5 h-3.5 text-[#1D5F91]" />
              <span>{language === 'mr' ? 'वारा' : language === 'hi' ? 'हवा' : 'Wind Drift'}</span>
            </div>
            <div className="text-xs font-bold text-[#1F2933] mt-1">
              {windSpeed.toFixed(1)} km/h
            </div>
            <span className={`gov-badge ${isWindSafe ? 'gov-badge-success' : 'gov-badge-warning'} mt-1.5 self-start`}>
              {isWindSafe ? translatePhrase('favorable', language) : translatePhrase('moderate', language)}
            </span>
          </div>
        </div>

        {/* Regulatory Advisory */}
        <div className="p-2.5 bg-white border border-[#D6DCE1] border-l-4 border-l-[#17365D] rounded-xs text-xs text-[#1F2933]">
          <span className="font-bold uppercase tracking-wider block mb-0.5 text-[#17365D]">
            {language === 'mr' ? 'कायदेशीर सल्ला:' : language === 'hi' ? 'वैधानिक सलाह:' : 'Statutory Advisory:'}
          </span>
          <p className="leading-relaxed">
            {language === 'mr'
              ? 'ही हवामानावर आधारित शिफारस आहे. रासायनिक उत्पादनाच्या पाकिटावरील CIB&RC सुरक्षा सूचनांचे पालन करा.'
              : language === 'hi'
              ? 'यह मौसम-आधारित सलाह है। कृपया CIB&RC अनुमोदित सुरक्षा दिशानिर्देशों का पालन करें।'
              : 'Agro-meteorological decision support. Always adhere to CIB&RC approved chemical dosage and PPE guidelines.'}
          </p>
        </div>

        {/* Source metadata */}
        <div className="pt-2 border-t border-[#D6DCE1] flex items-center justify-between text-[11px] text-[#5B6770]">
          <span>CIB&RC Standards</span>
          <span>{translatePhrase('status', language)}: {language === 'mr' ? 'सक्रिय' : language === 'hi' ? 'सक्रिय' : 'Operational'}</span>
        </div>
      </div>
    </div>
  );
};
