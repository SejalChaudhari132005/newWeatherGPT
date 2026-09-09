import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface Props {
  score?: number;
  label?: string;
}

export const ConfidenceBadge: React.FC<Props> = ({ score, label }) => {
  if (score === undefined || score === null) return null;

  const isHigh = score >= 80;
  const isMedium = score >= 60 && score < 80;

  const getStyle = () => {
    if (isHigh) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (isMedium) return 'bg-blue-50 text-blue-800 border-blue-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black font-['Arimo'] shadow-2xs ${getStyle()}`}
      title={`Telemetry Confidence Score: ${score}/100 (${label || 'verified'})`}
    >
      <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
      <span>Confidence: {score}/100</span>
    </div>
  );
};
