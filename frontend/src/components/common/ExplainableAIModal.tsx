import React from 'react';
import { X, ShieldCheck, Database, Layers, RefreshCw, Cpu, HelpCircle } from 'lucide-react';
import { useWeather } from '../../context/WeatherContext';
import { DemoBadge } from './DemoBadge';

export const ExplainableAIModal: React.FC = () => {
  const { activeExplainableMsg, setActiveExplainableMsg } = useWeather();

  if (!activeExplainableMsg || !activeExplainableMsg.explainable) return null;

  const { sources, confidenceScore, resolution, updatedAt, rationale } = activeExplainableMsg.explainable;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#17365D]/60 backdrop-blur-xs font-sans animate-fadeIn">
      <div className="bg-white border border-[#D6DCE1] p-4 sm:p-5 max-w-lg w-full shadow-lg relative">
        <button
          onClick={() => setActiveExplainableMsg(null)}
          className="absolute top-3 right-3 p-1.5 text-[#5B6770] hover:text-[#17365D] hover:bg-[#F5F7F9] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-3 border-b border-[#D6DCE1] pb-2.5">
          <div className="p-1.5 bg-[#F5F7F9] border border-[#D6DCE1] text-[#17365D]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#17365D]">Meteorological Rationale & Verification</h3>
            <p className="text-[11px] text-[#5B6770]">Numerical ensemble reasoning breakdown</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="p-3 bg-[#F8FAFC] border border-[#D6DCE1]">
            <div className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider mb-1">
              Consensus Rationale
            </div>
            <p className="text-xs text-[#1F2933] font-medium leading-relaxed">{rationale}</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 bg-white border border-[#D6DCE1]">
              <div className="flex items-center gap-1 text-[11px] text-[#5B6770] mb-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#006B3C]" />
                <span>Confidence Level</span>
              </div>
              <p className="text-lg font-bold text-[#17365D]">
                {confidenceScore}% <span className="text-xs font-normal text-[#006B3C]">(High)</span>
              </p>
            </div>

            <div className="p-2.5 bg-white border border-[#D6DCE1]">
              <div className="flex items-center gap-1 text-[11px] text-[#5B6770] mb-1 font-semibold">
                <Layers className="w-3.5 h-3.5 text-[#1D5F91]" />
                <span>Spatial Resolution</span>
              </div>
              <p className="text-xs font-bold text-[#1F2933] mt-1">{resolution}</p>
            </div>
          </div>
        </div>

        <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] flex items-start gap-2 text-xs text-[#5B6770]">
          <HelpCircle className="w-4 h-4 text-[#1D5F91] shrink-0 mt-0.5" />
          <p className="leading-snug">
            Automated weather intelligence advisory synthesized via observational telemetry and synoptic forecasting.
          </p>
        </div>
      </div>
    </div>
  );
};
