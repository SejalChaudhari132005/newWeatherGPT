import React, { useState } from 'react';
import { Scale, ChevronRight, HelpCircle } from 'lucide-react';
import { OptionComparison } from '../../../../services/farmRouteEngine';
import { useLanguage } from '../../../../context/LanguageContext';

interface FarmRouteCompareCardProps {
  comparisons: OptionComparison[];
  onAskGpt?: (prompt: string) => void;
}

export const FarmRouteCompareCard: React.FC<FarmRouteCompareCardProps> = ({
  comparisons,
  onAskGpt,
}) => {
  const { language } = useLanguage();
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  if (!comparisons || comparisons.length === 0) return null;

  const currentComp = comparisons[activeTabIdx] || comparisons[0];
  const titleText = currentComp.localizedTitle?.[language] || currentComp.title;

  const handleAsk = () => {
    if (onAskGpt) {
      const prompt =
        language === 'mr'
          ? `मला या पर्यायांबद्दल मार्गदर्शन हवे आहे: "${titleText}". हवामानानुसार कोणता पर्याय सर्वात फायदेशीर ठरेल?`
          : language === 'hi'
          ? `मुझे इस विकल्प पर सलाह चाहिए: "${titleText}"। मौसम अनुसार कौन सा विकल्प अधिक लाभकारी रहेगा?`
          : `Compare my farming options for "${titleText}". What is the best decision based on current weather?`;
      onAskGpt(prompt);
    }
  };

  return (
    <div className="gov-panel space-y-3">
      {/* Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#006B3C]" />
          <span>
            {language === 'mr' ? 'शेती पर्यायांची तुलना (TRADE-OFF ANALYSIS)' : language === 'hi' ? 'कृषि विकल्पों की तुलना (TRADE-OFF ANALYSIS)' : 'DECISION TRADE-OFF ANALYSIS'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Tabs / Switcher */}
        {comparisons.length > 1 && (
          <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
            {comparisons.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveTabIdx(i)}
                className={`text-[11px] font-bold py-1 px-3 rounded-xs border transition-colors cursor-pointer truncate ${
                  activeTabIdx === i
                    ? 'bg-[#17365D] text-white border-[#17365D]'
                    : 'bg-[#F8FAFC] text-[#1F2933] border-[#D6DCE1] hover:bg-[#F1F5F9]'
                }`}
              >
                {c.localizedTitle?.[language] || c.title}
              </button>
            ))}
          </div>
        )}

        {/* Side-by-Side Comparison Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Option A */}
          <div
            className={`p-3 rounded-xs border flex flex-col justify-between space-y-2 ${
              currentComp.optionA.isRecommended
                ? 'bg-[#EBF5EE] border-[#006B3C]'
                : 'bg-[#F8FAFC] border-[#D6DCE1]'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1F2933]">
                  {currentComp.optionA.title}
                </span>
                {currentComp.optionA.isRecommended && (
                  <span className="gov-badge gov-badge-success">
                    RECOMMENDED
                  </span>
                )}
              </div>

              <div className="space-y-1 pt-1">
                {currentComp.optionA.points.map((p, idx) => (
                  <div key={idx} className="text-xs text-[#5B6770] font-medium flex items-start gap-1">
                    <span className="text-[#17365D] font-bold">•</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Option B */}
          <div
            className={`p-3 rounded-xs border flex flex-col justify-between space-y-2 ${
              currentComp.optionB.isRecommended
                ? 'bg-[#EBF5EE] border-[#006B3C]'
                : 'bg-[#F8FAFC] border-[#D6DCE1]'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1F2933]">
                  {currentComp.optionB.title}
                </span>
                {currentComp.optionB.isRecommended && (
                  <span className="gov-badge gov-badge-success">
                    RECOMMENDED
                  </span>
                )}
              </div>

              <div className="space-y-1 pt-1">
                {currentComp.optionB.points.map((p, idx) => (
                  <div key={idx} className="text-xs text-[#5B6770] font-medium flex items-start gap-1">
                    <span className="text-[#17365D] font-bold">•</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ask WeatherGPT CTA */}
        <button
          type="button"
          onClick={handleAsk}
          className="w-full py-2 px-3 rounded-xs bg-[#F8FAFC] hover:bg-[#EBF5EE] border border-[#D6DCE1] text-[#17365D] text-xs font-bold transition-colors cursor-pointer flex items-center justify-between"
        >
          <span className="truncate">
            {language === 'mr' ? 'या निर्णयाबद्दल सविस्तर विचारा' : language === 'hi' ? 'इस निर्णय पर सलाह लें' : 'Request Official Expert Evaluation on these Options'}
          </span>
          <ChevronRight className="w-4 h-4 text-[#006B3C] shrink-0" />
        </button>
      </div>
    </div>
  );
};
