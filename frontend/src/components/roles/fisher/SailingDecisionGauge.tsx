import React from 'react';
import { Anchor, AlertTriangle, ShieldCheck, ShieldAlert, Wind, Waves, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { SailingClearance } from '../../../types/fisherIntelligence';

interface SailingDecisionGaugeProps {
  clearance: SailingClearance;
}

export const SailingDecisionGauge: React.FC<SailingDecisionGaugeProps> = ({ clearance }) => {
  const isFavorable = clearance.status === 'favorable';
  const isCaution = clearance.status === 'caution';
  const isNoDeparture = clearance.status === 'no_departure';

  const badgeConfig = {
    favorable: {
      border: 'border-emerald-300',
      badgeBg: 'bg-emerald-600 text-white',
      title: '🟢 SAFE TO SAIL',
      marathiTitle: 'सफर सुरक्षित',
      subtitle: 'All fishing craft permitted with routine safety checks',
      glow: 'shadow-emerald-500/10',
      icon: ShieldCheck,
      color: 'text-emerald-600',
    },
    caution: {
      border: 'border-amber-300',
      badgeBg: 'bg-amber-600 text-white',
      title: '🟡 CAUTION',
      marathiTitle: 'सावधगिरी बाळगा',
      subtitle: 'Motorized & mechanized vessels only. Near-shore runs.',
      glow: 'shadow-amber-500/10',
      icon: AlertTriangle,
      color: 'text-amber-600',
    },
    no_departure: {
      border: 'border-rose-300',
      badgeBg: 'bg-rose-600 text-white',
      title: '🔴 NO DEPARTURE',
      marathiTitle: 'सफर टाळा - बंदर बंदी',
      subtitle: 'Severe wave chop / squall warning. Strictly harbor bound.',
      glow: 'shadow-rose-500/10',
      icon: ShieldAlert,
      color: 'text-rose-600',
    },
  }[clearance.status];

  const StatusIcon = badgeConfig.icon;

  return (
    <div className={`relative overflow-hidden rounded-3xl border ${badgeConfig.border} p-4 sm:p-5 bg-white shadow-sm transition-all ${badgeConfig.glow} space-y-4`}>
      {/* Background ambient gradient */}
      <div
        className={`absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isFavorable ? 'bg-emerald-500' : isCaution ? 'bg-amber-500' : 'bg-rose-500'
        }`}
      />

      <div className="relative z-10 space-y-3">
        {/* Top Status Badges Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${badgeConfig.badgeBg} shadow-2xs`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{clearance.status.replace('_', ' ')}</span>
            </span>
            {clearance.squall_risk && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                Squall Hazard
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            IMD Telemetry
          </span>
        </div>

        {/* Title & Subtitle */}
        <div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">{badgeConfig.title}</h2>
            <span className="text-sm font-bold text-slate-600">({badgeConfig.marathiTitle})</span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1 leading-normal">{badgeConfig.subtitle}</p>
        </div>

        {/* Clearance Rationale */}
        <p className="text-xs text-slate-700 bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80 leading-relaxed font-normal">
          {clearance.primary_reason}
        </p>

        {/* Key Telemetry 2-Column Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Significant Wave</span>
              <Waves className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            </div>
            <div className="mt-1.5 flex items-baseline">
              <span className="text-xl font-black text-slate-900 whitespace-nowrap">{clearance.max_wave_height_m}</span>
              <span className="text-xs font-bold text-slate-500 ml-1 whitespace-nowrap">meters</span>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold mt-1 whitespace-nowrap">
              Limit: {isFavorable ? '< 1.4m' : isCaution ? '1.4 - 2.5m' : '> 2.5m'}
            </div>
          </div>

          <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Coastal Wind</span>
              <Wind className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            </div>
            <div className="mt-1.5 flex items-baseline">
              <span className="text-xl font-black text-slate-900 whitespace-nowrap">{clearance.max_wind_speed_kts}</span>
              <span className="text-xs font-bold text-slate-500 ml-1 whitespace-nowrap">knots</span>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold mt-1 whitespace-nowrap">
              Limit: {isFavorable ? '< 16 kts' : isCaution ? '16 - 24 kts' : '> 24 kts'}
            </div>
          </div>
        </div>

        {/* Clearance Window Banner */}
        <div className="bg-blue-50/90 p-3 rounded-2xl border border-blue-200/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[9px] font-extrabold text-blue-900 uppercase tracking-wider">Clearance Window</div>
              <div className="text-xs font-black text-blue-700 truncate">{clearance.clearance_window || 'Operational All Day'}</div>
            </div>
          </div>
          {isFavorable ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : isCaution ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
};
