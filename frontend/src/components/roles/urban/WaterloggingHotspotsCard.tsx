import React from 'react';
import { Waves, AlertTriangle, ArrowDownRight, Activity } from 'lucide-react';
import { WaterloggingHotspotItem } from '../../../types/urbanIntelligence';

interface WaterloggingHotspotsCardProps {
  hotspots: WaterloggingHotspotItem[];
  onOpenChatWithPrompt?: (prompt: string) => void;
}

export const WaterloggingHotspotsCard: React.FC<WaterloggingHotspotsCardProps> = ({
  hotspots,
  onOpenChatWithPrompt,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-[#B42318] text-white border-[#912018]';
      case 'SURCHARGED':
        return 'bg-[#DC2626] text-white border-[#B91C1C]';
      case 'AT CAPACITY':
        return 'bg-[#D97706] text-white border-[#B45309]';
      default:
        return 'bg-[#006B3C] text-white border-[#005530]';
    }
  };

  const getDepthColor = (depth: number) => {
    if (depth >= 35) return 'text-[#B42318] font-black';
    if (depth >= 20) return 'text-[#DC2626] font-black';
    if (depth >= 10) return 'text-[#D97706] font-bold';
    return 'text-[#006B3C] font-bold';
  };

  return (
    <div className="gov-panel bg-white border border-[#D6DCE1] rounded-xs shadow-xs text-[#1F2933] overflow-hidden font-sans">
      <div className="gov-panel-header flex items-center justify-between px-3.5 py-2.5 bg-[#F8FAFC] border-b border-[#D6DCE1]">
        <div className="flex items-center gap-2 min-w-0">
          <Waves className="w-4 h-4 text-[#17365D] shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#17365D] truncate">
            Waterlogging Hotspots Triage ({hotspots.length})
          </h3>
        </div>
        <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-widest shrink-0">
          Underpass & Lowland Sump
        </span>
      </div>

      <div className="p-3.5 space-y-2.5">
        {hotspots.map((spot, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] space-y-2"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-xs font-black text-[#1F2933]">{spot.hotspot_name}</h4>
                  <span
                    className={`px-1.5 py-0.2 rounded-xs text-[9px] font-black uppercase border ${getStatusBadge(
                      spot.drainage_status
                    )}`}
                  >
                    {spot.drainage_status}
                  </span>
                </div>
                <div className="text-[11px] text-[#5B6770] mt-0.5">
                  Ward: <span className="font-semibold text-[#1F2933]">{spot.ward_name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[9px] text-[#5B6770] uppercase">Predicted Depth</div>
                  <div className={`text-xs ${getDepthColor(spot.predicted_water_depth_cm)}`}>
                    {spot.predicted_water_depth_cm} cm
                  </div>
                </div>

                <div className="text-right border-l border-[#D6DCE1] pl-2">
                  <div className="text-[9px] text-[#5B6770] uppercase">Elevation Dip</div>
                  <div className="text-xs font-black text-[#1F2933]">
                    -{spot.elevation_dip_m} m
                  </div>
                </div>
              </div>
            </div>

            {/* Engineering Mitigation Directive */}
            <div className="p-2 rounded-xs bg-white border border-[#CBD5E1] text-[11px] text-[#1F2933] leading-relaxed">
              <span className="font-bold text-[#17365D]">Engineering Action: </span>
              {spot.mitigation_action}
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#5B6770] pt-0.5">
              <span>Risk Level: <strong className="text-[#1F2933]">{spot.risk_level}</strong></span>
              {onOpenChatWithPrompt && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenChatWithPrompt(
                      `What are the immediate civil pumping and traffic diversion SOPs for ${spot.hotspot_name} in ${spot.ward_name}?`
                    )
                  }
                  className="text-[#17365D] hover:underline font-bold transition-colors cursor-pointer"
                >
                  Ask Municipal Bot &rarr;
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
