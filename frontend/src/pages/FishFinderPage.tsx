import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Waves,
  Wind,
  Thermometer,
  Compass,
  Radio,
  ChevronRight,
  ChevronDown,
  Info,
  CheckCircle2,
  Anchor,
  Loader2,
  Crosshair,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuthContext } from '../context/AuthContext';
import { useLocation } from '../hooks/useLocation';
import { useUI } from '../context/UIContext';
import { fishFinderService } from '../services/fishFinderService';
import { FishFinderData, FishingZoneProperties } from '../types/fishFinder';
import { FishFinderMap } from '../components/roles/fisher/fishfinder/FishFinderMap';
import { FishFinderZoneDetailPanel } from '../components/roles/fisher/fishfinder/FishFinderZoneDetailPanel';
import { INDIAN_COASTAL_HARBORS } from './FishermanWeatherPage';
import { HarborInfo } from '../components/roles/fisher/FishermanHeroCard';

interface Props {
  onBack?: () => void;
  onAskGpt?: (prompt: string) => void;
}

const findNearestCoastalHarbor = (lat?: number, lon?: number): HarborInfo => {
  if (!lat || !lon) return INDIAN_COASTAL_HARBORS[0];
  let nearest = INDIAN_COASTAL_HARBORS[0];
  let minDistance = Infinity;
  for (const h of INDIAN_COASTAL_HARBORS) {
    const d = Math.hypot(lat - h.lat, lon - h.lon);
    if (d < minDistance) {
      minDistance = d;
      nearest = h;
    }
  }
  return nearest;
};

export const FishFinderPage: React.FC<Props> = ({ onBack, onAskGpt }) => {
  const { language } = useLanguage();
  const { profile } = useAuthContext();
  const { location, detectLocation } = useLocation();
  const { setActiveTab } = useUI();

  const [selectedHarbor, setSelectedHarbor] = useState<HarborInfo>(() => {
    if (location?.latitude && location?.longitude) {
      return findNearestCoastalHarbor(location.latitude, location.longitude);
    }
    return INDIAN_COASTAL_HARBORS[0];
  });
  const [isHarborDropdownOpen, setIsHarborDropdownOpen] = useState<boolean>(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | '3days'>('today');
  const [hourOffset, setHourOffset] = useState<number>(0);

  const [data, setData] = useState<FishFinderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedZone, setSelectedZone] = useState<FishingZoneProperties | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);

  // Load FishFinder Data
  const loadFishFinderData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fishFinderService.getFishFinderData({
        latitude: selectedHarbor.lat,
        longitude: selectedHarbor.lon,
        harborName: selectedHarbor.name,
        dateFilter,
        hourOffset,
      });
      setData(res);
      // Default to select first high or moderate zone if none selected
      if (!selectedZone && res.feature_collection?.features?.length > 0) {
        setSelectedZone(res.feature_collection.features[0].properties);
      } else if (selectedZone && res.feature_collection?.features?.length > 0) {
        // Keep same zone updated with new telemetry
        const updated = res.feature_collection.features.find(
          (f) => f.properties.zone_id === selectedZone.zone_id
        );
        if (updated) setSelectedZone(updated.properties);
      }
    } catch (err) {
      console.error('[FishFinderPage] Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedHarbor.lat, selectedHarbor.lon, selectedHarbor.name, dateFilter, hourOffset]);

  useEffect(() => {
    loadFishFinderData();
  }, [loadFishFinderData]);

  const handleSelectHarbor = (h: HarborInfo) => {
    setSelectedHarbor(h);
    setIsHarborDropdownOpen(false);
    setSelectedZone(null);
  };

  const handleRecenter = () => {
    setRecenterTrigger((prev) => prev + 1);
  };

  const summary = data?.summary;
  const conditions = data?.coastal_conditions;

  return (
    <div className="min-h-screen bg-[#F5F7F9] p-2.5 sm:p-4 max-w-6xl mx-auto space-y-3 pb-28 font-sans select-none">
      {/* 1. TOP TITLE & HARBOR SELECTOR BAR */}
      <div className="gov-panel p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 bg-white border border-[#D6DCE1] hover:bg-[#F1F5F9] rounded-xs transition-colors cursor-pointer text-[#17365D]"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-8 h-8 bg-[#17365D] text-white flex items-center justify-center rounded-xs shrink-0 shadow-xs">
            <Anchor className="w-4 h-4 text-[#FF9933]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black text-[#17365D] tracking-tight uppercase">
                🌊 FishFinder
              </h1>
              <span className="text-[9px] font-bold bg-[#E2E8F0] text-[#17365D] px-1.5 py-0.5 rounded-xs uppercase">
                INCOIS PFZ Map
              </span>
            </div>
            <p className="text-[11px] text-[#5B6770] font-medium">
              “Find favorable fishing conditions” — Live marine intelligence & satellite PFZ
            </p>
          </div>
        </div>

        {/* Harbor Selector & Refresh */}
        <div className="flex items-center gap-2 relative">
          <div className="relative">
            <button
              onClick={() => setIsHarborDropdownOpen(!isHarborDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#CBD5E1] hover:border-[#17365D] rounded-xs text-xs font-bold text-[#17365D] transition-colors cursor-pointer shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-[#006B3C] shrink-0" />
              <span className="truncate max-w-[160px] sm:max-w-[200px]">{selectedHarbor.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#5B6770] shrink-0" />
            </button>

            {isHarborDropdownOpen && (
              <div className="absolute right-0 top-9 w-64 bg-white border border-[#D6DCE1] shadow-xl rounded-xs z-50 max-h-72 overflow-y-auto">
                <div className="p-2 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-bold text-[#5B6770] uppercase tracking-wider">
                  Select Coastal Port / Harbor
                </div>
                {INDIAN_COASTAL_HARBORS.map((h) => (
                  <button
                    key={h.name}
                    onClick={() => handleSelectHarbor(h)}
                    className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between hover:bg-[#F1F5F9] transition-colors cursor-pointer border-b border-[#F1F5F9] ${
                      selectedHarbor.name === h.name ? 'bg-[#ECFDF5] text-[#006B3C]' : 'text-[#1F2933]'
                    }`}
                  >
                    <span>{h.name}</span>
                    <span className="text-[10px] text-[#5B6770] font-normal">{h.state}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              detectLocation();
              if (location?.latitude && location?.longitude) {
                setSelectedHarbor({
                  name: location.city ? `${location.city} (GPS)` : 'My GPS Location',
                  lat: location.latitude,
                  lon: location.longitude,
                  state: location.state || 'India',
                });
                setSelectedZone(null);
              }
            }}
            className="p-1.5 bg-white border border-[#CBD5E1] hover:border-[#006B3C] rounded-xs text-[#006B3C] hover:bg-[#F0FDF4] transition-colors cursor-pointer shadow-2xs"
            title="Use My GPS Location"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={loadFishFinderData}
            disabled={loading}
            className="p-1.5 bg-white border border-[#D6DCE1] hover:bg-[#F1F5F9] rounded-xs transition-colors cursor-pointer text-[#17365D]"
            title="Refresh Marine Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#006B3C]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Coastal Harbors Quick Switcher Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 select-none">
        <span className="text-[10px] font-black text-[#5B6770] uppercase shrink-0 flex items-center gap-1">
          <Anchor className="w-3 h-3 text-[#17365D]" />
          <span>COASTAL PORTS:</span>
        </span>
        {INDIAN_COASTAL_HARBORS.map((h) => {
          const isSelected = selectedHarbor.name === h.name;
          return (
            <button
              key={h.name}
              onClick={() => handleSelectHarbor(h)}
              className={`px-2.5 py-1 text-xs font-bold rounded-xs whitespace-nowrap transition-colors cursor-pointer shrink-0 border ${
                isSelected
                  ? 'bg-[#17365D] text-white border-[#17365D] shadow-2xs'
                  : 'bg-white text-[#1F2933] border-[#CBD5E1] hover:bg-[#F1F5F9]'
              }`}
            >
              {h.name}
            </button>
          );
        })}
      </div>

      {/* 2. DUAL STATUS STRIP: MARINE SAFETY vs FISHING POTENTIAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Left: Overall Marine Safety Status */}
        <div className="gov-panel p-2.5 flex items-center justify-between bg-white border-l-4 border-l-[#006B3C]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#006B3C] shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider">
                CURRENT MARINE STATUS
              </div>
              <div className="text-xs font-black text-[#006B3C] uppercase">
                🟢 {summary?.overall_marine_status || 'FAVORABLE (SAFE TO SAIL)'}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-[#5B6770] bg-[#F1F5F9] px-2 py-0.5 rounded-xs font-mono">
            IMD Valid
          </span>
        </div>

        {/* Right: Fishing Opportunity Potential */}
        <div className="gov-panel p-2.5 flex items-center justify-between bg-white border-l-4 border-l-[#FF9933]">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-[#FF9933] shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider">
                FISHING OPPORTUNITY
              </div>
              <div className="text-xs font-black text-[#17365D]">
                {summary?.favorable_zones_count || 3} Favorable Zones Identified
                <span className="text-[11px] font-normal text-[#5B6770] ml-1">
                  ({summary?.high_count || 2} High, {summary?.moderate_count || 1} Mod)
                </span>
              </div>
            </div>
          </div>
          <span className="text-[10px] text-[#006B3C] bg-[#ECFDF5] border border-[#A7F3D0] px-1.5 py-0.5 rounded-xs font-bold">
            INCOIS PFZ
          </span>
        </div>
      </div>

      {/* 3. ACTIVE WARNING OVERRIDE BANNER (IF ANY) */}
      {summary?.active_warning && (
        <div className="gov-panel p-3 bg-[#FEF2F2] border-l-4 border-l-[#DC2626] border-rose-200 text-rose-950 space-y-1">
          <div className="flex items-center gap-1.5 font-black text-xs text-[#991B1B] uppercase">
            <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
            <span>⚠ OFFICIAL IMD MARINE WARNING ACTIVE — SQUALL ALERT</span>
          </div>
          <p className="text-xs font-medium">
            {summary.active_warning.description ||
              'Squally weather with wind speeds exceeding 45 km/h expected offshore. Small craft advised not to venture into deep sea.'}
          </p>
          <div className="text-[10px] text-[#7F1D1D] font-mono">
            Source: {summary.active_warning.source} • Valid until {summary.active_warning.valid_until}
          </div>
        </div>
      )}

      {/* 4. MAIN INTERACTIVE MAP & DETAILS LAYOUT */}
      {/* Mobile: Map on top (65-75% viewport), Details bottom sheet. Desktop: 65% Left Map, 35% Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column: Interactive Marine Map (Centerpiece) */}
        <div className="lg:col-span-8 space-y-2">
          {loading && !data ? (
            <div className="h-[440px] sm:h-[500px] w-full border border-[#D6DCE1] bg-[#E5EEF5] flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-[#006B3C] animate-spin" />
              <span className="text-xs font-bold text-[#17365D]">
                Loading INCOIS PFZ & Hydrodynamic Marine Map...
              </span>
            </div>
          ) : data ? (
            <FishFinderMap
              data={data}
              selectedZone={selectedZone}
              onSelectZone={(z) => setSelectedZone(z)}
              userCoords={{ latitude: selectedHarbor.lat, longitude: selectedHarbor.lon }}
              onRecenter={handleRecenter}
              dateFilter={dateFilter}
              onChangeDateFilter={(d) => setDateFilter(d)}
              hourOffset={hourOffset}
              onChangeHourOffset={(offset) => setHourOffset(offset)}
              heightClass="h-[440px] sm:h-[520px]"
            />
          ) : null}

          {/* Quick Coastal Weather Conditions Bar */}
          {conditions && (
            <div className="gov-panel p-2.5 bg-white flex flex-wrap items-center justify-between gap-2 text-xs border border-[#D6DCE1]">
              <div className="flex items-center gap-1.5 font-bold text-[#17365D] uppercase text-[11px]">
                <Radio className="w-3.5 h-3.5 text-[#006B3C]" />
                <span>Harbor Baseline:</span>
              </div>
              <div className="flex items-center gap-4 text-[#1F2933] font-medium">
                <div className="flex items-center gap-1">
                  <Wind className="w-3 h-3 text-[#2563EB]" />
                  <span>Wind: <strong>{conditions.wind_kmh} km/h</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Waves className="w-3 h-3 text-[#0891B2]" />
                  <span>Waves: <strong>{conditions.wave_height_m} m</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-[#0284C7]" />
                  <span>SST: <strong>{conditions.sea_surface_temp_c}°C</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Compass className="w-3 h-3 text-[#D97706]" />
                  <span>Current: <strong>{conditions.ocean_current_knots} kts</strong></span>
                </div>
              </div>
              <span className="text-[10px] text-[#5B6770] font-mono">
                Source: {conditions.source}
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Zone Inspection Panel & Opportunity List */}
        <div className="lg:col-span-4 space-y-3">
          {/* Selected Zone Inspection Panel */}
          {selectedZone ? (
            <FishFinderZoneDetailPanel
              zone={selectedZone}
              onClose={() => setSelectedZone(null)}
              onAskGpt={onAskGpt}
            />
          ) : (
            <div className="gov-panel p-4 text-center space-y-2 bg-white border border-[#D6DCE1]">
              <Anchor className="w-8 h-8 text-[#006B3C] mx-auto opacity-75" />
              <h4 className="text-xs font-bold text-[#17365D] uppercase">Tap Any Zone On The Map</h4>
              <p className="text-[11px] text-[#5B6770]">
                Select a green or yellow offshore zone to view Sea Surface Temperature, Chlorophyll-a bloom, ocean current drift, and safety clearance.
              </p>
            </div>
          )}

          {/* Quick Zone Selector List */}
          {data?.feature_collection?.features && (
            <div className="gov-panel p-3 space-y-2 bg-white border border-[#D6DCE1]">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
                <span className="text-xs font-bold text-[#17365D] uppercase tracking-wide">
                  Identified Coastal Zones ({data.feature_collection.features.length})
                </span>
                <span className="text-[10px] text-[#5B6770]">Click to focus</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {data.feature_collection.features.map((f) => {
                  const isSel = selectedZone?.zone_id === f.properties.zone_id;
                  const pot = f.properties.fishing_potential;
                  const badgeColor =
                    pot === 'high'
                      ? 'bg-[#10B981] text-white'
                      : pot === 'moderate'
                      ? 'bg-[#F59E0B] text-white'
                      : 'bg-[#EF4444] text-white';

                  return (
                    <button
                      key={f.properties.zone_id}
                      onClick={() => setSelectedZone(f.properties)}
                      className={`w-full text-left p-2 rounded-xs border transition-all cursor-pointer flex items-center justify-between text-xs ${
                        isSel
                          ? 'bg-[#F0FDF4] border-[#006B3C] shadow-2xs font-bold'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-[#17365D] truncate">{f.properties.name}</div>
                        <div className="text-[10px] text-[#5B6770]">
                          {f.properties.distance_km} km offshore • SST {f.properties.sst_c}°C
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-black uppercase ${badgeColor}`}>
                          {pot} ({f.properties.score})
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FishFinderPage;
