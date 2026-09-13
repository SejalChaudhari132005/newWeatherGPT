import React from 'react';
import {
  X,
  AlertTriangle,
  CloudLightning,
  CloudRain,
  Wind,
  Layers,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Compass,
  Clock,
  Radio,
  ExternalLink,
  ChevronRight,
  Crosshair,
  MessageSquare,
} from 'lucide-react';
import { WeatherHazardFeature } from '../../../../types/skyroute';

interface SkyRouteHazardDetailPanelProps {
  hazard: WeatherHazardFeature;
  onClose: () => void;
  onFocusOnMap?: (coordinates: [number, number]) => void;
  onAskCopilot?: (prompt: string) => void;
}

export const SkyRouteHazardDetailPanel: React.FC<SkyRouteHazardDetailPanelProps> = ({
  hazard,
  onClose,
  onFocusOnMap,
  onAskCopilot,
}) => {
  const getHazardIcon = () => {
    switch (hazard.type) {
      case 'thunderstorm':
        return <CloudLightning className="w-4 h-4 text-amber-300" />;
      case 'rain':
        return <CloudRain className="w-4 h-4 text-sky-200" />;
      case 'wind':
        return <Wind className="w-4 h-4 text-emerald-200" />;
      case 'turbulence':
        return <Layers className="w-4 h-4 text-amber-200" />;
      case 'visibility':
        return <Eye className="w-4 h-4 text-slate-200" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-300" />;
    }
  };

  const getSeverityBadge = () => {
    switch (hazard.severity) {
      case 'SEVERE':
        return 'bg-[#7F1D1D] text-white border border-[#991B1B]';
      case 'HIGH':
        return 'bg-[#B42318] text-white border border-[#912018]';
      case 'MODERATE':
        return 'bg-[#B7791F] text-white border border-[#975A16]';
      default:
        return 'bg-[#1D5F91] text-white border border-[#17476F]';
    }
  };

  const getImpactBadge = () => {
    switch (hazard.route_impact) {
      case 'INTERSECTION':
        return 'bg-[#B42318] text-white';
      case 'NEAR ROUTE':
        return 'bg-[#B7791F] text-white';
      default:
        return 'bg-[#5B6770] text-white';
    }
  };

  return (
    <div className="gov-panel p-3.5 bg-white space-y-3 font-sans shadow-md border border-[#D6DCE1] rounded-xs select-text">
      {/* 1. Header Bar */}
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#D6DCE1]">
        <div className="flex items-start gap-2 min-w-0">
          <div className="w-8 h-8 rounded-none bg-[#17365D] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            {getHazardIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`px-1.5 py-0.2 rounded-xs text-[9px] font-black uppercase ${getSeverityBadge()}`}>
                {hazard.severity} SEVERITY
              </span>
              <span className={`px-1.5 py-0.2 rounded-xs text-[9px] font-black uppercase ${getImpactBadge()}`}>
                {hazard.route_impact}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-[#17365D] mt-0.5 leading-snug">
              {hazard.title}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-[#F1F5F9] text-[#5B6770] rounded-xs transition-colors cursor-pointer shrink-0"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Structured Data Table */}
      <div className="overflow-x-auto">
        <table className="gov-table text-xs">
          <tbody>
            <tr>
              <td className="font-bold text-[#5B6770] w-1/3 bg-[#F8FAFC]">
                Location / Sector:
              </td>
              <td className="font-bold text-[#1F2933]">
                {hazard.location_description}
              </td>
            </tr>
            <tr>
              <td className="font-bold text-[#5B6770] bg-[#F8FAFC]">
                Distance from Corridor:
              </td>
              <td className="font-bold text-[#1F2933]">
                {hazard.distance_from_corridor_km === 0 ? (
                  <span className="text-[#B42318]">0 km (Direct Route Intersection)</span>
                ) : (
                  <span>{hazard.distance_from_corridor_km} km offset from flight corridor</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="font-bold text-[#5B6770] bg-[#F8FAFC]">
                Expected Active Window:
              </td>
              <td className="font-mono text-[#1F2933]">
                {hazard.expected_time_window}
              </td>
            </tr>
            <tr>
              <td className="font-bold text-[#5B6770] bg-[#F8FAFC]">
                Route Operational Impact:
              </td>
              <td className="font-medium text-[#1F2933]">
                {hazard.operational_impact}
              </td>
            </tr>
            {hazard.parameters && Object.keys(hazard.parameters).length > 0 && (
              <tr>
                <td className="font-bold text-[#5B6770] bg-[#F8FAFC]">
                  Meteorological Telemetry:
                </td>
                <td className="font-mono text-[#1F2933]">
                  {Object.entries(hazard.parameters)
                    .map(([k, v]) => `${k.replace('_', ' ').toUpperCase()}: ${v}`)
                    .join(' • ')}
                </td>
              </tr>
            )}
            <tr>
              <td className="font-bold text-[#5B6770] bg-[#F8FAFC]">
                Data Source & Timestamp:
              </td>
              <td className="text-[11px] text-[#5B6770]">
                {hazard.source} • Updated {hazard.updated_at}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#D6DCE1]">
        {onFocusOnMap && (
          <button
            type="button"
            onClick={() => onFocusOnMap(hazard.coordinates_center)}
            className="px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#17365D] border border-[#D6DCE1] text-xs font-bold uppercase rounded-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <Crosshair className="w-3.5 h-3.5 text-[#17365D]" />
            <span>Focus on Map</span>
          </button>
        )}

        {onAskCopilot && (
          <button
            type="button"
            onClick={() =>
              onAskCopilot(
                `Tell me more about the weather risk of ${hazard.title} (${hazard.hazard_id}) near ${hazard.location_description} and explain the flight corridor impact.`
              )
            }
            className="px-3 py-1.5 bg-[#006B3C] hover:bg-[#004D2C] text-white text-xs font-bold uppercase rounded-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ml-auto"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Copilot</span>
          </button>
        )}
      </div>
    </div>
  );
};
