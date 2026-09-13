import React from 'react';
import { Building2, Users, MapPin } from 'lucide-react';
import { VulnerableZoneItem } from '../../../types/disasterIntelligence';

interface VulnerableZonesTriageCardProps {
  zones: VulnerableZoneItem[];
}

export const VulnerableZonesTriageCard: React.FC<VulnerableZonesTriageCardProps> = ({
  zones,
}) => {
  const getRiskBadge = (risk: string) => {
    switch (risk.toUpperCase()) {
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

  const getReadinessPill = (ready: string) => {
    switch (ready.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-[#B42318] text-white font-black';
      case 'ALERT':
        return 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] font-bold';
      default:
        return 'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]';
    }
  };

  return (
    <div className="gov-panel bg-white border border-[#D6DCE1] rounded-xs shadow-xs text-[#1F2933]">
      <div className="gov-panel-header bg-white border-b border-[#D6DCE1] px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#17365D]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#17365D]">
            Vulnerable Administrative Zones ({zones.length})
          </h3>
        </div>
        <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-widest">
          Infrastructure Triage
        </span>
      </div>

      <div className="p-3.5 space-y-2.5">
        {zones.map((zone, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] space-y-2"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-[#1F2933]">{zone.zone_name}</h4>
                  <span
                    className={`px-1.5 py-0.2 rounded-xs text-[9px] font-black uppercase border ${getRiskBadge(
                      zone.risk_level
                    )}`}
                  >
                    {zone.risk_level}
                  </span>
                </div>
                <div className="text-[11px] text-[#5B6770] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-[#17365D]" />
                  <span>{zone.taluka_or_ward}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-[#5B6770] flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#5B6770]" />
                  {zone.exposed_population.toLocaleString()} pop.
                </span>
                <span
                  className={`px-2 py-0.5 rounded-xs text-[9px] uppercase ${getReadinessPill(
                    zone.evacuation_readiness
                  )}`}
                >
                  {zone.evacuation_readiness}
                </span>
              </div>
            </div>

            {/* Critical Infrastructure Chips */}
            {zone.critical_infrastructure.length > 0 && (
              <div className="pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#5B6770]">Critical Assets:</span>
                {zone.critical_infrastructure.map((infra, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded-xs bg-white text-[10px] text-[#17365D] border border-[#CBD5E1] font-medium"
                  >
                    {infra}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
