import React from 'react';
import { Wheat, ShieldCheck, AlertTriangle, Flame, Wind, Droplets } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { translateCrop, translateGrowthStage, translatePhrase } from '../../../utils/dashboardTranslator';

interface FarmCropStatusCardProps {
  cropName: string;
  growthStage: string;
  temperature: number;
  windSpeed: number;
  rainProbability: number;
  suitabilityScore?: 'GOOD' | 'MODERATE' | 'RISKY';
}

export const FarmCropStatusCard: React.FC<FarmCropStatusCardProps> = ({
  cropName,
  growthStage,
  temperature,
  windSpeed,
  rainProbability,
  suitabilityScore,
}) => {
  const { language } = useLanguage();

  // Deterministic calculation if not provided
  let status: 'GOOD' | 'MODERATE' | 'RISKY' = suitabilityScore || 'GOOD';
  if (!suitabilityScore) {
    if (temperature > 38 || windSpeed > 25 || (rainProbability > 80 && growthStage === 'flowering')) {
      status = 'RISKY';
    } else if (temperature > 34 || windSpeed > 15 || rainProbability > 50) {
      status = 'MODERATE';
    } else {
      status = 'GOOD';
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'GOOD':
        return {
          label: language === 'mr' ? 'अनुकूल' : language === 'hi' ? 'अनुकूल' : 'Favorable',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: ShieldCheck,
          text:
            language === 'mr'
              ? 'सध्याचे हवामान पिकासाठी अत्यंत अनुकूल आहे.'
              : language === 'hi'
              ? 'वर्तमान मौसम फसल के लिए बहुत अनुकूल है।'
              : 'Current weather conditions are highly favorable for the crop.',
        };
      case 'MODERATE':
        return {
          label: language === 'mr' ? 'मध्यम' : language === 'hi' ? 'मध्यम' : 'Moderate',
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: AlertTriangle,
          text:
            language === 'mr'
              ? 'हवामानात बदल संभवतो, शेतीतील कामे सतर्कतेने करा.'
              : language === 'hi'
              ? 'मौसम में बदलाव संभव है, कृषि कार्य सावधानी से करें।'
              : 'Weather variations expected. Proceed with farm operations attentively.',
        };
      case 'RISKY':
        return {
          label: language === 'mr' ? 'जोखीम' : language === 'hi' ? 'जोखिम' : 'High Risk',
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: AlertTriangle,
          text:
            language === 'mr'
              ? 'उच्च तापमान किंवा अतिवृष्टीमुळे पिकावर परिणाम होऊ शकतो.'
              : language === 'hi'
              ? 'उच्च तापमान या भारी बारिश से फसल पर प्रभाव पड़ सकता है।'
              : 'High temperatures or heavy precipitation may stress the crop.',
        };
    }
  };

  const badge = getStatusBadge();
  const Icon = badge.icon;

  const getRiskLabel = (isHigh: boolean, isMod: boolean) => {
    if (isHigh) return translatePhrase('high', language);
    if (isMod) return translatePhrase('moderate', language);
    return translatePhrase('low', language);
  };

  return (
    <div className="w-full rounded-3xl bg-white p-4 border border-slate-200/90 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
            <Wheat className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
              {translatePhrase('cropStatus', language)}
            </h3>
            <span className="text-[10px] font-bold text-slate-500">
              {translateCrop(cropName, language)} • {translateGrowthStage(growthStage, language)}
            </span>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 ${badge.bg}`}>
          <Icon className="w-3 h-3" />
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Summary Text */}
      <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60">
        {badge.text}
      </p>

      {/* 3 Risk Indicators */}
      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        <div className="p-2 rounded-2xl bg-blue-50/70 border border-blue-100">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-blue-900">
            <Droplets className="w-3 h-3 text-blue-600" />
            <span>{translatePhrase('rainRisk', language)}</span>
          </div>
          <span className="text-xs font-black text-blue-950 mt-0.5 block truncate">
            {getRiskLabel(rainProbability > 60, rainProbability > 30)}
          </span>
        </div>

        <div className="p-2 rounded-2xl bg-orange-50/70 border border-orange-100">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-orange-900">
            <Flame className="w-3 h-3 text-orange-600" />
            <span>{translatePhrase('heatRisk', language)}</span>
          </div>
          <span className="text-xs font-black text-orange-950 mt-0.5 block truncate">
            {getRiskLabel(temperature > 36, temperature > 32)}
          </span>
        </div>

        <div className="p-2 rounded-2xl bg-teal-50/70 border border-teal-100">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-teal-900">
            <Wind className="w-3 h-3 text-teal-600" />
            <span>{translatePhrase('windRisk', language)}</span>
          </div>
          <span className="text-xs font-black text-teal-950 mt-0.5 block truncate">
            {getRiskLabel(windSpeed > 20, windSpeed > 12)}
          </span>
        </div>
      </div>
    </div>
  );
};

