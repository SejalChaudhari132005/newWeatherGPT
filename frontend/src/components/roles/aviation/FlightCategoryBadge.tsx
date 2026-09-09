import React from 'react';
import { ShieldCheck, AlertTriangle, Eye, Cloud, CheckCircle2, ShieldAlert } from 'lucide-react';
import { FlightRules } from '../../../types/aviationIntelligence';

interface FlightCategoryBadgeProps {
  flightRules: FlightRules;
}

export const FlightCategoryBadge: React.FC<FlightCategoryBadgeProps> = ({ flightRules }) => {
  const { category, ceiling_ft_agl, visibility_meters, rationale } = flightRules;

  const categoryConfig = {
    VFR: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800',
      badgeBg: 'bg-emerald-600 text-white',
      title: '🟢 VFR (Visual Flight Rules)',
      subtitle: 'Ceiling ≥ 3,000 ft AGL & Visibility ≥ 5,000m. Unrestricted visual operations.',
      icon: ShieldCheck,
    },
    MVFR: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-800',
      badgeBg: 'bg-amber-600 text-white',
      title: '🟡 MVFR (Marginal VFR)',
      subtitle: 'Ceiling 1,000–3,000 ft or Visibility 3,000–5,000m. Increased instrument vigilance.',
      icon: AlertTriangle,
    },
    IFR: {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-800',
      badgeBg: 'bg-rose-600 text-white',
      title: '🔴 IFR (Instrument Flight Rules)',
      subtitle: 'Ceiling 500–1,000 ft or Visibility 1,000–3,000m. Instrument approach mandatory.',
      icon: AlertTriangle,
    },
    LVP: {
      bg: 'bg-purple-500/10 border-purple-500/30 text-purple-900',
      badgeBg: 'bg-purple-600 text-white',
      title: '🟣 LVP (Low Visibility Procedures)',
      subtitle: 'Ceiling < 500 ft or Visibility < 1,000m. Category II/III ILS active.',
      icon: ShieldAlert,
    },
  }[category];

  const IconComponent = categoryConfig.icon;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 p-4 sm:p-5 bg-white shadow-xs space-y-3.5">
      {/* Background ambient light */}
      <div
        className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none ${
          category === 'VFR'
            ? 'bg-emerald-500'
            : category === 'MVFR'
            ? 'bg-amber-500'
            : category === 'IFR'
            ? 'bg-rose-500'
            : 'bg-purple-500'
        }`}
      />

      <div className="relative z-10 space-y-3.5">
        {/* Top Header & Rationale */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${categoryConfig.badgeBg}`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                {category}
              </span>
              <span className="text-xs font-bold text-slate-500">Operating Status</span>
            </div>
          </div>

          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {categoryConfig.title}
          </h2>

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {categoryConfig.subtitle}
          </p>

          <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
            {rationale}
          </p>
        </div>

        {/* Ceiling & Visibility 2-Column Hero Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-extrabold uppercase tracking-wider">Cloud Base</span>
              <Cloud className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black text-slate-900 whitespace-nowrap">
                {ceiling_ft_agl ? ceiling_ft_agl.toLocaleString() : 'N/A'}
              </span>
              <span className="text-[10px] font-bold text-slate-500">ft AGL</span>
            </div>
            <div className="text-[9px] text-slate-400 font-medium truncate mt-0.5">
              {category === 'VFR' ? 'Unrestricted' : 'Instrument Base'}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-extrabold uppercase tracking-wider">Visibility</span>
              <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black text-slate-900 whitespace-nowrap">
                {visibility_meters >= 9999 ? '10k+' : visibility_meters.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-500">meters</span>
            </div>
            <div className="text-[9px] text-slate-400 font-medium truncate mt-0.5">
              RVR / Prevailing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
