import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, Activity, Database } from 'lucide-react';
import { ConfidenceAssessment, ProviderStatusItem } from '../../types/weatherIntelligence';

interface Props {
  confidence?: ConfidenceAssessment;
  sourceStatus?: Record<string, ProviderStatusItem>;
}

export const WeatherConfidenceCard: React.FC<Props> = ({ confidence, sourceStatus }) => {
  if (!confidence) return null;

  const getScoreBadge = (score: number, level: string) => {
    if (score >= 80) {
      return {
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        ringColor: 'text-emerald-600',
        label: 'High Confidence',
      };
    }
    if (score >= 50) {
      return {
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        ringColor: 'text-amber-500',
        label: 'Moderate Confidence',
      };
    }
    return {
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      ringColor: 'text-rose-500',
      label: 'Low Confidence',
    };
  };

  const style = getScoreBadge(confidence.score, confidence.level);

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-3 font-['Arimo']">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Activity className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              WeatherGPT Data Confidence
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold">
              Algorithmic verification of data freshness & cross-provider agreement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black border flex items-center gap-1 ${style.badgeBg}`}>
            <span className="text-xs font-black">{confidence.score}/100</span>
            <span className="hidden sm:inline">• {style.label}</span>
          </span>
        </div>
      </div>

      {/* Provider Status Chips */}
      {sourceStatus && Object.keys(sourceStatus).length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {Object.values(sourceStatus).map((p) => {
            const isAvail = p.status === 'available';
            const isDegraded = p.status === 'degraded';
            return (
              <div
                key={p.provider}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1.5 ${
                  isAvail
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : isDegraded
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-rose-50/70 border-rose-200 text-rose-900'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isAvail ? 'bg-emerald-600' : isDegraded ? 'bg-amber-500' : 'bg-rose-600'
                  }`}
                />
                <span>{p.provider}</span>
                {p.latency_ms != null && (
                  <span className="text-[9px] text-slate-500 font-medium">({Math.round(p.latency_ms)}ms)</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Factors / Agreement List */}
      <div className="space-y-1.5 pt-1">
        {confidence.factors.map((factor, idx) => (
          <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{factor}</span>
          </div>
        ))}
        {confidence.conflict_warnings && confidence.conflict_warnings.length > 0 && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Telemetry Variance Notice</span>
            </div>
            {confidence.conflict_warnings.map((w, i) => (
              <p key={i} className="pl-5 leading-tight">{w}</p>
            ))}
          </div>
        )}
      </div>

      <div className="text-[9px] text-slate-400 font-medium italic pt-0.5 text-center">
        Confidence score evaluates data availability, latency, and sensor consistency. Not a meteorological rain probability.
      </div>
    </div>
  );
};
