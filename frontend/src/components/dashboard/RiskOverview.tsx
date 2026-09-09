import React from 'react';
import { AlertCircle, CloudRain, ShieldAlert, Wind, Zap, Sun, Flame, Eye } from 'lucide-react';
import { RiskAssessment } from '../../types/weatherIntelligence';
import { RiskGauge } from '../../data/mockWeather';

interface Props {
  risks?: RiskAssessment;
  legacyRisks?: RiskGauge[];
  onAskGpt: (promptText: string) => void;
}

export const RiskOverview: React.FC<Props> = ({ risks, legacyRisks = [], onAskGpt }) => {
  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'extreme':
        return 'bg-rose-600 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'moderate':
        return 'bg-amber-100 text-amber-900 border border-amber-300';
      case 'low':
      default:
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    }
  };

  const getRiskIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('rain')) return CloudRain;
    if (cat.includes('heat') || cat.includes('thermal')) return Flame;
    if (cat.includes('wind')) return Wind;
    if (cat.includes('thunder') || cat.includes('lightning')) return Zap;
    if (cat.includes('visibility') || cat.includes('fog')) return Eye;
    return Sun;
  };

  // Check if we have verified backend risk items
  const backendRiskItems = risks?.items ? Object.entries(risks.items) : [];

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-3 font-['Arimo']">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#004aad] shrink-0" />
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              Hyperlocal Environmental Risk Matrix
            </h3>
            {risks?.summary && (
              <p className="text-[10px] text-slate-500 font-medium truncate">
                {risks.summary}
              </p>
            )}
          </div>
        </div>
        <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase shrink-0">
          ● Verified Engine
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
        {backendRiskItems.length > 0 ? (
          backendRiskItems.map(([key, item]) => {
            const Icon = getRiskIcon(item.category);
            return (
              <button
                key={key}
                onClick={() => onAskGpt(`Provide safety advice for ${item.category} risk in my location`)}
                className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-sky-50/70 hover:border-[#38b6ff]/50 flex items-center justify-between text-left transition-all cursor-pointer group gap-2"
              >
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                  <div className="p-2 rounded-xl bg-white text-slate-700 shadow-2xs group-hover:text-[#004aad] shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-slate-900 group-hover:text-[#004aad] truncate">
                      {item.category}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium truncate">
                      {item.reason}
                    </div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0 ${getRiskColor(item.level)}`}>
                  {item.level}
                </span>
              </button>
            );
          })
        ) : (
          legacyRisks.map((risk, idx) => {
            const Icon = getRiskIcon(risk.type);
            return (
              <button
                key={idx}
                onClick={() => onAskGpt(`Tell me more about the ${risk.type} risk in my location`)}
                className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-sky-50/70 hover:border-[#38b6ff]/50 flex items-center justify-between text-left transition-all cursor-pointer group gap-2"
              >
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                  <div className="p-2 rounded-xl bg-white text-slate-700 shadow-2xs group-hover:text-[#004aad] shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-slate-900 group-hover:text-[#004aad] truncate">
                      {risk.type}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium truncate">
                      {risk.description}
                    </div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0 ${risk.color}`}>
                  {risk.level}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="text-[9px] text-slate-400 font-medium italic pt-0.5 text-center">
        {risks?.disclaimer || 'WeatherGPT algorithmic risk assessment. Official safety directives are provided via IMD warnings.'}
      </div>
    </div>
  );
};
