import React from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert, Waves, Wind, Clock, CheckCircle2, XCircle, Radio } from 'lucide-react';
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
      border: 'border-emerald-500',
      badgeBg: 'bg-emerald-600 text-white',
      badgeClass: 'gov-badge-success',
      title: 'SAFE TO SAIL',
      marathiTitle: 'सफर सुरक्षित',
      subtitle: 'All fishing craft permitted with routine safety checks',
      icon: ShieldCheck,
      color: 'text-emerald-700',
    },
    caution: {
      border: 'border-amber-500',
      badgeBg: 'bg-amber-600 text-white',
      badgeClass: 'gov-badge-warning',
      title: 'CAUTION ADVISED',
      marathiTitle: 'सावधगिरी बाळगा',
      subtitle: 'Motorized & mechanized vessels only. Near-shore operations recommended.',
      icon: AlertTriangle,
      color: 'text-amber-700',
    },
    no_departure: {
      border: 'border-rose-500',
      badgeBg: 'bg-rose-600 text-white',
      badgeClass: 'gov-badge-danger',
      title: 'NO DEPARTURE - HARBOR RESTRICTION',
      marathiTitle: 'सफर टाळा - बंदर बंदी',
      subtitle: 'Severe wave chop / squall warning. Strictly harbor bound.',
      icon: ShieldAlert,
      color: 'text-rose-700',
    },
  }[clearance.status];

  const StatusIcon = badgeConfig.icon;

  return (
    <div className="gov-panel">
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-[#006B3C] animate-pulse" />
          <span>PORT CLEARANCE & SAILING ADVISORY</span>
        </div>
        <span className={`gov-badge ${badgeConfig.badgeClass} text-[10px]`}>
          IMD / INCOIS VERIFIED
        </span>
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        {/* Primary Verdict Strip */}
        <div className={`p-3 rounded-xs border-l-4 ${badgeConfig.border} bg-[#F8FAFC] border border-[#D6DCE1] flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs text-xs font-black uppercase tracking-wider ${badgeConfig.badgeBg}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{badgeConfig.title}</span>
              </span>
              <span className="text-xs font-bold text-[#17365D]">
                ({badgeConfig.marathiTitle})
              </span>
              {clearance.squall_risk && (
                <span className="gov-badge gov-badge-danger text-[10px] animate-pulse">
                  SQUALL WARNING
                </span>
              )}
            </div>
            <p className="text-xs text-[#5B6770] font-medium leading-normal">
              {badgeConfig.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className="px-3 py-1 bg-[#FF9933] text-slate-950 font-black text-xs rounded-xs uppercase tracking-wider shadow-2xs">
              STATUS: {clearance.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Advisory Explanation Banner */}
        <div className="text-xs text-[#1F2933] bg-white p-3 rounded-xs border border-[#CBD5E1] leading-relaxed">
          <span className="font-bold text-[#17365D]">Operational Guidance: </span>
          {clearance.primary_reason}
        </div>

        {/* 2-Column Telemetry Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="bg-[#F8FAFC] p-3 rounded-xs border border-[#D6DCE1] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5B6770] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Significant Wave Height</span>
              <Waves className="w-4 h-4 text-[#1D5F91]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-[#17365D]">{clearance.max_wave_height_m}</span>
              <span className="text-xs font-bold text-[#5B6770]">meters</span>
            </div>
            <div className="text-[10px] text-[#5B6770] font-semibold mt-1">
              Safety Threshold: {isFavorable ? '< 1.4m (Safe)' : isCaution ? '1.4 - 2.5m (Caution)' : '> 2.5m (Severe)'}
            </div>
          </div>

          <div className="bg-[#F8FAFC] p-3 rounded-xs border border-[#D6DCE1] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5B6770] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Max Coastal Wind Velocity</span>
              <Wind className="w-4 h-4 text-[#006B3C]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-[#17365D]">{clearance.max_wind_speed_kts}</span>
              <span className="text-xs font-bold text-[#5B6770]">knots ({clearance.wind_direction || 'WNW'})</span>
            </div>
            <div className="text-[10px] text-[#5B6770] font-semibold mt-1">
              Safety Threshold: {isFavorable ? '< 16 kts' : isCaution ? '16 - 24 kts' : '> 24 kts'}
            </div>
          </div>
        </div>

        {/* Operational Window Banner */}
        <div className="bg-[#EBF3FA] p-2.5 rounded-xs border border-[#B9D5F3] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-[#17365D] shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-[#17365D] uppercase tracking-wider">Permitted Clearance Window</div>
              <div className="text-xs font-bold text-[#1D5F91] truncate">{clearance.clearance_window || 'Operational All Day'}</div>
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
