import React from 'react';
import { CloudRain, Waves } from 'lucide-react';

interface RainfallIntensityFloodGaugeProps {
  rainfallIntensityMmh: number;
  rainfall24hMm: number;
  floodScore: number;
  floodRiskLevel: string;
}

export const RainfallIntensityFloodGauge: React.FC<RainfallIntensityFloodGaugeProps> = ({
  rainfallIntensityMmh,
  rainfall24hMm,
  floodScore,
  floodRiskLevel,
}) => {
  const getRainBarColor = (val: number) => {
    if (val >= 50) return 'bg-[#B42318]';
    if (val >= 25) return 'bg-[#DC2626]';
    if (val >= 10) return 'bg-[#D97706]';
    return 'bg-[#17365D]';
  };

  const getFloodBarColor = (score: number) => {
    if (score >= 75) return 'bg-[#B42318]';
    if (score >= 50) return 'bg-[#DC2626]';
    if (score >= 25) return 'bg-[#D97706]';
    return 'bg-[#006B3C]';
  };

  return (
    <div className="gov-panel bg-white border border-[#D6DCE1] rounded-xs shadow-xs text-[#1F2933]">
      <div className="gov-panel-header bg-white border-b border-[#D6DCE1] px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-[#17365D]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#17365D]">
            Rainfall & Flood Hazard Gauges
          </h3>
        </div>
        <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-widest">
          Hydrologic Triage
        </span>
      </div>

      <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Gauge 1: Precipitation Intensity */}
        <div className="p-3 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1F2933] flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-[#17365D]" />
                Rainfall Rate
              </span>
              <span className="text-xs font-black text-[#17365D]">{rainfallIntensityMmh} mm/h</span>
            </div>

            {/* Progress Bar */}
            <div className="mt-2 h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className={`h-full ${getRainBarColor(rainfallIntensityMmh)} transition-all duration-500`}
                style={{ width: `${Math.min(100, (rainfallIntensityMmh / 60) * 100)}%` }}
              />
            </div>

            <div className="mt-1.5 grid grid-cols-4 text-[8.5px] text-[#5B6770] font-medium text-center">
              <span className="text-left">0 mm</span>
              <span>15 (Mod)</span>
              <span>35 (Hvy)</span>
              <span className="text-right">50+ (Severe)</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-[#5B6770] text-[11px]">24h Total:</span>
            <span className="font-extrabold text-[#1F2933]">{rainfall24hMm} mm</span>
          </div>
        </div>

        {/* Gauge 2: Flood Vulnerability Score */}
        <div className="p-3 rounded-xs bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1F2933] flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-[#D97706]" />
                Flood Vulnerability
              </span>
              <span className="text-xs font-black text-[#B42318] uppercase">
                {floodRiskLevel} ({floodScore}/100)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-2 h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className={`h-full ${getFloodBarColor(floodScore)} transition-all duration-500`}
                style={{ width: `${floodScore}%` }}
              />
            </div>

            <div className="mt-1.5 grid grid-cols-4 text-[8.5px] text-[#5B6770] font-medium text-center">
              <span className="text-left">Low (0-24)</span>
              <span>Mod (25-49)</span>
              <span>High (50-74)</span>
              <span className="text-right">Crit (75+)</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-[#5B6770] text-[11px]">Drainage Status:</span>
            <span className="font-extrabold text-[#B42318] text-right text-[11px] truncate max-w-[170px]">
              {floodScore >= 50 ? 'Immediate Sluice Gate Control' : 'Normal Sump Runoff'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
