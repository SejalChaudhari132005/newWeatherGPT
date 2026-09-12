import React from 'react';
import { Sprout, ChevronRight, CheckCircle2, AlertTriangle, CloudRain, Clock, BookOpen } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { translatePhrase } from '../../../utils/dashboardTranslator';
import { SoilStateData } from '../../../types/farmerIntelligence';

interface CurrentFarmAdvisoryCardProps {
  soilState?: SoilStateData;
  rainProbability?: number;
  expectedRainfallMm?: number;
  onOpenDetails?: () => void;
}

export const CurrentFarmAdvisoryCard: React.FC<CurrentFarmAdvisoryCardProps> = ({
  soilState,
  rainProbability = 15,
  expectedRainfallMm = 0,
  onOpenDetails,
}) => {
  const { language } = useLanguage();

  const moistureStatus = soilState?.moisture_status || 'optimal';
  const urgency = soilState?.irrigation_urgency || 'none';

  let statusType: 'OPTIMAL' | 'IRRIGATION_NEEDED' | 'WAIT' | 'HIGH_DEMAND' | 'RAIN_EXPECTED' = 'OPTIMAL';

  if (rainProbability > 65 || expectedRainfallMm > 5) {
    statusType = 'RAIN_EXPECTED';
  } else if (urgency === 'critical' || moistureStatus === 'deficit') {
    statusType = 'IRRIGATION_NEEDED';
  } else if (soilState?.et0_evapotranspiration_mm && soilState.et0_evapotranspiration_mm > 5.5) {
    statusType = 'HIGH_DEMAND';
  } else {
    statusType = 'OPTIMAL';
  }

  const getStatusDetails = () => {
    switch (statusType) {
      case 'OPTIMAL':
        return {
          badge: 'FAVORABLE / BALANCED',
          badgeClass: 'gov-badge-success',
          borderClass: 'border-l-[#006B3C]',
          subtitle:
            language === 'mr'
              ? 'हवामानावर आधारित सिंचन सल्ला'
              : language === 'hi'
              ? 'मौसम-आधारित सिंचाई सलाह'
              : 'Weather-based irrigation recommendation',
          description:
            language === 'mr'
              ? 'सिंचन संतुलित आहे. पुढील २४ तासांत तात्काळ सिंचनाची आवश्यकता नाही.'
              : language === 'hi'
              ? 'सिंचाई संतुलित है। अगले २४ घंटों में तत्काल सिंचाई की कोई आवश्यकता नहीं है।'
              : 'Irrigation is optimal. No immediate irrigation required for the next 24h.',
        };
      case 'RAIN_EXPECTED':
        return {
          badge: 'RAIN EXPECTED - DELAY',
          badgeClass: 'gov-badge-info',
          borderClass: 'border-l-[#1D5F91]',
          subtitle:
            language === 'mr'
              ? 'पावसाचा अंदाज - सिंचन पुढे ढकला'
              : language === 'hi'
              ? 'बारिश की संभावना - सिंचाई स्थगित करें'
              : 'Rain expected - Delay field irrigation',
          description:
            language === 'mr'
              ? 'पावसाची दाट शक्यता असल्यामुळे सिंचन पुढे ढकलावे. पाण्याचा अपव्यय टाळा.'
              : language === 'hi'
              ? 'बारिश की संभावना के कारण सिंचाई टालें। जलभराव से बचें।'
              : 'Significant rain expected soon. Delay irrigation to prevent waterlogging.',
        };
      case 'IRRIGATION_NEEDED':
        return {
          badge: 'IRRIGATION RECOMMENDED',
          badgeClass: 'gov-badge-warning',
          borderClass: 'border-l-[#B7791F]',
          subtitle:
            language === 'mr'
              ? 'मातीत ओलावा कमी - सिंचन आवश्यक'
              : language === 'hi'
              ? 'मिट्टी में नमी कम - सिंचाई आवश्यक'
              : 'Soil moisture deficit - Irrigation needed',
          description:
            language === 'mr'
              ? 'पिकाच्या मुळांजवळील ओलावा कमी झाला आहे. आज सायंकाळी किंवा उद्या सकाळी पाणी द्या.'
              : language === 'hi'
              ? 'जड़ क्षेत्र में नमी कम है। आज शाम या कल सुबह सिंचाई करें।'
              : 'Root zone moisture is low. Apply irrigation during morning or evening.',
        };
      case 'HIGH_DEMAND':
        return {
          badge: 'HIGH EVAPOTRANSPIRATION',
          badgeClass: 'gov-badge-danger',
          borderClass: 'border-l-[#B42318]',
          subtitle:
            language === 'mr'
              ? 'उच्च बाष्पीभवन - पाण्याची मागणी जास्त'
              : language === 'hi'
              ? 'उच्च वाष्पीकरण - जल मांग अधिक'
              : 'High evapotranspiration demand',
          description:
            language === 'mr'
              ? 'तापमान आणि वाऱ्यामुळे बाष्पीभवन वाढले आहे. हलके सिंचन करावे.'
              : language === 'hi'
              ? 'तापमान और हवा के कारण जल हानि तेज है। हल्की सिंचाई करें।'
              : 'High ET0 rate detected. Maintain light surface moisture.',
        };
    }
  };

  const details = getStatusDetails();

  return (
    <div className="gov-panel h-full flex flex-col justify-between">
      {/* Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#006B3C]" />
          <span>AGROMET FIELD ADVISORY BULLETIN</span>
        </div>

        <span className={`gov-badge ${details.badgeClass}`}>
          {details.badge}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3 flex-1 flex flex-col justify-between">
        <div className="text-xs font-bold text-[#17365D] uppercase tracking-wide">
          {details.subtitle}
        </div>

        {/* Structured Advisory Banner */}
        <div className={`p-3 bg-white border border-[#D6DCE1] border-l-4 ${details.borderClass} rounded-xs`}>
          <p className="text-xs font-semibold text-[#1F2933] leading-relaxed">
            {details.description}
          </p>
        </div>

        {/* Source metadata */}
        <div className="pt-2 border-t border-[#D6DCE1] flex items-center justify-between text-[11px] text-[#5B6770]">
          <span>Issued by: District Agromet Advisory Unit (DAMU)</span>
          <span>Validity: Today</span>
        </div>
      </div>
    </div>
  );
};
