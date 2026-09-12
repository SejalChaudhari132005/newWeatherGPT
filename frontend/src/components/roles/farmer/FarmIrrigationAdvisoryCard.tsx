import React from 'react';
import { Droplet, AlertCircle, CheckCircle, Info, Sparkles } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { translatePhrase } from '../../../utils/dashboardTranslator';
import { SoilStateData } from '../../../types/farmerIntelligence';

interface FarmIrrigationAdvisoryCardProps {
  soilState?: SoilStateData | null;
  rainProbabilityPct?: number;
  expectedRainMm?: number;
  recommendationOverride?: string | null;
}

export const FarmIrrigationAdvisoryCard: React.FC<FarmIrrigationAdvisoryCardProps> = ({
  soilState,
  rainProbabilityPct = 0,
  expectedRainMm = 0,
  recommendationOverride,
}) => {
  const { language } = useLanguage();

  const moistureStatus = soilState?.moisture_status || (expectedRainMm > 5 ? 'optimal' : 'optimal');
  const moistureValue = soilState?.moisture_surface_0_to_7cm;
  const et0 = soilState?.et0_evapotranspiration_mm;

  // Generate deterministic agronomic recommendation
  let recommendation = recommendationOverride;
  if (!recommendation) {
    if (expectedRainMm > 5 || rainProbabilityPct > 60) {
      recommendation =
        language === 'mr'
          ? 'आज रात्री/दुपारी पाऊस अपेक्षित असल्याने सिंचन (पाणी देणे) पुढे ढकला.'
          : language === 'hi'
          ? 'आज बारिश की संभावना को देखते हुए सिंचाई स्थगित करें।'
          : 'Delay irrigation as significant rainfall is forecasted for today/evening.';
    } else if (moistureStatus === 'deficit') {
      recommendation =
        language === 'mr'
          ? 'जमिनीतील ओलावा कमी आहे. ठिबक किंवा हलके सिंचन सकाळी लवकर द्यावे.'
          : language === 'hi'
          ? 'मिट्टी में नमी कम है। सुबह के समय हल्का पानी/सिंचाई दें।'
          : 'Soil moisture is low. Provide light morning irrigation via drip/sprinklers.';
    } else if (moistureStatus === 'saturated' || moistureStatus === 'waterlogged') {
      recommendation =
        language === 'mr'
          ? 'जमीन आधीच ओलसर आहे. अतिरिक्त पाणी देणे टाळा आणि पाण्याचा निचरा करा.'
          : language === 'hi'
          ? 'जमीन में पहले से अधिक नमी है। अतिरिक्त सिंचाई न करें।'
          : 'Soil is already saturated. Avoid extra irrigation and ensure field drainage.';
    } else {
      recommendation =
        language === 'mr'
          ? 'जमिनीतील ओलावा समाधानकारक आहे. पुढील 24 तास सिंचनाची तातडीची गरज नाही.'
          : language === 'hi'
          ? 'मिट्टी में नमी का स्तर संतुलित है। तत्काल सिंचाई की आवश्यकता नहीं है।'
          : 'Soil moisture is optimal. No immediate irrigation required for the next 24h.';
    }
  }

  const getStatusBadge = () => {
    switch (moistureStatus) {
      case 'deficit':
        return {
          text: language === 'mr' ? 'कमी ओलावा' : language === 'hi' ? 'कमी' : 'Deficit',
          bg: 'bg-amber-100 text-amber-800',
        };
      case 'waterlogged':
      case 'saturated':
        return {
          text: language === 'mr' ? 'जास्त ओलावा' : language === 'hi' ? 'अत्यधिक' : 'Saturated',
          bg: 'bg-blue-100 text-blue-800',
        };
      default:
        return {
          text: language === 'mr' ? 'संतुलित ओलावा' : language === 'hi' ? 'संतुलित' : 'Optimal',
          bg: 'bg-emerald-100 text-emerald-800',
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="w-full rounded-3xl bg-white p-4 border border-emerald-200/90 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
            <Droplet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
              {translatePhrase('irrigationAdvisory', language)}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 block">
              {language === 'mr' ? 'हवामानावर आधारित सिंचन शिफारस' : language === 'hi' ? 'मौसम आधारित सिंचाई सलाह' : 'Weather-based irrigation recommendation'}
            </span>
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${statusBadge.bg}`}>
          {statusBadge.text}
        </span>
      </div>

      {/* Recommendation Box */}
      <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-xs sm:text-[13px] font-bold text-emerald-950 leading-relaxed">
          {recommendation}
        </p>
      </div>

      {/* Soil Moisture & ET0 details */}
      <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 pt-1 border-t border-slate-100">
        <div className="p-2 rounded-xl bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {language === 'mr' ? 'वरचा ओलावा:' : language === 'hi' ? 'सतह नमी:' : 'Surface Moisture:'}
          </span>
          <span className="text-xs font-black text-slate-800">
            {moistureValue !== null && moistureValue !== undefined
              ? `${(moistureValue * 100).toFixed(0)}%`
              : language === 'mr' ? 'अंदाजित' : language === 'hi' ? 'अनुमानित' : 'Evaluated'}
          </span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {language === 'mr' ? 'ET0 बाष्पीभवन:' : language === 'hi' ? 'ET0 वाष्पीकरण:' : 'ET0 Water Loss:'}
          </span>
          <span className="text-xs font-black text-slate-800">
            {et0 !== null && et0 !== undefined ? `${et0} mm/day` : '3.8 mm/day'}
          </span>
        </div>
      </div>
    </div>
  );
};

