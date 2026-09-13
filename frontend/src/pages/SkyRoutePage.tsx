import React, { useState, useEffect } from 'react';
import {
  Plane,
  Navigation,
  RefreshCw,
  AlertTriangle,
  ArrowRightLeft,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Compass,
} from 'lucide-react';
import { SkyRouteMap } from '../components/roles/aviation/skyroute/SkyRouteMap';
import { SkyRouteHazardDetailPanel } from '../components/roles/aviation/skyroute/SkyRouteHazardDetailPanel';
import { skyrouteService } from '../services/skyrouteService';
import { SkyRouteData, WeatherHazardFeature } from '../types/skyroute';

interface SkyRoutePageProps {
  onBack?: () => void;
  onAskGpt?: (prompt: string) => void;
}

export const SkyRoutePage: React.FC<SkyRoutePageProps> = ({ onBack, onAskGpt }) => {
  const [originInput, setOriginInput] = useState('BOM');
  const [destinationInput, setDestinationInput] = useState('DEL');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<SkyRouteData | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<WeatherHazardFeature | null>(null);

  // Layer toggles
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState({
    route: true,
    corridor: true,
    thunderstorms: true,
    rain: true,
    turbulence: true,
    visibility: true,
    warnings: true,
  });

  const loadRoute = async (orig = originInput, dest = destinationInput) => {
    setLoading(true);
    setError(null);
    setSelectedHazard(null);

    setLoadingStep('Resolving flight coordinates & geodesic corridor...');
    await new Promise((r) => setTimeout(r, 120));

    setLoadingStep('Sampling atmospheric conditions along route...');
    await new Promise((r) => setTimeout(r, 120));

    setLoadingStep('Evaluating weather hazard intersection & risk index...');

    try {
      const data = await skyrouteService.getSkyRouteAnalysis(orig, dest);
      setRouteData(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate SkyRoute corridor.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  useEffect(() => {
    loadRoute('BOM', 'DEL');
  }, []);

  const handleSwap = () => {
    const temp = originInput;
    setOriginInput(destinationInput);
    setDestinationInput(temp);
    loadRoute(destinationInput, temp);
  };

  const toggleLayer = (key: keyof typeof visibleLayers) => {
    setVisibleLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Quick route selector presets
  const quickRoutes = [
    { label: 'BOM → DEL', from: 'BOM', to: 'DEL' },
    { label: 'DEL → BLR', from: 'DEL', to: 'BLR' },
    { label: 'BOM → CCU', from: 'BOM', to: 'CCU' },
    { label: 'HYD → DEL', from: 'HYD', to: 'DEL' },
    { label: 'MAA → BOM', from: 'MAA', to: 'BOM' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7F9] font-sans text-[#1F2933]">
      {/* 1. Official Government Aviation Header */}
      <header className="bg-[#17365D] text-white border-b-2 border-[#006B3C] px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="px-2.5 py-1 text-xs font-semibold bg-[#1F4270] hover:bg-[#285590] text-white rounded-xs border border-[#3E659A] transition-colors cursor-pointer"
                title="Return to Aviation Dashboard"
              >
                ← Return
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#006B3C] rounded-xs text-white">
                <Plane className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold tracking-wider font-mono">
                    SKYROUTE
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#006B3C] text-white font-bold rounded-xs uppercase tracking-wider">
                    Aviation Intelligence
                  </span>
                </div>
                <p className="text-[11px] text-gray-300">
                  “See the weather before you fly through it.”
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="hidden sm:inline text-gray-300 text-[11px]">
              IMD &middot; DGCA Decision Support
            </span>
            <button
              onClick={() => loadRoute()}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#006B3C] hover:bg-[#008249] text-white font-medium text-xs rounded-xs border border-[#005530] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Weather</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 flex-1 flex flex-col gap-4">
        {/* 2. Flight Route Input Panel (Rectangular Gov Panel) */}
        <section className="bg-white border border-[#D6DCE1] rounded-xs p-3 sm:p-4 shadow-sm">
          <div className="text-xs font-bold text-[#5B6770] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Flight Corridor Selector</span>
            <span className="text-[11px] font-normal text-[#5B6770]">
              Supports IATA code, City name, or Airport
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadRoute();
            }}
            className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5"
          >
            {/* Origin Input */}
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-[#17365D] uppercase mb-1">
                FROM (Departure)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={originInput}
                  onChange={(e) => setOriginInput(e.target.value)}
                  placeholder="e.g. BOM / Mumbai"
                  className="w-full bg-[#F5F7F9] border border-[#D6DCE1] rounded-xs px-3 py-1.5 text-xs font-semibold text-[#1F2933] focus:outline-none focus:border-[#006B3C] focus:bg-white"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex items-end justify-center self-center md:self-end mb-0.5">
              <button
                type="button"
                onClick={handleSwap}
                className="p-1.5 bg-[#EEF2F6] hover:bg-[#D6DCE1] border border-[#D6DCE1] text-[#17365D] rounded-xs transition-colors cursor-pointer"
                title="Swap departure and destination"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Input */}
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-[#17365D] uppercase mb-1">
                TO (Destination)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  placeholder="e.g. DEL / Delhi"
                  className="w-full bg-[#F5F7F9] border border-[#D6DCE1] rounded-xs px-3 py-1.5 text-xs font-semibold text-[#1F2933] focus:outline-none focus:border-[#006B3C] focus:bg-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-end md:self-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs uppercase tracking-wider rounded-xs border border-[#6D28D9] shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>View Weather Corridor</span>
              </button>
            </div>
          </form>

          {/* Quick Route Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-[#EEF2F6] text-[11px]">
            <span className="font-semibold text-[#5B6770]">Quick Routes:</span>
            {quickRoutes.map((qr) => (
              <button
                key={qr.label}
                type="button"
                onClick={() => {
                  setOriginInput(qr.from);
                  setDestinationInput(qr.to);
                  loadRoute(qr.from, qr.to);
                }}
                className={`px-2 py-0.5 rounded-xs border transition-colors cursor-pointer ${
                  originInput === qr.from && destinationInput === qr.to
                    ? 'bg-[#17365D] text-white border-[#17365D] font-bold'
                    : 'bg-[#F5F7F9] hover:bg-[#EEF2F6] text-[#1F2933] border-[#D6DCE1]'
                }`}
              >
                {qr.label}
              </button>
            ))}
          </div>
        </section>

        {/* Loading / Error Banner */}
        {loading && (
          <div className="bg-[#17365D] text-white p-3 rounded-xs flex items-center justify-between text-xs border-l-4 border-[#006B3C] shadow-sm animate-pulse">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#287D3C]" />
              <span className="font-medium">{loadingStep || 'Analyzing Weather Corridor...'}</span>
            </div>
            <span className="text-[11px] text-gray-300">Geodesic Corridor Analysis</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-[#B42318] p-3 rounded-xs border border-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3. MAP-FIRST SECTION (Dominates 65-75% Viewport) */}
        {routeData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Map Column (65-70% on desktop: lg:col-span-8) */}
            <div className="lg:col-span-8 flex flex-col gap-2">
              {/* Map Bar / Controls */}
              <div className="bg-white border border-[#D6DCE1] rounded-xs p-2 flex items-center justify-between text-xs shadow-sm">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#006B3C]" />
                  <span className="font-bold text-[#17365D] uppercase tracking-wide">
                    {routeData.origin.iata || routeData.origin.icao} ➔ {routeData.destination.iata || routeData.destination.icao} Corridor
                  </span>
                  <span className="text-[#5B6770] text-[11px] hidden sm:inline">
                    ({routeData.distance_km} km &middot; Great Circle)
                  </span>
                </div>

                {/* Layer Control Dropdown Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setShowLayerMenu(!showLayerMenu)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-[#F5F7F9] hover:bg-[#EEF2F6] border border-[#D6DCE1] text-[#1F2933] font-medium text-xs rounded-xs cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#17365D]" />
                    <span>Weather Layers</span>
                    {showLayerMenu ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {/* Layer Control Menu Popover */}
                  {showLayerMenu && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-[#D6DCE1] shadow-lg rounded-xs z-50 p-2 text-xs">
                      <div className="font-bold text-[#5B6770] uppercase text-[10px] pb-1 border-b border-[#D6DCE1] mb-1.5">
                        Active Map Layers
                      </div>
                      <div className="space-y-1.5 text-[#1F2933]">
                        <label className="flex items-center justify-between cursor-pointer hover:bg-[#F5F7F9] p-1 rounded-xs">
                          <span>Flight Route</span>
                          <input
                            type="checkbox"
                            checked={visibleLayers.route}
                            onChange={() => toggleLayer('route')}
                            className="accent-[#006B3C]"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer hover:bg-[#F5F7F9] p-1 rounded-xs">
                          <span>Weather Corridor</span>
                          <input
                            type="checkbox"
                            checked={visibleLayers.corridor}
                            onChange={() => toggleLayer('corridor')}
                            className="accent-[#17365D]"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer hover:bg-[#F5F7F9] p-1 rounded-xs">
                          <span className="text-[#B42318] font-semibold">Thunderstorms</span>
                          <input
                            type="checkbox"
                            checked={visibleLayers.thunderstorms}
                            onChange={() => toggleLayer('thunderstorms')}
                            className="accent-[#B42318]"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer hover:bg-[#F5F7F9] p-1 rounded-xs">
                          <span className="text-[#1D5F91]">Precipitation / Rain</span>
                          <input
                            type="checkbox"
                            checked={visibleLayers.rain}
                            onChange={() => toggleLayer('rain')}
                            className="accent-[#1D5F91]"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer hover:bg-[#F5F7F9] p-1 rounded-xs">
                          <span className="text-[#B7791F]">Wind / Turbulence</span>
                          <input
                            type="checkbox"
                            checked={visibleLayers.turbulence}
                            onChange={() => toggleLayer('turbulence')}
                            className="accent-[#B7791F]"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer hover:bg-[#F5F7F9] p-1 rounded-xs">
                          <span>Aviation Warnings</span>
                          <input
                            type="checkbox"
                            checked={visibleLayers.warnings}
                            onChange={() => toggleLayer('warnings')}
                            className="accent-[#7C3AED]"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Leaflet Map Box (Height: ~480px on desktop, ~360px on mobile) */}
              <div className="border border-[#D6DCE1] rounded-xs overflow-hidden shadow-sm h-[360px] sm:h-[440px] md:h-[500px]">
                <SkyRouteMap
                  data={routeData}
                  selectedHazardId={selectedHazard?.hazard_id || null}
                  onSelectHazard={setSelectedHazard}
                  visibleLayers={visibleLayers}
                />
              </div>

              {/* Interactive Hazard Instruction Hint */}
              <div className="text-[11px] text-[#5B6770] flex items-center justify-between px-1">
                <span>
                  💡 <strong>Interaction:</strong> Tap any colored weather hazard cell on the map to inspect distance, impact, and meteorological validity.
                </span>
                <span className="text-[#17365D] font-mono">50 km Corridor Buffer</span>
              </div>
            </div>

            {/* Sidebar Column (30-35% on desktop: lg:col-span-4) */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              {/* Selected Hazard Inspector Panel (if active) */}
              {selectedHazard ? (
                <SkyRouteHazardDetailPanel
                  hazard={selectedHazard}
                  onClose={() => setSelectedHazard(null)}
                />
              ) : null}

              {/* 4. Route Weather Risk Summary */}
              <section className="bg-white border border-[#D6DCE1] rounded-xs p-3.5 shadow-sm">
                <div className="text-xs font-bold text-[#5B6770] uppercase tracking-wider mb-2 pb-1 border-b border-[#D6DCE1] flex items-center justify-between">
                  <span>Route Weather Summary</span>
                  <span className="text-[10px] text-[#006B3C] font-semibold">Grounded Analysis</span>
                </div>

                {/* Score and Level Badge */}
                <div className="flex items-center justify-between bg-[#F5F7F9] p-2.5 rounded-xs border border-[#D6DCE1] mb-3">
                  <div>
                    <div className="text-[10px] text-[#5B6770] uppercase font-bold">
                      Weather Risk Index
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold font-mono text-[#1F2933]">
                        {routeData.risk_summary.score}
                      </span>
                      <span className="text-xs text-[#5B6770]">/ 100</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-bold rounded-xs uppercase tracking-wider ${
                        routeData.risk_summary.level === 'HIGH' || routeData.risk_summary.level === 'SEVERE'
                          ? 'bg-red-100 text-[#B42318] border border-red-200'
                          : routeData.risk_summary.level === 'MODERATE'
                          ? 'bg-amber-100 text-[#B7791F] border border-amber-200'
                          : 'bg-green-100 text-[#287D3C] border border-green-200'
                      }`}
                    >
                      {routeData.risk_summary.level} RISK
                    </span>
                    <div className="text-[10px] text-[#5B6770] mt-0.5">
                      Confidence: <strong>{routeData.risk_summary.confidence}</strong>
                    </div>
                  </div>
                </div>

                {/* Quantitative Metric Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="p-2 bg-[#F5F7F9] rounded-xs border border-[#D6DCE1]">
                    <div className="text-[10px] text-[#5B6770] uppercase">Hazards Detected</div>
                    <div className="text-base font-bold font-mono text-[#1F2933]">
                      {routeData.risk_summary.total_hazards}
                    </div>
                  </div>
                  <div className="p-2 bg-[#F5F7F9] rounded-xs border border-[#D6DCE1]">
                    <div className="text-[10px] text-[#5B6770] uppercase">Route Intersections</div>
                    <div className="text-base font-bold font-mono text-[#B42318]">
                      {routeData.risk_summary.route_intersections}
                    </div>
                  </div>
                </div>

                {/* Major Concern */}
                <div className="text-xs bg-[#FFFBEB] border border-[#FDE68A] p-2 rounded-xs text-[#92400E] mb-2">
                  <strong className="uppercase text-[10px] tracking-wide block">Major Concern:</strong>
                  <span>{routeData.risk_summary.major_concern}</span>
                </div>

                {/* Parameters Available */}
                <div className="text-[11px] text-[#5B6770] flex justify-between">
                  <span>Available parameters:</span>
                  <span className="font-semibold text-[#1F2933]">
                    {routeData.risk_summary.available_parameters_count} / {routeData.risk_summary.total_parameters_count} Active
                  </span>
                </div>
              </section>

              {/* 5. AI Grounded Weather Briefing */}
              <section className="bg-white border border-[#D6DCE1] rounded-xs p-3.5 shadow-sm">
                <div className="text-xs font-bold text-[#17365D] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#006B3C]" />
                    AI Weather Brief
                  </span>
                  <span className="text-[10px] font-mono text-[#5B6770]">IMD Grounded</span>
                </div>
                <p className="text-xs text-[#1F2933] leading-relaxed mb-2 bg-[#F8FAFC] p-2 rounded-xs border border-[#E2E8F0]">
                  {routeData.ai_weather_brief}
                </p>
                <div className="text-[10px] text-[#5B6770] flex items-center justify-between">
                  <span>Derived from live atmospheric & route geometry</span>
                  {onAskGpt && (
                    <button
                      onClick={() =>
                        onAskGpt(
                          `Explain aviation route weather considerations for flight ${routeData.origin.iata || routeData.origin.icao} to ${routeData.destination.iata || routeData.destination.icao} with current risk score ${routeData.risk_summary.score}/100 and ${routeData.risk_summary.major_concern}`
                        )
                      }
                      className="text-[#7C3AED] hover:underline font-semibold cursor-pointer"
                    >
                      Ask WeatherGPT →
                    </button>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* 6. ROUTE WEATHER BREAKDOWN (3 Flight Stages) */}
        {routeData && (
          <section className="bg-white border border-[#D6DCE1] rounded-xs p-3.5 sm:p-4 shadow-sm">
            <div className="text-xs font-bold text-[#5B6770] uppercase tracking-wider mb-3 pb-1 border-b border-[#D6DCE1] flex items-center justify-between">
              <span>Route Weather Breakdown (Flight Stages)</span>
              <span className="text-[11px] text-[#5B6770]">Departure &middot; En-Route &middot; Arrival</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Departure Card */}
              <div className="border border-[#D6DCE1] rounded-xs p-3 bg-[#F5F7F9]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-[#006B3C] text-white text-[10px] font-bold rounded-xs uppercase">
                      DEPARTURE
                    </span>
                    <span className="font-bold text-xs text-[#1F2933]">
                      {routeData.stages.departure.location_name}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs ${
                      routeData.stages.departure.risk_level === 'LOW'
                        ? 'bg-green-100 text-[#287D3C]'
                        : routeData.stages.departure.risk_level === 'MODERATE'
                        ? 'bg-amber-100 text-[#B7791F]'
                        : 'bg-red-100 text-[#B42318]'
                    }`}
                  >
                    {routeData.stages.departure.risk_level}
                  </span>
                </div>
                <p className="text-xs text-[#1F2933] font-medium mb-2">
                  {routeData.stages.departure.summary}
                </p>
                <div className="space-y-1 text-[11px] text-[#5B6770] border-t border-[#D6DCE1] pt-1.5">
                  <div className="flex justify-between">
                    <span>Visibility:</span>
                    <span className="font-semibold text-[#1F2933]">
                      {routeData.stages.departure.visibility_km} km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wind:</span>
                    <span className="font-semibold text-[#1F2933]">
                      {routeData.stages.departure.wind_kts} kt
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conditions:</span>
                    <span className="font-semibold text-[#1F2933]">
                      {routeData.stages.departure.weather_condition}
                    </span>
                  </div>
                </div>
              </div>

              {/* En-Route Card */}
              <div className="border border-[#D6DCE1] rounded-xs p-3 bg-[#F5F7F9]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-[#17365D] text-white text-[10px] font-bold rounded-xs uppercase">
                      EN-ROUTE
                    </span>
                    <span className="font-bold text-xs text-[#1F2933]">
                      {routeData.stages.enroute.location_name}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs ${
                      routeData.stages.enroute.risk_level === 'LOW'
                        ? 'bg-green-100 text-[#287D3C]'
                        : routeData.stages.enroute.risk_level === 'MODERATE'
                        ? 'bg-amber-100 text-[#B7791F]'
                        : 'bg-red-100 text-[#B42318]'
                    }`}
                  >
                    {routeData.stages.enroute.risk_level}
                  </span>
                </div>
                <p className="text-xs text-[#1F2933] font-medium mb-2">
                  {routeData.stages.enroute.summary}
                </p>
                <div className="space-y-1 text-[11px] text-[#5B6770] border-t border-[#D6DCE1] pt-1.5">
                  <div className="flex justify-between">
                    <span>Conditions:</span>
                    <span className="font-semibold text-[#1F2933]">
                      {routeData.stages.enroute.weather_condition}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Upper Wind:</span>
                    <span className="font-semibold text-[#1F2933]">
                      {routeData.stages.enroute.wind_kts} kt
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Key Concerns:</span>
                    <span className="font-semibold text-[#1F2933]">
                      {routeData.stages.enroute.concerns.join(', ') || 'None reported'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Arrival Card */}
              <div className="border border-[#D6DCE1] rounded-xs p-3 bg-[#F5F7F9]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-[#17365D] text-white text-[10px] font-bold rounded-xs uppercase">
                      ARRIVAL
                    </span>
                    <span className="font-bold text-xs text-[#1F2933]">
                      {routeData.stages.arrival.location_name}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs ${
                      routeData.stages.arrival.risk_level === 'LOW'
                        ? 'bg-green-100 text-[#287D3C]'
                        : routeData.stages.arrival.risk_level === 'MODERATE'
                        ? 'bg-amber-100 text-[#B7791F]'
                        : 'bg-red-100 text-[#B42318]'
                    }`}
                  >
                    {routeData.stages.arrival.risk_level}
                  </span>
                </div>
                <p className="text-xs text-[#1F2933] font-medium mb-2">
                  {routeData.stages.arrival.summary}
                </p>
                <div className="space-y-1 text-[11px] text-[#5B6770] border-t border-[#D6DCE1] pt-1.5">
                  <div className="flex justify-between">
                    <span>Visibility:</span>
                    <span className="font-semibold text-[#1F2933]">
                      {routeData.stages.arrival.visibility_km} km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wind:</span>
                    <span className="font-semibold text-[#1F2933]">
                      {routeData.stages.arrival.wind_kts} kt
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conditions:</span>
                    <span className="font-semibold text-[#1F2933]">
                      {routeData.stages.arrival.weather_condition}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}



        {/* 8. Mandatory Aviation Safety Disclaimer */}
        <footer className="bg-[#FFFBEB] border border-[#FDE68A] p-3 rounded-xs text-[#92400E] text-xs flex items-start gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#B7791F]" />
          <div className="space-y-0.5 text-[11px] leading-relaxed">
            <div className="font-bold uppercase text-[10px] tracking-wider text-[#B7791F]">
              Aviation Meteorological Advisory Notice
            </div>
            <div>
              {routeData?.disclaimer ||
                'SkyRoute provides weather-based informational decision support. It is not a substitute for ATC instructions, official aviation weather products, NOTAMs, dispatch procedures, certified navigation systems, or pilot judgment.'}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};
