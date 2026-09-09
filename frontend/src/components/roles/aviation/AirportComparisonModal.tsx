import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Plane, ShieldCheck, AlertTriangle, ShieldAlert, Loader2, Sparkles } from 'lucide-react';
import { AirportCatalogItem, AirportComparisonData } from '../../../types/aviationIntelligence';
import { aviationIntelligenceService } from '../../../services/aviationIntelligenceService';

interface AirportComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: AirportCatalogItem[];
  defaultOriginIcao?: string;
  defaultDestIcao?: string;
}

export const AirportComparisonModal: React.FC<AirportComparisonModalProps> = ({
  isOpen,
  onClose,
  catalog,
  defaultOriginIcao = 'VABB',
  defaultDestIcao = 'VAPO',
}) => {
  const [originIcao, setOriginIcao] = useState(defaultOriginIcao);
  const [destIcao, setDestIcao] = useState(defaultDestIcao);
  const [comparison, setComparison] = useState<AirportComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = async (orig: string, dest: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await aviationIntelligenceService.compareAirports(orig, dest);
      setComparison(data);
    } catch (err: any) {
      console.error('[AirportComparisonModal] Comparison error:', err);
      setError('Could not load airport comparison.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComparison(originIcao, destIcao);
    }
  }, [isOpen, originIcao, destIcao]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-2xl bg-indigo-100 text-indigo-700 shrink-0">
              <Plane className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                Route Weather & Aerodrome Comparison
              </h3>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                Origin vs Destination Landing Vectors
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Airport Selectors Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          {/* Origin Selector */}
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Origin Aerodrome
            </label>
            <select
              value={originIcao}
              onChange={(e) => setOriginIcao(e.target.value)}
              className="w-full text-xs font-extrabold p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {catalog.map((a) => (
                <option key={a.icao} value={a.icao}>
                  {a.icao} ({a.iata}) — {a.city}
                </option>
              ))}
            </select>
          </div>

          {/* Swap / Arrow Icon */}
          <div className="flex justify-center text-slate-400 sm:pt-4">
            <ArrowRight className="w-4 h-4 hidden sm:block text-indigo-500" />
            <span className="sm:hidden text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">to destination</span>
          </div>

          {/* Destination Selector */}
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Destination Aerodrome
            </label>
            <select
              value={destIcao}
              onChange={(e) => setDestIcao(e.target.value)}
              className="w-full text-xs font-extrabold p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {catalog.map((a) => (
                <option key={a.icao} value={a.icao}>
                  {a.icao} ({a.iata}) — {a.city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2.5 text-slate-400">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <span className="text-xs font-bold">Calculating flight vector comparisons...</span>
            </div>
          ) : comparison ? (
            <>
              {/* Enroute Risk & Summary Banner */}
              <div
                className={`p-3.5 rounded-2xl border flex flex-col gap-1.5 ${
                  comparison.enroute_risk_level === 'high'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : comparison.enroute_risk_level === 'moderate'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider">
                    Enroute Risk: {comparison.enroute_risk_level.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/80 border border-current whitespace-nowrap">
                    Favorable: {comparison.favorable_airport}
                  </span>
                </div>
                <p className="text-xs font-medium leading-relaxed">
                  {comparison.comparative_summary}
                </p>
              </div>

              {/* Side-by-Side Airport Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Origin Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-mono font-black text-xs">
                        {comparison.origin.icao}
                      </span>
                      <span className="text-xs font-black text-slate-900 truncate">
                        {comparison.origin.city}
                      </span>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 shrink-0">
                      {comparison.origin.flight_rules.category}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Active Runway:</span>
                      <span className="font-black text-slate-800 whitespace-nowrap">
                        RWY {comparison.origin.active_runway.runway_id} ({comparison.origin.active_runway.runway_heading_deg}°)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Crosswind Vector:</span>
                      <span className="font-black text-slate-800 whitespace-nowrap">
                        {comparison.origin.active_runway.crosswind_kts} kts ({comparison.origin.active_runway.crosswind_direction})
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Cloud Ceiling:</span>
                      <span className="font-black text-slate-800 whitespace-nowrap">
                        {comparison.origin.flight_rules.ceiling_ft_agl ? `${comparison.origin.flight_rules.ceiling_ft_agl.toLocaleString()} ft` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Visibility:</span>
                      <span className="font-black text-slate-800 whitespace-nowrap">
                        {comparison.origin.flight_rules.visibility_meters.toLocaleString()} m
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Convective Risk:</span>
                      <span className="font-black uppercase text-slate-800 whitespace-nowrap">
                        {comparison.origin.convective_risk} (CAPE {Math.round(comparison.origin.cape_j_kg || 0)})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Destination Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-mono font-black text-xs">
                        {comparison.destination.icao}
                      </span>
                      <span className="text-xs font-black text-slate-900 truncate">
                        {comparison.destination.city}
                      </span>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 shrink-0">
                      {comparison.destination.flight_rules.category}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Active Runway:</span>
                      <span className="font-black text-slate-800 whitespace-nowrap">
                        RWY {comparison.destination.active_runway.runway_id} ({comparison.destination.active_runway.runway_heading_deg}°)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Crosswind Vector:</span>
                      <span className="font-black text-slate-800 whitespace-nowrap">
                        {comparison.destination.active_runway.crosswind_kts} kts ({comparison.destination.active_runway.crosswind_direction})
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Cloud Ceiling:</span>
                      <span className="font-black text-slate-800 whitespace-nowrap">
                        {comparison.destination.flight_rules.ceiling_ft_agl ? `${comparison.destination.flight_rules.ceiling_ft_agl.toLocaleString()} ft` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Visibility:</span>
                      <span className="font-black text-slate-800 whitespace-nowrap">
                        {comparison.destination.flight_rules.visibility_meters.toLocaleString()} m
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Convective Risk:</span>
                      <span className="font-black uppercase text-slate-800 whitespace-nowrap">
                        {comparison.destination.convective_risk} (CAPE {Math.round(comparison.destination.cape_j_kg || 0)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              {error || 'No comparison data available.'}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
