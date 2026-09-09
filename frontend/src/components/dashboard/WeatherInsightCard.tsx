import React from 'react';
import {
  Sparkles,
  CloudRain,
  CloudDrizzle,
  Sun,
  Flame,
  Snowflake,
  Wind,
  Eye,
  EyeOff,
  Smile,
  AlertCircle,
} from 'lucide-react';
import { WeatherInsight } from '../../types/weatherIntelligence';
import { useLanguage } from '../../context/LanguageContext';
import { translatePhrase } from '../../utils/dashboardTranslator';

interface Props {
  insights?: WeatherInsight[];
  locationName?: string;
}

export const WeatherInsightCard: React.FC<Props> = ({ insights = [], locationName }) => {
  const { language } = useLanguage();

  if (!insights || insights.length === 0) {
    return null;
  }

  const getInsightIcon = (category: string, iconKey: string) => {
    switch (category) {
      case 'rain':
        return <CloudRain className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'temperature':
        if (iconKey === 'flame') return <Flame className="w-4 h-4 text-rose-600 shrink-0" />;
        if (iconKey === 'snowflake') return <Snowflake className="w-4 h-4 text-cyan-600 shrink-0" />;
        return <Sun className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'uv':
        return <Sun className="w-4 h-4 text-orange-500 shrink-0" />;
      case 'wind':
        return <Wind className="w-4 h-4 text-teal-600 shrink-0" />;
      case 'visibility':
        return <EyeOff className="w-4 h-4 text-purple-600 shrink-0" />;
      case 'comfort':
        return <Smile className="w-4 h-4 text-emerald-600 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#004aad] shrink-0" />;
    }
  };

  const translateInsightHeadline = (headline: string): string => {
    if (language === 'en') return headline;
    const lower = headline.toLowerCase();
    if (lower.includes('rain expected') || lower.includes('rain chance') || lower.includes('precipitation')) {
      return translatePhrase('rainExpectedToday', language);
    }
    if (lower.includes('pleasant') || lower.includes('temperature profile') || lower.includes('comfortable')) {
      return translatePhrase('pleasantTemperature', language);
    }
    return headline;
  };

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-3 font-['Arimo']">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl bg-blue-50 text-[#004aad] border border-blue-100">
            <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate flex items-center gap-1.5">
              {translatePhrase('intelligenceInsightsTitle', language)}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold">
              {language === 'mr' ? `पर्यावरणीय विश्लेषण: ${locationName || 'स्थान'}` : `Deterministic environmental analysis for ${locationName || 'your area'}`}
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#004aad] text-[9px] sm:text-[10px] font-black uppercase shrink-0 border border-blue-200">
          ● Algorithmic
        </span>
      </div>

      {/* Insights List */}
      <div className="space-y-2">
        {insights.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-xl sm:rounded-2xl border transition-all ${
              item.is_advisory
                ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                : 'bg-slate-50/80 border-slate-200/70 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {getInsightIcon(item.category, item.icon)}
                <span className="text-xs font-black truncate">{translateInsightHeadline(item.headline)}</span>
              </div>
              {item.is_advisory && (
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[8px] sm:text-[9px] font-black uppercase tracking-wider shrink-0">
                  {translatePhrase('advisory', language)}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 pt-1 leading-relaxed font-medium pl-6">
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="text-[9px] text-slate-400 font-medium italic pt-0.5 text-center">
        Insights synthesized from Open-Meteo & IMD numerical streams. Not a replacement for government disaster alerts.
      </div>
    </div>
  );
};
