import React from 'react';
import { CloudRain, Droplets, Clock, Umbrella } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { translatePhrase } from '../../../utils/dashboardTranslator';

interface FarmRainfallModuleProps {
  todayRainfallMm: number;
  rainProbabilityPct: number;
  peakRainTiming?: string | null;
  next24hRainfallMm?: number;
  next7DaysRainfallMm?: number;
}

export const FarmRainfallModule: React.FC<FarmRainfallModuleProps> = ({
  todayRainfallMm,
  rainProbabilityPct,
  peakRainTiming,
  next24hRainfallMm,
  next7DaysRainfallMm,
}) => {
  const { language } = useLanguage();

  const fallbackPeak =
    rainProbabilityPct > 40
      ? language === 'mr'
        ? 'दुपारी ४ ते ७'
        : language === 'hi'
        ? 'दोपहर ४ से ७'
        : '16:00 – 19:00 IST'
      : language === 'mr'
      ? 'कमी शक्यता'
      : language === 'hi'
      ? 'कम संभावना'
      : 'Low Chance';

  const formattedPeak = peakRainTiming || fallbackPeak;

  return (
    <div className="gov-panel">
      {/* Header */}
      <div className="gov-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-[#006B3C]" />
          <span>{translatePhrase('rainfallOutlook', language).toUpperCase()}</span>
        </div>

        <span
          className={`gov-badge ${
            rainProbabilityPct > 70
              ? 'gov-badge-danger'
              : rainProbabilityPct > 30
              ? 'gov-badge-info'
              : 'gov-badge-neutral'
          }`}
        >
          {rainProbabilityPct}% {translatePhrase('rainProbability', language).toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* 3 Rectangular Telemetry Columns */}
        <div className="grid grid-cols-3 gap-2">
          {/* Today's Expected Rainfall */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#17365D] uppercase">
              <Droplets className="w-3 h-3 text-[#1D5F91]" />
              <span>{translatePhrase('todayRainfall', language)}</span>
            </div>
            <div className="mt-1">
              <span className="text-lg font-bold text-[#1F2933]">
                {todayRainfallMm.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-[#5B6770] ml-1">mm</span>
            </div>
          </div>

          {/* Rain Probability */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#17365D] uppercase">
              <Umbrella className="w-3 h-3 text-[#1D5F91]" />
              <span>{translatePhrase('rainProbability', language)}</span>
            </div>
            <div className="mt-1">
              <span className="text-lg font-bold text-[#1F2933]">
                {rainProbabilityPct}%
              </span>
            </div>
          </div>

          {/* Peak Timing */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#17365D] uppercase">
              <Clock className="w-3 h-3 text-[#1D5F91]" />
              <span>{translatePhrase('peakRainTiming', language)}</span>
            </div>
            <div className="mt-1">
              <span className="text-xs font-bold text-[#1F2933] line-clamp-1">
                {formattedPeak}
              </span>
            </div>
          </div>
        </div>

        {/* Tabular Forecast Breakdown */}
        <div className="border border-[#D6DCE1] rounded-xs overflow-x-auto bg-white text-xs">
          <table className="gov-table w-full text-left">
            <thead>
              <tr>
                <th className="w-1/2">Period</th>
                <th className="w-1/4">Cumulative</th>
                <th className="w-1/4">Assessment</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold text-[#1F2933]">Next 24 Hours Forecast</td>
                <td className="font-bold text-[#1D5F91]">{(next24hRainfallMm ?? todayRainfallMm).toFixed(1)} mm</td>
                <td>
                  <span className={`gov-badge ${(next24hRainfallMm ?? todayRainfallMm) > 20 ? 'gov-badge-warning' : 'gov-badge-success'}`}>
                    {(next24hRainfallMm ?? todayRainfallMm) > 20 ? 'Heavy' : 'Normal'}
                  </span>
                </td>
              </tr>
              {next7DaysRainfallMm !== undefined && (
                <tr>
                  <td className="font-semibold text-[#1F2933]">7-Day Cumulative Outlook</td>
                  <td className="font-bold text-[#1D5F91]">{next7DaysRainfallMm.toFixed(1)} mm</td>
                  <td>
                    <span className="gov-badge gov-badge-info">Weekly Outlook</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
