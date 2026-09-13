import React, { useState } from 'react';
import { ClimateAnomalyMetrics } from '../../../types/researcher';
import { AlertTriangle } from 'lucide-react';

interface ClimateAnalyticsCardProps {
  data?: ClimateAnomalyMetrics | null;
  metrics?: ClimateAnomalyMetrics | null;
}

export const ClimateAnalyticsCard: React.FC<ClimateAnalyticsCardProps> = ({ data, metrics }) => {
  const [activeParam, setActiveParam] = useState<'Temperature' | 'Rainfall' | 'Wind' | 'Extreme Events'>('Temperature');

  const resolved = data || metrics;

  const points = resolved?.historical_trend_points || [
    { year: 1990, anomaly_c: -0.15 },
    { year: 2000, anomaly_c: 0.10 },
    { year: 2010, anomaly_c: 0.58 },
    { year: 2020, anomaly_c: 0.95 },
    { year: 2025, anomaly_c: 1.20 },
  ];

  // SVG dimensions: 300 x 110
  const minAnom = -0.5;
  const maxAnom = 2.0;
  const range = maxAnom - minAnom;

  const getY = (val: number) => 100 - ((val - minAnom) / range) * 85;
  const getX = (index: number) => 35 + index * ((260) / (points.length - 1 || 1));

  const pathD = points.reduce((acc, p, idx) => {
    const cmd = idx === 0 ? 'M' : 'L';
    return `${acc} ${cmd} ${getX(idx)},${getY(p.anomaly_c)}`;
  }, '');

  const areaD = `${pathD} L ${getX(points.length - 1)},100 L ${getX(0)},100 Z`;

  return (
    <div className="bg-white border border-[#D6DCE1] rounded-xs p-3.5 shadow-xs flex flex-col font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-[#D6DCE1] mb-2">
        <h3 className="text-xs font-bold text-[#17365D] uppercase tracking-wide">
          Climate Analytics
        </h3>

        {/* Param Selector Pills */}
        <div className="flex items-center gap-1 bg-[#F1F5F9] p-0.5 rounded-xs border border-[#E2E8F0] overflow-x-auto max-w-[200px] no-scrollbar">
          {(['Temperature', 'Rainfall', 'Wind', 'Extreme Events'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setActiveParam(p)}
              className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded-xs transition-colors whitespace-nowrap cursor-pointer ${
                activeParam === p
                  ? 'bg-[#0284C7] text-white'
                  : 'text-[#5B6770] hover:text-[#1F2933]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-[#5B6770] font-semibold mb-1">
        Temperature Anomaly (°C)
      </div>

      {/* Anomaly Trend Area Chart */}
      <div className="relative w-full h-[120px]">
        <svg viewBox="0 0 300 120" className="w-full h-full">
          {/* Grid lines */}
          <line x1="30" y1="20" x2="295" y2="20" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="30" y1="60" x2="295" y2="60" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="30" y1="100" x2="295" y2="100" stroke="#E2E8F0" strokeWidth="1" />

          {/* Zero baseline dashed */}
          <line x1="30" y1={getY(0)} x2="295" y2={getY(0)} stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3, 3" />

          <text x="24" y="24" textAnchor="end" fontSize="8.5" fill="#94A3B8" fontFamily="monospace">+2</text>
          <text x="24" y="64" textAnchor="end" fontSize="8.5" fill="#94A3B8" fontFamily="monospace">+1</text>
          <text x="24" y="104" textAnchor="end" fontSize="8.5" fill="#94A3B8" fontFamily="monospace">0</text>

          {/* Gradient Shaded Area */}
          <defs>
            <linearGradient id="anomGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#anomGrad)" />
          <path d={pathD} fill="none" stroke="#F97316" strokeWidth="2.5" />

          {/* Points */}
          {points.map((p, idx) => (
            <circle key={p.year} cx={getX(idx)} cy={getY(p.anomaly_c)} r="2.5" fill="#EA580C" stroke="#FFFFFF" strokeWidth="1" />
          ))}

          {/* X Axis Year Labels */}
          {points.filter((_, i) => i % 2 === 0).map((p) => {
            const idx = points.findIndex((x) => x.year === p.year);
            return (
              <text key={p.year} x={getX(idx)} y="116" textAnchor="middle" fontSize="8.5" fill="#64748B">
                {p.year}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Baseline Callout */}
      <div className="bg-[#FFFBEB] border border-[#FDE68A] p-2 rounded-xs flex items-center gap-1.5 text-xs text-[#92400E] mt-2">
        <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
        <div className="text-[11px] font-medium leading-tight">
          <strong>Current anomaly: +1.2°C</strong> (vs. 1991–2020 baseline)
        </div>
      </div>
    </div>
  );
};
