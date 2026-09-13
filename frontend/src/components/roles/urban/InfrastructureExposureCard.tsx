import React from 'react';
import { Building2, Train, Hospital, Zap, ShieldAlert } from 'lucide-react';
import { InfrastructureExposureItem } from '../../../types/urbanIntelligence';

interface InfrastructureExposureCardProps {
  infrastructure: InfrastructureExposureItem[];
}

export const InfrastructureExposureCard: React.FC<InfrastructureExposureCardProps> = ({
  infrastructure,
}) => {
  const getExposureBadge = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-[#B42318] text-white border-[#912018]';
      case 'HIGH':
        return 'bg-[#DC2626] text-white border-[#B91C1C]';
      case 'MODERATE':
        return 'bg-[#D97706] text-white border-[#B45309]';
      default:
        return 'bg-[#006B3C] text-white border-[#005530]';
    }
  };

  const getFacilityIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'METRO_STATION':
        return <Train className="w-3.5 h-3.5 text-[#17365D]" />;
      case 'HOSPITAL_ACCESS':
        return <Hospital className="w-3.5 h-3.5 text-[#B42318]" />;
      case 'POWER_SUBSTATION':
        return <Zap className="w-3.5 h-3.5 text-[#D97706]" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-[#17365D]" />;
    }
  };

  return (
    <div className="gov-panel bg-white border border-[#D6DCE1] rounded-xs shadow-xs text-[#1F2933] overflow-hidden font-sans">
      <div className="gov-panel-header flex items-center justify-between px-3.5 py-2.5 bg-[#F8FAFC] border-b border-[#D6DCE1]">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 text-[#17365D] shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#17365D] truncate">
            Critical Infrastructure Exposure ({infrastructure.length})
          </h3>
        </div>
        <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-widest shrink-0">
          Asset Protection
        </span>
      </div>

      <div className="p-3.5 space-y-2.5">
        {infrastructure.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {getFacilityIcon(item.facility_type)}
                  <h4 className="text-xs font-black text-[#1F2933]">{item.facility_name}</h4>
                </div>
                <div className="text-[11px] text-[#5B6770] mt-0.5">
                  Sector / Ward: <span className="font-semibold text-[#1F2933]">{item.location_ward}</span>
                </div>
              </div>

              <span
                className={`px-1.5 py-0.2 rounded-xs text-[9px] font-black uppercase border shrink-0 ${getExposureBadge(
                  item.exposure_level
                )}`}
              >
                {item.exposure_level} Risk
              </span>
            </div>

            <div className="p-2 rounded-xs bg-white border border-[#CBD5E1] text-[11px] text-[#1F2933] space-y-1">
              <div>
                <span className="font-bold text-[#B42318]">Impact Risk: </span>
                {item.operational_impact}
              </div>
              <div className="pt-1 border-t border-[#F1F5F9]">
                <span className="font-bold text-[#006B3C]">Action: </span>
                {item.recommended_action}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
