import React, { useState } from 'react';
import { NWPComparisonResponse } from '../../../types/researcher';
import { Info, MapPin, CheckCircle2 } from 'lucide-react';

interface NWPModelComparisonPanelProps {
  data?: NWPComparisonResponse | null;
  comparisonData?: NWPComparisonResponse | null;
  locationName?: string;
}

export const NWPModelComparisonPanel: React.FC<NWPModelComparisonPanelProps> = ({
  data,
  comparisonData,
  locationName,
}) => {
  const [activeHighlightModel, setActiveHighlightModel] = useState<string>('GFS');

  const resolvedData = data || comparisonData;

  const models: any = resolvedData?.models || {};
  const consensus_level = resolvedData?.consensus_level || 'High';
  const consensus_summary =
    resolvedData?.consensus_summary || 'All 3 models indicate high probability of rainfall.';
  const disagreement_analysis =
    resolvedData?.disagreement_analysis ||
    'Model disagreement: GFS and ECMWF differ by 4% in rainfall probability.';
  const locName = resolvedData?.location_name || locationName || 'Mumbai';
  const forecast_period = resolvedData?.forecast_period || '13 – 16 Sep 2025';

  const gfs = models.GFS || { temperature_c: 31, rainfall_prob_pct: 72, wind_speed_kmh: 18, humidity_pct: 82 };
  const ecmwf = models.ECMWF || { temperature_c: 30, rainfall_prob_pct: 68, wind_speed_kmh: 21, humidity_pct: 78 };
  const imd = models.IMD_WRF || { temperature_c: 31, rainfall_prob_pct: 75, wind_speed_kmh: 19, humidity_pct: 85 };

  return (
    <div className="bg-white border border-[#D6DCE1] rounded-xs p-3.5 sm:p-4 shadow-xs flex flex-col font-sans h-full">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#D6DCE1] mb-2.5">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs sm:text-sm font-bold text-[#17365D] uppercase tracking-wide">
            NWP Model Comparison
          </h3>
          <Info className="w-3.5 h-3.5 text-[#5B6770] cursor-pointer" />
        </div>
      </div>

      {/* 2. Location & Date Period */}
      <div className="flex items-center gap-1.5 text-xs text-[#5B6770] font-medium mb-3">
        <MapPin className="w-3.5 h-3.5 text-[#006B3C] shrink-0" />
        <span>{locName}</span>
        <span className="text-[#D6DCE1]">&middot;</span>
        <span className="font-mono text-[11px]">{forecast_period}</span>
      </div>

      {/* 3. Model Selector Segmented Pills */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-[#F1F5F9] rounded-xs mb-3 border border-[#E2E8F0]">
        {(['GFS', 'ECMWF', 'IMD/WRF'] as const).map((m) => {
          const isSelected = activeHighlightModel === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setActiveHighlightModel(m)}
              className={`py-1 text-xs font-bold rounded-xs transition-colors cursor-pointer text-center ${
                isSelected
                  ? 'bg-[#0284C7] text-white shadow-xs'
                  : 'text-[#5B6770] hover:text-[#1F2933] hover:bg-white/60'
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* 4. Structured Multi-Model Parameter Table */}
      <div className="overflow-x-auto mb-3">
        <table className="w-full text-xs text-left border border-[#D6DCE1]">
          <thead className="bg-[#F8FAFC] border-b border-[#D6DCE1] text-[#5B6770] uppercase text-[10px]">
            <tr>
              <th className="py-2 px-2.5 font-bold">Parameter</th>
              <th className={`py-2 px-2 font-bold text-center ${activeHighlightModel === 'GFS' ? 'bg-sky-50 text-[#0284C7]' : ''}`}>
                GFS
              </th>
              <th className={`py-2 px-2 font-bold text-center ${activeHighlightModel === 'ECMWF' ? 'bg-sky-50 text-[#0284C7]' : ''}`}>
                ECMWF
              </th>
              <th className={`py-2 px-2 font-bold text-center ${activeHighlightModel === 'IMD/WRF' ? 'bg-sky-50 text-[#0284C7]' : ''}`}>
                IMD/WRF
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-[#1F2933]">
            <tr>
              <td className="py-2 px-2.5 font-medium text-[#5B6770]">Temperature (°C)</td>
              <td className="py-2 px-2 text-center font-bold font-mono">{gfs.temperature_c}°</td>
              <td className="py-2 px-2 text-center font-bold font-mono">{ecmwf.temperature_c}°</td>
              <td className="py-2 px-2 text-center font-bold font-mono">{imd.temperature_c}°</td>
            </tr>
            <tr>
              <td className="py-2 px-2.5 font-medium text-[#5B6770]">Rainfall Prob. (%)</td>
              <td className="py-2 px-2 text-center font-bold font-mono text-[#006B3C]">{gfs.rainfall_prob_pct}%</td>
              <td className="py-2 px-2 text-center font-bold font-mono text-[#006B3C]">{ecmwf.rainfall_prob_pct}%</td>
              <td className="py-2 px-2 text-center font-bold font-mono text-[#006B3C]">{imd.rainfall_prob_pct}%</td>
            </tr>
            <tr>
              <td className="py-2 px-2.5 font-medium text-[#5B6770]">Wind Speed (km/h)</td>
              <td className="py-2 px-2 text-center font-bold font-mono">{gfs.wind_speed_kmh}</td>
              <td className="py-2 px-2 text-center font-bold font-mono">{ecmwf.wind_speed_kmh}</td>
              <td className="py-2 px-2 text-center font-bold font-mono">{imd.wind_speed_kmh}</td>
            </tr>
            <tr>
              <td className="py-2 px-2.5 font-medium text-[#5B6770]">Humidity (%)</td>
              <td className="py-2 px-2 text-center font-bold font-mono">{gfs.humidity_pct}%</td>
              <td className="py-2 px-2 text-center font-bold font-mono">{ecmwf.humidity_pct}%</td>
              <td className="py-2 px-2 text-center font-bold font-mono">{imd.humidity_pct}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Model Consensus Callout */}
      <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-2.5 rounded-xs mb-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-[#166534] uppercase tracking-wide">
            Model Consensus
          </span>
          <span className="px-2 py-0.5 bg-[#22C55E] text-white text-[10px] font-bold rounded-xs flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {consensus_level}
          </span>
        </div>
        <p className="text-xs text-[#166534] font-medium">
          {consensus_summary}
        </p>
      </div>

      {/* 6. Model Disagreement Notice */}
      <div className="text-[11px] text-[#5B6770] flex items-start gap-1.5 bg-[#F8FAFC] border border-[#D6DCE1] p-2 rounded-xs mt-auto">
        <Info className="w-3.5 h-3.5 text-[#0284C7] shrink-0 mt-0.5" />
        <span>{disagreement_analysis}</span>
      </div>
    </div>
  );
};
