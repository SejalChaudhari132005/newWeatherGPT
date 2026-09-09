import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { DepartureComparisonResponse, DepartureTimeSlot } from '../../types/route';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  comparison: DepartureComparisonResponse;
  onSelectTime?: (time: string) => void;
}

export const DepartureComparisonCard: React.FC<Props> = ({ comparison, onSelectTime }) => {
  const { language } = useLanguage();

  const getRiskStyle = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'severe':
        return {
          cardBg: 'bg-red-50 border-red-300',
          badgeBg: 'bg-red-600 text-white',
          label: language === 'mr' ? 'अति तीव्र जोखीम' : language === 'hi' ? 'गंभीर जोखिम' : 'Severe Risk',
        };
      case 'high':
        return {
          cardBg: 'bg-orange-50 border-orange-300',
          badgeBg: 'bg-orange-600 text-white',
          label: language === 'mr' ? 'जास्त जोखीम' : language === 'hi' ? 'उच्च जोखिम' : 'High Risk',
        };
      case 'moderate':
        return {
          cardBg: 'bg-amber-50 border-amber-300',
          badgeBg: 'bg-amber-500 text-slate-900',
          label: language === 'mr' ? 'मध्यम जोखीम' : language === 'hi' ? 'मध्यम जोखिम' : 'Moderate Risk',
        };
      case 'low':
      default:
        return {
          cardBg: 'bg-emerald-50 border-emerald-300',
          badgeBg: 'bg-emerald-600 text-white',
          label: language === 'mr' ? 'कमी जोखीम' : language === 'hi' ? 'कम जोखिम' : 'Low Risk',
        };
    }
  };

  const labels = {
    title: language === 'mr' ? 'प्रस्थान वेळ तुलना व शिफारस' : language === 'hi' ? 'प्रस्थान समय तुलना और सिफारिश' : 'Departure Time Weather Comparison',
    recommended: language === 'mr' ? 'सर्वोत्तम शिफारस केलेली वेळ' : language === 'hi' ? 'अनुशंसित प्रस्थान समय' : 'Recommended Window',
    select: language === 'mr' ? 'हा वेळ निवडा' : language === 'hi' ? 'यह समय चुनें' : 'Select Time',
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-md font-['Arimo'] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-blue-100 text-[#004aad]">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            {labels.title}
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold">
            {comparison.origin} → {comparison.destination}
          </p>
        </div>
      </div>

      {/* Recommendation Summary Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200/80 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-black text-[#004aad]">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{labels.recommended}</span>
        </div>
        <p className="text-xs text-slate-800 font-bold leading-relaxed">
          {comparison.recommendation_summary}
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {comparison.comparison.map((slot, idx) => {
          const style = getRiskStyle(slot.overall_risk);
          const isRecommended = slot.departure_time === comparison.recommended_departure;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border ${style.cardBg} space-y-2 relative transition-all ${
                isRecommended ? 'ring-2 ring-[#004aad] shadow-sm' : ''
              }`}
            >
              {isRecommended && (
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-[#004aad] text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                  ★ Best Window
                </span>
              )}

              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {slot.formatted_departure}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    ETA: {slot.arrival_time} (~{slot.duration_minutes} mins)
                  </p>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${style.badgeBg}`}>
                  {style.label}
                </span>
              </div>

              <p className="text-[11px] text-slate-700 font-medium line-clamp-2">
                {slot.top_reason}
              </p>

              {onSelectTime && (
                <button
                  onClick={() => onSelectTime(slot.departure_time)}
                  className="w-full mt-1 py-1.5 rounded-xl bg-white text-slate-800 hover:bg-slate-100 text-[10px] font-black border border-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>{labels.select}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
