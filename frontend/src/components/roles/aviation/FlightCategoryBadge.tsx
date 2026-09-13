import React from 'react';
import { ShieldCheck, AlertTriangle, Eye, Cloud, ShieldAlert } from 'lucide-react';
import { FlightRules } from '../../../types/aviationIntelligence';

interface FlightCategoryBadgeProps {
  flightRules: FlightRules;
}

export const FlightCategoryBadge: React.FC<FlightCategoryBadgeProps> = ({ flightRules }) => {
  const { category, ceiling_ft_agl, visibility_meters, rationale } = flightRules;

  const categoryConfig = {
    VFR: {
      badgeBg: 'bg-[#006B3C] text-white',
      border: 'border-[#006B3C]',
      title: 'VFR (Visual Flight Rules)',
      subtitle: 'Ceiling ≥ 3,000 ft AGL & Visibility ≥ 5,000m. Unrestricted visual operations.',
      icon: ShieldCheck,
    },
    MVFR: {
      badgeBg: 'bg-[#D97706] text-white',
      border: 'border-[#D97706]',
      title: 'MVFR (Marginal VFR)',
      subtitle: 'Ceiling 1,000–3,000 ft or Visibility 3,000–5,000m. Increased instrument vigilance.',
      icon: AlertTriangle,
    },
    IFR: {
      badgeBg: 'bg-[#B42318] text-white',
      border: 'border-[#B42318]',
      title: 'IFR (Instrument Flight Rules)',
      subtitle: 'Ceiling 500–1,000 ft or Visibility 1,000–3,000m. Instrument approach mandatory.',
      icon: ShieldAlert,
    },
    LVP: {
      badgeBg: 'bg-[#7C3AED] text-white',
      border: 'border-[#7C3AED]',
      title: 'LVP (Low Visibility Procedures)',
      subtitle: 'Ceiling < 500 ft or Visibility < 1,000m. Category II/III ILS active.',
      icon: ShieldAlert,
    },
  }[category] || {
    badgeBg: 'bg-[#006B3C] text-white',
    border: 'border-[#006B3C]',
    title: 'VFR (Visual Flight Rules)',
    subtitle: 'Ceiling ≥ 3,000 ft AGL & Visibility ≥ 5,000m. Unrestricted visual operations.',
    icon: ShieldCheck,
  };

  const IconComponent = categoryConfig.icon;

  return (
    <div className="gov-panel p-3.5 bg-white space-y-3 font-sans">
      {/* 1. Header with Badge */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider ${categoryConfig.badgeBg}`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{category}</span>
            </span>
            <span className="text-xs font-bold text-[#17365D] uppercase tracking-wide">
              Flight Rules & Operating Status
            </span>
          </div>
          <span className="gov-badge gov-badge-info text-[9px]">
            ICAO ANNEX 3
          </span>
        </div>

        <h3 className="text-sm sm:text-base font-bold text-[#17365D]">
          {categoryConfig.title}
        </h3>

        <p className="text-xs text-[#5B6770] font-normal leading-relaxed">
          {categoryConfig.subtitle}
        </p>

        <div className="text-xs text-[#1F2933] bg-[#F8FAFC] p-2.5 rounded-xs border border-[#D6DCE1]">
          {rationale}
        </div>
      </div>

      {/* 2. Ceiling & Visibility 2-Column Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#F8FAFC] p-2.5 rounded-xs border border-[#D6DCE1] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5B6770]">
            <span className="text-[9px] font-bold uppercase tracking-wider">Cloud Base</span>
            <Cloud className="w-3.5 h-3.5 text-[#1D5F91] shrink-0" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black text-[#1F2933] whitespace-nowrap">
              {ceiling_ft_agl ? ceiling_ft_agl.toLocaleString() : 'N/A'}
            </span>
            <span className="text-[10px] font-bold text-[#5B6770]">ft AGL</span>
          </div>
          <div className="text-[10px] text-[#5B6770] truncate mt-0.5">
            {category === 'VFR' ? 'Unrestricted' : 'Instrument Base'}
          </div>
        </div>

        <div className="bg-[#F8FAFC] p-2.5 rounded-xs border border-[#D6DCE1] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5B6770]">
            <span className="text-[9px] font-bold uppercase tracking-wider">Visibility</span>
            <Eye className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black text-[#1F2933] whitespace-nowrap">
              {visibility_meters >= 9999 ? '10k+' : visibility_meters.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold text-[#5B6770]">meters</span>
          </div>
          <div className="text-[10px] text-[#5B6770] truncate mt-0.5">
            RVR / Prevailing
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightCategoryBadge;
