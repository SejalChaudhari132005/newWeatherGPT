import React, { useState } from 'react';
import { NWPComparisonResponse } from '../../../types/researcher';

interface ForecastComparisonChartProps {
  data?: NWPComparisonResponse | null;
  locationName?: string;
}

export const ForecastComparisonChart: React.FC<ForecastComparisonChartProps> = ({ data, locationName }) => {
  const [activeVariable, setActiveVariable] = useState<'Temperature' | 'Rainfall' | 'Wind' | 'Humidity'>('Temperature');

  const dates = data?.timeline_dates || ['13 Sep', '14 Sep', '15 Sep', '16 Sep'];

  // Multi-model data series
  const gfs = data?.models?.GFS?.hourly_series || [
    { temp: 31.0, rain: 24.5, wind: 18, humidity: 82 },
    { temp: 29.8, rain: 36.5, wind: 22, humidity: 85 },
    { temp: 32.0, rain: 16.5, wind: 16, humidity: 78 },
    { temp: 32.8, rain: 4.0, wind: 13, humidity: 74 },
  ];
  const ecmwf = data?.models?.ECMWF?.hourly_series || [
    { temp: 30.0, rain: 21.0, wind: 21, humidity: 78 },
    { temp: 29.0, rain: 29.0, wind: 23, humidity: 80 },
    { temp: 31.8, rain: 16.0, wind: 20, humidity: 76 },
    { temp: 32.5, rain: 6.0, wind: 17, humidity: 72 },
  ];
  const imd = data?.models?.IMD_WRF?.hourly_series || [
    { temp: 31.0, rain: 28.0, wind: 19, humidity: 85 },
    { temp: 29.5, rain: 43.0, wind: 24, humidity: 89 },
    { temp: 31.5, rain: 18.0, wind: 16, humidity: 80 },
    { temp: 32.2, rain: 5.0, wind: 13, humidity: 78 },
  ];

  const getValues = (series: any[]) => {
    switch (activeVariable) {
      case 'Temperature':
        return series.map((s) => s.temp ?? 30);
      case 'Rainfall':
        return series.map((s) => s.rain ?? 20);
      case 'Wind':
        return series.map((s) => s.wind ?? 18);
      case 'Humidity':
        return series.map((s) => s.humidity ?? 80);
    }
  };

  const gfsVals = getValues(gfs);
  const ecmwfVals = getValues(ecmwf);
  const imdVals = getValues(imd);

  const allVals = [...gfsVals, ...ecmwfVals, ...imdVals];
  const minVal = Math.floor(Math.min(...allVals) - 1);
  const maxVal = Math.ceil(Math.max(...allVals) + 1);
  const range = maxVal - minVal || 1;

  // SVG coordinate mapper
  const getY = (val: number) => {
    const norm = (val - minVal) / range;
    return 130 - norm * 100; // 30 to 130 height
  };

  const getPoints = (vals: number[]) => {
    return vals.map((v, i) => `${40 + i * 80},${getY(v)}`).join(' ');
  };

  const unit = activeVariable === 'Temperature' ? '°C' : activeVariable === 'Rainfall' ? 'mm' : activeVariable === 'Wind' ? 'km/h' : '%';

  const locLabel = (data?.location_name || locationName || 'Mumbai').split(',')[0];

  return (
    <div className="bg-white border border-[#D6DCE1] rounded-xs p-3.5 shadow-xs flex flex-col font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-[#D6DCE1] mb-2">
        <h3 className="text-xs font-bold text-[#17365D] uppercase tracking-wide">
          Forecast Comparison ({locLabel})
        </h3>
        <div className="flex items-center gap-2.5 text-[11px] font-bold">
          <span className="flex items-center gap-1 text-[#0284C7]">
            <span className="w-2 h-2 rounded-full bg-[#0284C7] inline-block" /> GFS
          </span>
          <span className="flex items-center gap-1 text-[#F59E0B]">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block" /> ECMWF
          </span>
          <span className="flex items-center gap-1 text-[#10B981]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block" /> IMD/WRF
          </span>
        </div>
      </div>

      <div className="text-[11px] text-[#5B6770] mb-1 font-semibold">
        {activeVariable} ({unit})
      </div>

      {/* Multi-Line Curve SVG */}
      <div className="relative w-full h-[150px] overflow-hidden">
        <svg viewBox="0 0 320 150" className="w-full h-full">
          {/* Y-Axis Gridlines & Labels */}
          <line x1="30" y1="30" x2="310" y2="30" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="30" y1="80" x2="310" y2="80" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="30" y1="130" x2="310" y2="130" stroke="#E2E8F0" strokeWidth="1" />

          <text x="24" y="34" textAnchor="end" fontSize="9" fill="#94A3B8" fontFamily="monospace">
            {maxVal}
          </text>
          <text x="24" y="84" textAnchor="end" fontSize="9" fill="#94A3B8" fontFamily="monospace">
            {Math.round((maxVal + minVal) / 2)}
          </text>
          <text x="24" y="134" textAnchor="end" fontSize="9" fill="#94A3B8" fontFamily="monospace">
            {minVal}
          </text>

          {/* GFS Polyline */}
          <polyline fill="none" stroke="#0284C7" strokeWidth="2.5" points={getPoints(gfsVals)} />
          {gfsVals.map((v, i) => (
            <circle key={`gfs-${i}`} cx={40 + i * 80} cy={getY(v)} r="3.5" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1" />
          ))}

          {/* ECMWF Polyline */}
          <polyline fill="none" stroke="#F59E0B" strokeWidth="2.5" points={getPoints(ecmwfVals)} />
          {ecmwfVals.map((v, i) => (
            <circle key={`ecm-${i}`} cx={40 + i * 80} cy={getY(v)} r="3.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1" />
          ))}

          {/* IMD WRF Polyline */}
          <polyline fill="none" stroke="#10B981" strokeWidth="2.5" points={getPoints(imdVals)} />
          {imdVals.map((v, i) => (
            <circle key={`imd-${i}`} cx={40 + i * 80} cy={getY(v)} r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
          ))}

          {/* X-Axis Date Labels */}
          {dates.map((d, i) => (
            <text key={d} x={40 + i * 80} y="146" textAnchor="middle" fontSize="9.5" fill="#64748B" fontWeight="600">
              {d}
            </text>
          ))}
        </svg>
      </div>

      {/* Variable Switcher Pills */}
      <div className="grid grid-cols-4 gap-1 mt-2 pt-2 border-t border-[#EEF2F6]">
        {(['Temperature', 'Rainfall', 'Wind', 'Humidity'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setActiveVariable(v)}
            className={`py-1 text-[11px] font-bold rounded-xs transition-colors cursor-pointer text-center ${
              activeVariable === v
                ? 'bg-[#0284C7] text-white'
                : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#5B6770]'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
};
