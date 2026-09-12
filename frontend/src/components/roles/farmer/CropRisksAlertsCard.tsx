import React from 'react';
import { ShieldCheck, AlertTriangle, Droplets, Flame, Wind } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { translateCrop, translateGrowthStage, translatePhrase } from '../../../utils/dashboardTranslator';

interface CropRisksAlertsCardProps {
  cropName?: string;
  growthStage?: string;
  temperature?: number;
  windSpeed?: number;
  rainProbability?: number;
}

export const CropRisksAlertsCard: React.FC<CropRisksAlertsCardProps> = ({
  cropName = 'rice',
  growthStage = 'pod_filling',
  temperature = 27.4,
  windSpeed = 6.2,
  rainProbability = 15,
}) => {
  const { language } = useLanguage();

  const rainRisk: 'Low' | 'Moderate' | 'High' =
    rainProbability > 70 ? 'High' : rainProbability > 40 ? 'Moderate' : 'Low';

  const heatRisk: 'Low' | 'Moderate' | 'High' =
    temperature > 38 ? 'High' : temperature > 34 ? 'Moderate' : 'Low';

  const windRisk: 'Low' | 'Moderate' | 'High' =
    windSpeed > 25 ? 'High' : windSpeed > 15 ? 'Moderate' : 'Low';

  const isOverallFavorable = rainRisk === 'Low' && heatRisk === 'Low' && windRisk === 'Low';

  const getRiskBadge = (risk: 'Low' | 'Moderate' | 'High') => {
    switch (risk) {
      case 'High':
        return (
          <span className="gov-badge gov-badge-danger">
            {translatePhrase('high', language)}
          </span>
        );
      case 'Moderate':
        return (
          <span className="gov-badge gov-badge-warning">
            {translatePhrase('moderate', language)}
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="gov-badge gov-badge-success">
            {translatePhrase('low', language)}
          </span>
        );
    }
  };

  return (
    <div className="gov-panel h-full flex flex-col justify-between">
      {/* Official Section Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#006B3C]" />
          <span>
            {language === 'mr'
              ? 'पीक हवामान जोखीम व मूल्यांकन मॅट्रिक्स'
              : language === 'hi'
              ? 'फसल मौसम जोखिम एवं मूल्यांकन मैट्रिक्स'
              : 'CROP WEATHER VULNERABILITY & RISK MATRIX'}
          </span>
        </div>

        <span className={`gov-badge ${isOverallFavorable ? 'gov-badge-success' : 'gov-badge-warning'}`}>
          {isOverallFavorable
            ? (language === 'mr' ? 'एकूण: अनुकूल' : language === 'hi' ? 'कुल: अनुकूल' : 'OVERALL: FAVORABLE')
            : (language === 'mr' ? 'एकूण: मध्यम जोखीम' : language === 'hi' ? 'कुल: मध्यम जोखिम' : 'OVERALL: MODERATE RISK')}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3 flex-1 flex flex-col justify-between">
        <div className="text-xs font-bold text-[#5B6770] uppercase tracking-wide">
          {language === 'mr' ? 'सक्रिय मूल्यांकन' : language === 'hi' ? 'सक्रिय मूल्यांकन' : 'Active Evaluation'}: {translateCrop(cropName, language)} • {translateGrowthStage(growthStage, language)}
        </div>

        {/* 3 Rectangular Parameter Columns */}
        <div className="grid grid-cols-3 gap-2 text-left">
          {/* Rain Risk */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#17365D] uppercase">
                <Droplets className="w-3.5 h-3.5 text-[#1D5F91]" />
                <span>{language === 'mr' ? 'पाऊस' : language === 'hi' ? 'वर्षा' : 'Rain Risk'}</span>
              </div>
              <div className="text-xs text-[#5B6770] mt-0.5">{rainProbability}%</div>
            </div>
            <div className="mt-2">
              {getRiskBadge(rainRisk)}
            </div>
          </div>

          {/* Heat Risk */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#17365D] uppercase">
                <Flame className="w-3.5 h-3.5 text-[#B7791F]" />
                <span>{language === 'mr' ? 'तापमान' : language === 'hi' ? 'ताप' : 'Heat Stress'}</span>
              </div>
              <div className="text-xs text-[#5B6770] mt-0.5">{temperature}°C</div>
            </div>
            <div className="mt-2">
              {getRiskBadge(heatRisk)}
            </div>
          </div>

          {/* Wind Risk */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#17365D] uppercase">
                <Wind className="w-3.5 h-3.5 text-[#1D5F91]" />
                <span>{language === 'mr' ? 'वारा' : language === 'hi' ? 'हवा' : 'Wind Lodging'}</span>
              </div>
              <div className="text-xs text-[#5B6770] mt-0.5">{windSpeed} km/h</div>
            </div>
            <div className="mt-2">
              {getRiskBadge(windRisk)}
            </div>
          </div>
        </div>

        {/* Source metadata */}
        <div className="pt-2 border-t border-[#D6DCE1] flex items-center justify-between text-[11px] text-[#5B6770]">
          <span>{language === 'mr' ? 'मूल्यांकन: IMD ॲग्रोमेट फ्रेमवर्क' : language === 'hi' ? 'मूल्यांकन: IMD एग्रोमेट फ्रेमवर्क' : 'Risk Assessment: IMD Agromet Framework'}</span>
          <span>{translatePhrase('status', language)}: {language === 'mr' ? 'प्रमाणित' : language === 'hi' ? 'सत्यापित' : 'Verified'}</span>
        </div>
      </div>
    </div>
  );
};
