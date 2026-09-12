import React from 'react';
import { Droplets, Info, Activity } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { translatePhrase } from '../../../utils/dashboardTranslator';
import { SoilStateData } from '../../../types/farmerIntelligence';

interface SoilMoistureLossCardProps {
  soilState?: SoilStateData;
}

export const SoilMoistureLossCard: React.FC<SoilMoistureLossCardProps> = ({
  soilState,
}) => {
  const { language } = useLanguage();

  const surfaceMoistureRatio = soilState?.moisture_surface_0_to_7cm ?? 0.29;
  const surfaceMoisturePct = Math.round(surfaceMoistureRatio * 100);
  const et0Val = soilState?.et0_evapotranspiration_mm != null ? Math.round(soilState.et0_evapotranspiration_mm) : 0;
  const urgency = soilState?.irrigation_urgency || 'none';

  const isLowMoisture = surfaceMoisturePct < 30 || urgency === 'critical' || urgency === 'moderate';

  return (
    <div className="gov-panel h-full flex flex-col justify-between">
      {/* Official Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-[#006B3C]" />
          <span>
            {language === 'mr'
              ? 'जमिनीतील ओलावा आणि बाष्पीभवन'
              : language === 'hi'
              ? 'मृदा नमी गतिशीलता एवं वाष्पोत्सर्जन'
              : 'SOIL MOISTURE DYNAMICS & EVAPOTRANSPIRATION'}
          </span>
        </div>

        <span
          className={`gov-badge ${
            isLowMoisture ? 'gov-badge-warning' : 'gov-badge-success'
          }`}
        >
          {isLowMoisture
            ? (language === 'mr' ? 'ओलावा कमी' : language === 'hi' ? 'कमी चेतावनी' : 'DEFICIT ALERT')
            : (language === 'mr' ? 'पुरेसा ओलावा' : language === 'hi' ? 'पर्याप्त नमी' : 'ADEQUATE MOISTURE')}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3 flex-1 flex flex-col justify-between">
        {/* Telemetry 2-Column Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Surface Moisture (0-7 cm) */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
            <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider block">
              {language === 'mr' ? 'पृष्ठभागावरील ओलावा (०-७ cm)' : language === 'hi' ? 'सतह की नमी (0-7 cm)' : 'Surface Moisture (0-7 cm)'}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#1F2933]">
                {surfaceMoisturePct}%
              </span>
              <span className="text-xs font-semibold text-[#5B6770]">Volumetric</span>
            </div>
            {/* Simple rectangular progress bar */}
            <div className="w-full bg-[#E2E8F0] h-2 mt-2 rounded-none overflow-hidden">
              <div
                className={`h-full ${isLowMoisture ? 'bg-[#B7791F]' : 'bg-[#006B3C]'}`}
                style={{ width: `${Math.min(100, Math.max(0, surfaceMoisturePct))}%` }}
              />
            </div>
          </div>

          {/* ET0 Water Loss */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
            <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider block">
              {language === 'mr' ? 'ET0 पाण्याचे बाष्पीभवन' : language === 'hi' ? 'ET0 जल हानि दर' : 'ET0 Evapotranspiration'}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#1F2933]">
                {et0Val}
              </span>
              <span className="text-xs font-semibold text-[#5B6770]">mm / day</span>
            </div>
            <span className="text-[10px] text-[#5B6770] font-medium block mt-2">
              FAO-56 Penman-Monteith
            </span>
          </div>
        </div>

        {/* Assessment Box */}
        <div className={`p-2.5 bg-white border-l-4 rounded-xs text-xs font-medium ${
          isLowMoisture
            ? 'border-l-[#B7791F] border border-[#D6DCE1] text-[#1F2933]'
            : 'border-l-[#006B3C] border border-[#D6DCE1] text-[#1F2933]'
        }`}>
          <div className="font-bold text-[11px] uppercase tracking-wide text-[#17365D] mb-0.5">
            {language === 'mr' ? 'तांत्रिक मूल्यांकन व सल्ला' : language === 'hi' ? 'तकनीकी मूल्यांकन एवं सलाह' : 'Technical Assessment & Advisory'}
          </div>
          <p className="text-xs leading-relaxed text-[#1F2933]">
            {isLowMoisture
              ? (language === 'mr'
                  ? 'मातीतील ओलावा कमी आहे. मुळांच्या पोषणासाठी पुढील २४ तासांत नियंत्रित सिंचन करावे.'
                  : language === 'hi'
                  ? 'मिट्टी में नमी कम है। अगले २४ घंटों में नियंत्रित सिंचाई की सिफारिश की जाती है।'
                  : 'Soil moisture is in deficit. Controlled field irrigation recommended within next 24 hours.')
              : (language === 'mr'
                  ? 'मातीतील ओलावा समाधानकारक पातळीवर आहे. तात्काळ सिंचनाची आवश्यकता नाही.'
                  : language === 'hi'
                  ? 'मिट्टी में पर्याप्त नमी है। आज तत्काल सिंचाई की आवश्यकता नहीं है।'
                  : 'Soil moisture level is adequate. No immediate irrigation required for crop maintenance.')}
          </p>
        </div>

        {/* Observation Depth metadata */}
        <div className="pt-2 border-t border-[#D6DCE1] flex items-center justify-between text-[11px] text-[#5B6770]">
          <span>{language === 'mr' ? 'माती ओलावा मॉडेल' : language === 'hi' ? 'मृदा नमी मॉडल' : 'Topsoil Moisture Model'}</span>
          <span>{language === 'mr' ? 'खोली: ०-७ cm' : language === 'hi' ? 'गहराई: 0-7 cm' : 'Sensor Depth: 0–7 cm'}</span>
        </div>
      </div>
    </div>
  );
};
