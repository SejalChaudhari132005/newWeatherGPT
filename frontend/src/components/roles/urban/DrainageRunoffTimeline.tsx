import React from 'react';
import { Clock, Droplets, Activity } from 'lucide-react';
import { DrainageRunoffMetricItem } from '../../../types/urbanIntelligence';

interface DrainageRunoffTimelineProps {
  timeline: DrainageRunoffMetricItem[];
}

export const DrainageRunoffTimeline: React.FC<DrainageRunoffTimelineProps> = ({ timeline }) => {
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SURCHARGED':
        return 'bg-[#FEF2F2] text-[#B42318] border-[#FCA5A5]';
      case 'NEAR CAPACITY':
        return 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
      default:
        return 'bg-[#F0FDF4] text-[#006B3C] border-[#BBF7D0]';
    }
  };

  return (
    <div className="gov-panel bg-white border border-[#D6DCE1] rounded-xs shadow-xs text-[#1F2933] overflow-hidden font-sans">
      <div className="gov-panel-header flex items-center justify-between px-3.5 py-2.5 bg-[#F8FAFC] border-b border-[#D6DCE1]">
        <div className="flex items-center gap-2 min-w-0">
          <Droplets className="w-4 h-4 text-[#17365D] shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#17365D] truncate">
            Drainage Runoff Timeline (Rational Method Q = C·I·A)
          </h3>
        </div>
        <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-widest shrink-0">
          Hydrograph
        </span>
      </div>

      <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {timeline.map((item, idx) => {
          const ratio = Math.min(100, Math.round((item.runoff_volume_m3_per_hr / item.drainage_capacity_m3_per_hr) * 100));
          const isOver = item.runoff_volume_m3_per_hr > item.drainage_capacity_m3_per_hr;

          return (
            <div
              key={idx}
              className="p-3 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between space-y-2"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#1F2933] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#17365D]" />
                    {item.time_window}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded-xs text-[9px] font-black uppercase border ${getStatusBadge(
                      item.capacity_status
                    )}`}
                  >
                    {item.capacity_status}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="text-[#5B6770]">Rain: <strong className="text-[#1F2933]">{item.projected_rainfall_mm} mm</strong></span>
                  <span className="text-[11px] font-black text-[#17365D]">
                    {item.runoff_volume_m3_per_hr.toLocaleString()} / {item.drainage_capacity_m3_per_hr.toLocaleString()} m³/h
                  </span>
                </div>

                {/* Progress bar comparison */}
                <div className="mt-1.5 h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isOver ? 'bg-[#B42318]' : ratio > 75 ? 'bg-[#D97706]' : 'bg-[#006B3C]'
                    }`}
                    style={{ width: `${Math.min(100, ratio)}%` }}
                  />
                </div>
              </div>

              <div className="pt-1.5 border-t border-[#E2E8F0] flex items-center justify-between text-[10px] text-[#5B6770]">
                <span>Surcharge Load:</span>
                <span className={`font-bold ${isOver ? 'text-[#B42318]' : 'text-[#1F2933]'}`}>
                  {ratio}% of design spec
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
