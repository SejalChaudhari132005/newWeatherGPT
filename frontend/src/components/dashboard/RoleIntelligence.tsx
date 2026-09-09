import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { RoleIntelligenceDetail } from '../../data/mockWeather';

interface Props {
  intelligence: RoleIntelligenceDetail;
  roleTitle: string;
  onAskGpt: (promptText: string) => void;
  onOpenRoleDashboard?: () => void;
}

export const RoleIntelligence: React.FC<Props> = ({ intelligence, roleTitle, onAskGpt, onOpenRoleDashboard }) => {
  const getStatusBadge = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'warning':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      default:
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    }
  };

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-3 sm:space-y-4 font-['Arimo']">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-sky-100 text-[#004aad] shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">WeatherGPT Intelligence</h3>
            <p className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">{intelligence.heading}</p>
          </div>
        </div>

        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-sky-50 text-[#004aad] text-[9px] sm:text-[10px] font-black uppercase tracking-wider border border-sky-200 shrink-0">
          {roleTitle}
        </span>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {intelligence.metrics.map((m, idx) => (
          <div key={idx} className="p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase truncate">{m.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase border shrink-0 ${getStatusBadge(m.status)}`}>
                {m.status}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-900 truncate">{m.value}</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight">{m.detail}</div>
          </div>
        ))}
      </div>

      {/* Recommendation & Direct Action */}
      <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-sky-50/80 border border-sky-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-start gap-2 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-[#004aad] shrink-0 mt-0.5" />
          <div className="min-w-0 text-[11px] sm:text-xs">
            <span className="font-extrabold text-[#004aad]">Action: </span>
            <span className="text-slate-800 font-medium">{intelligence.recommendation}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {onOpenRoleDashboard && (
            <button
              onClick={onOpenRoleDashboard}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-sm flex items-center justify-center gap-1 shrink-0 cursor-pointer active:scale-98"
            >
              <span>🌾 Open {roleTitle} Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onAskGpt(`Provide a detailed ${roleTitle} weather advisory for ${intelligence.heading}`)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#004aad] hover:bg-[#003882] text-white font-extrabold text-[11px] shadow-sm flex items-center justify-center gap-1 shrink-0 cursor-pointer active:scale-98"
          >
            <span>Ask WeatherGPT</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
