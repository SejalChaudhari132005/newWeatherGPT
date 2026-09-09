import React from 'react';
import { ShieldAlert, Bug, Activity, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { PestDiseaseRisk } from '../../../types/farmerIntelligence';

interface PestDiseaseRiskCardProps {
  risks: PestDiseaseRisk[];
  cropName: string;
}

export const PestDiseaseRiskCard: React.FC<PestDiseaseRiskCardProps> = ({ risks, cropName }) => {
  if (!risks || risks.length === 0) {
    return null;
  }

  const getRiskBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black uppercase">HIGH RISK</span>;
      case 'moderate':
        return <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-black uppercase">MODERATE</span>;
      case 'low':
      default:
        return <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-black uppercase">LOW</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-100 text-rose-800 rounded-xl shrink-0">
            <Bug className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Crop Pest & Disease Risk</h3>
            <p className="text-[11px] text-slate-500">Weather-triggered alerts & IPM remedies</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
          {cropName}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x pb-1 -mx-1 px-1">
        {risks.map((risk, idx) => (
          <div
            key={idx}
            className={`min-w-[260px] max-w-[300px] shrink-0 snap-center p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
              risk.risk_level === 'high'
                ? 'bg-rose-50/70 border-rose-200'
                : risk.risk_level === 'moderate'
                ? 'bg-amber-50/70 border-amber-200'
                : 'bg-emerald-50/70 border-emerald-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <ShieldAlert
                    className={`w-4 h-4 shrink-0 ${
                      risk.risk_level === 'high'
                        ? 'text-rose-600'
                        : risk.risk_level === 'moderate'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  />
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                    {risk.disease_or_pest_name}
                  </span>
                </div>
                <div className="shrink-0">{getRiskBadge(risk.risk_level)}</div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="text-slate-600 leading-relaxed text-[11px]">
                  <strong className="text-slate-800 font-semibold">Trigger: </strong>
                  {risk.favorable_conditions}
                </div>
              </div>
            </div>

            <div className="mt-2.5 p-2.5 rounded-xl bg-white/90 border border-slate-200/80 text-slate-800 font-medium leading-relaxed text-xs">
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Action / Remedy (उपाययोजना):</span>
              </div>
              <span className="text-[11px] leading-relaxed block">{risk.preventive_action}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
